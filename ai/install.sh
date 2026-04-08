#!/bin/sh
#
# AI Tools Configuration
#
# Single source of truth for AI tool configuration:
# - Unified instruction files (CLAUDE.md, AGENTS.md, etc.)
# - Repo runtime skill projections plus installed skills/agents
#   for Claude Code, Codex, and OpenCode
#
# Usage:
#   ./install.sh          # Normal install (warns about misconfigurations)
#   ./install.sh --force  # Fix symlinks pointing to wrong locations

set -e

# Parse arguments
FORCE=false
if [ "$1" = "--force" ]; then
  FORCE=true
fi

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"

# Shared symlink helpers
. "$DOTFILES_ROOT/lib/symlink.sh"

if [ "$FORCE" = "true" ]; then
  log_force_enabled
fi

_TMPFILES=""
_cleanup() {
  for f in $_TMPFILES; do
    rm -f "$f"
  done
}
trap _cleanup EXIT INT TERM

# ensure_symlink is provided by lib/symlink.sh (sourced above)

MANAGED_INSTRUCTIONS_MARKER='<!-- Managed by ~/.dotfiles/ai/install.sh. Edit source files instead. -->'
MANAGED_AGENT_MARKER='# Managed by ~/.dotfiles/ai/install.sh. Edit source files instead.'

is_legacy_instruction_symlink() {
  legacy_target="$1"

  case "$legacy_target" in
    "$HOME/.AGENTS.md")
      return 0
      ;;
  esac

  return 1
}

_handle_unexpected_symlink() {
  current="$1"
  target="$2"
  desc="$3"
  src_tmp="$4"

  if [ "$FORCE" = "true" ]; then
    log_info "Replacing symlinked $desc (was: $current)"
    rm "$target"
    return 0
  fi

  log_warn "$desc is a symlink to an unexpected location"
  log_hint "Current:  $current"
  log_hint "Expected: installer-managed file"
  log_hint "Fix: rm \"$target\" && dot"
  rm "$src_tmp"
  return 1
}

write_managed_file() {
  src_tmp="$1"
  target="$2"
  desc="$3"

  mkdir -p "$(dirname "$target")"

  if [ -L "$target" ]; then
    current="$(normalize_symlink_path "$(readlink "$target")")"
    if [ "$target" = "$HOME/.AGENTS.md" ] && [ ! -e "$target" ]; then
      echo "  Replacing legacy symlink: $desc"
      rm "$target"
    elif is_legacy_instruction_symlink "$current"; then
      echo "  Replacing legacy symlink: $desc"
      rm "$target"
    else
      _handle_unexpected_symlink "$current" "$target" "$desc" "$src_tmp" || return 0
    fi
  elif [ -e "$target" ]; then
    if grep -Fq "$MANAGED_INSTRUCTIONS_MARKER" "$target" 2>/dev/null; then
      :
    elif [ "$FORCE" = "true" ]; then
      echo "  Replacing existing $desc"
      rm -f "$target"
    else
      echo "  Warning: $desc exists and is not installer-managed"
      echo "    Skipping to preserve existing content"
      echo "    Fix: mv \"$target\" \"$target.bak\" && dot"
      rm "$src_tmp"
      return 0
    fi
  fi

  if [ -f "$target" ] && cmp -s "$src_tmp" "$target"; then
    echo "  $desc already up to date"
    rm "$src_tmp"
    return 0
  fi

  mv "$src_tmp" "$target"
  echo "  Wrote $desc"
}

write_managed_agent_file() {
  src_tmp="$1"
  target="$2"
  desc="$3"
  legacy_suffix="$4"

  mkdir -p "$(dirname "$target")"

  if [ -L "$target" ]; then
    current="$(normalize_symlink_path "$(readlink "$target")")"
    if [ -n "$legacy_suffix" ]; then
      case "$current" in
        *"$legacy_suffix")
          echo "  Replacing legacy symlink: $desc"
          rm "$target"
          ;;
        *)
          _handle_unexpected_symlink "$current" "$target" "$desc" "$src_tmp" || return 0
          ;;
      esac
    else
      _handle_unexpected_symlink "$current" "$target" "$desc" "$src_tmp" || return 0
    fi
  elif [ -e "$target" ]; then
    if grep -Fq "$MANAGED_AGENT_MARKER" "$target" 2>/dev/null; then
      :
    elif [ "$FORCE" = "true" ]; then
      echo "  Replacing existing $desc"
      rm -f "$target"
    else
      echo "  Warning: $desc exists and is not installer-managed"
      echo "    Skipping to preserve existing content"
      echo "    Fix: mv \"$target\" \"$target.bak\" && dot"
      rm "$src_tmp"
      return 0
    fi
  fi

  if [ -f "$target" ] && cmp -s "$src_tmp" "$target"; then
    echo "  $desc already up to date"
    rm "$src_tmp"
    return 0
  fi

  mv "$src_tmp" "$target"
  echo "  Wrote $desc"
}

assemble_instruction_file() {
  target="$1"
  desc="$2"
  appendix_src="$3"

  mkdir -p "$(dirname "$target")"
  tmp_file="$(mktemp "$(dirname "$target")/.dotfiles-instructions.XXXXXX")"
  _TMPFILES="$_TMPFILES $tmp_file"

  {
    printf '%s\n\n' "$MANAGED_INSTRUCTIONS_MARKER"
    cat "$SHARED_INSTRUCTIONS_BASE"
    if [ -n "$appendix_src" ] && [ -f "$appendix_src" ]; then
      printf '\n\n'
      cat "$appendix_src"
    fi
  } > "$tmp_file"

  write_managed_file "$tmp_file" "$target" "$desc"
}

assemble_agent_file() {
  frontmatter_src="$1"
  body_src="$2"
  appendix_src="$3"
  target="$4"
  desc="$5"
  legacy_suffix="$6"

  if [ ! -f "$frontmatter_src" ]; then
    echo "  ERROR: missing agent frontmatter: $frontmatter_src"
    exit 1
  fi

  if [ ! -f "$body_src" ]; then
    echo "  ERROR: missing shared agent body: $body_src"
    exit 1
  fi

  mkdir -p "$(dirname "$target")"
  tmp_file="$(mktemp "$(dirname "$target")/.dotfiles-agent.XXXXXX")"
  _TMPFILES="$_TMPFILES $tmp_file"

  {
    printf '%s\n' '---'
    cat "$frontmatter_src"
    printf '%s\n' '---'
    printf '%s\n\n' "$MANAGED_AGENT_MARKER"
    cat "$body_src"
    if [ -n "$appendix_src" ] && [ -f "$appendix_src" ]; then
      printf '\n\n'
      cat "$appendix_src"
    fi
  } > "$tmp_file"

  write_managed_agent_file "$tmp_file" "$target" "$desc" "$legacy_suffix"
}

#
# Helper: Clean dead symlinks from a directory
#
clean_dead_symlinks() {
  dir="$1"
  [ -d "$dir" ] || return 0
  for link in "$dir"/*; do
    [ -L "$link" ] || continue
    [ -e "$link" ] && continue
    echo "  Removing dead symlink: $(basename "$link")"
    rm "$link"
  done
}

clean_stale_managed_markdown_files() {
  dir="$1"
  marker="$2"
  expected_names="$3"

  [ -d "$dir" ] || return 0

  for file in "$dir"/*.md; do
    [ -f "$file" ] || continue
    if ! grep -Fq "$marker" "$file" 2>/dev/null; then
      continue
    fi

    name="$(basename "$file")"
    keep=false
    for expected in $expected_names; do
      if [ "$name" = "$expected" ]; then
        keep=true
        break
      fi
    done

    if [ "$keep" = "false" ]; then
      echo "  Removing stale managed file: $name"
      rm "$file"
    fi
  done
}

#
# Helper: Materialize a runtime skill directory
#
# Usage: sync_skill_runtime_dir <target_dir> <label> [overlay_source_dir]
#
# Behavior:
# - A provider-aware projected shared-skill source is always the baseline
# - Optional harness-specific overlays are applied second
# - Target directories are runtime outputs, not authoring sources
#
sync_skill_runtime_dir() {
  baseline_src="$1"
  target_dir="$2"
  label="$3"
  overlay_src="$4"

  mkdir -p "$target_dir"
  clean_dead_symlinks "$target_dir"

  if [ -d "$baseline_src" ]; then
    for skill_dir in "$baseline_src"/*/; do
      [ -d "$skill_dir" ] || continue
      skill_name=$(basename "$skill_dir")
      ensure_runtime_overlay_symlink "$skill_dir" "$target_dir/$skill_name" "$label/$skill_name (shared)"
    done
  fi

  if [ -n "$overlay_src" ] && [ -d "$overlay_src" ]; then
    for skill_dir in "$overlay_src"/*/; do
      [ -d "$skill_dir" ] || continue
      skill_name=$(basename "$skill_dir")
      ensure_runtime_overlay_symlink "$skill_dir" "$target_dir/$skill_name" "$label/$skill_name (overlay)"
    done
  fi
}

#
# Helper: Apply a managed symlink in an installer-managed runtime directory
#
# Behavior:
# - If the target is already a symlink, replace it so managed runtime output wins
# - If the target is a regular file/dir, preserve it and warn via ensure_symlink
# - If the target is missing, create it
#
ensure_runtime_overlay_symlink() {
  src="$(normalize_symlink_path "$1")"
  target="$2"
  desc="$3"

  if [ -L "$target" ]; then
    current="$(normalize_symlink_path "$(readlink "$target")")"
    if [ -e "$target" ] && [ "$current" = "$src" ]; then
      echo "  $desc already linked correctly"
      return 0
    fi

    echo "  Re-linking $desc"
    rm "$target"
    ln -s "$src" "$target"
    return 0
  fi

  ensure_symlink "$src" "$target" "$desc"
}

log_info "Setting up AI instruction files..."

SHARED_INSTRUCTIONS_BASE="$DOTFILES_ROOT/ai/instructions/base.md"
CLAUDE_INSTRUCTIONS_APPENDIX="$DOTFILES_ROOT/claude/instructions/appendix.md"
PI_INSTRUCTIONS_APPENDIX="$DOTFILES_ROOT/pi/instructions/appendix.md"
OPENCODE_INSTRUCTIONS_APPENDIX="$DOTFILES_ROOT/opencode/instructions/appendix.md"

if [ ! -f "$SHARED_INSTRUCTIONS_BASE" ]; then
  echo "  ERROR: missing shared instruction base: $SHARED_INSTRUCTIONS_BASE"
  exit 1
fi

assemble_instruction_file "$HOME/.AGENTS.md" "$HOME/.AGENTS.md (shared base compatibility file)" ""

# Claude: CLAUDE.md in ~/.claude/ (user-level instructions)
# Note: ~/CLAUDE.md is NOT used — it would be discovered by Pi's upward
# directory traversal, causing duplicate instructions. ~/.claude/CLAUDE.md
# is Claude Code's dedicated user-level location and avoids this.
mkdir -p "$HOME/.claude"
assemble_instruction_file "$HOME/.claude/CLAUDE.md" "$HOME/.claude/CLAUDE.md" "$CLAUDE_INSTRUCTIONS_APPENDIX"

# Clean up legacy ~/CLAUDE.md symlink if it points to AGENTS
if [ -L "$HOME/CLAUDE.md" ]; then
  legacy_target="$(readlink "$HOME/CLAUDE.md")"
  case "$legacy_target" in
    *AGENTS*|*agents*)
      echo "  Removing legacy ~/CLAUDE.md symlink (moved to ~/.claude/CLAUDE.md)"
      rm "$HOME/CLAUDE.md"
      ;;
  esac
fi

# OpenCode: AGENTS.md in ~/.config/opencode/
mkdir -p "$HOME/.config/opencode"
assemble_instruction_file "$HOME/.config/opencode/AGENTS.md" "$HOME/.config/opencode/AGENTS.md" "$OPENCODE_INSTRUCTIONS_APPENDIX"

# Gemini: GEMINI.md in ~/.gemini/
mkdir -p "$HOME/.gemini"
assemble_instruction_file "$HOME/.gemini/GEMINI.md" "$HOME/.gemini/GEMINI.md" ""

# Codex: instructions.md in ~/.codex/
mkdir -p "$HOME/.codex"
assemble_instruction_file "$HOME/.codex/instructions.md" "$HOME/.codex/instructions.md" ""

# Pi: shared AGENTS.md projected once to ~/.pi/agent/, then shared into the
# active work/personal profile roots.
mkdir -p "$HOME/.pi/agent" "$HOME/.pi/work" "$HOME/.pi/personal"
assemble_instruction_file "$HOME/.pi/agent/AGENTS.md" "$HOME/.pi/agent/AGENTS.md" "$PI_INSTRUCTIONS_APPENDIX"
ensure_symlink "$HOME/.pi/agent/AGENTS.md" "$HOME/.pi/work/AGENTS.md" "$HOME/.pi/work/AGENTS.md"
ensure_symlink "$HOME/.pi/agent/AGENTS.md" "$HOME/.pi/personal/AGENTS.md" "$HOME/.pi/personal/AGENTS.md"

#
# Skills and Agents (single source of truth for all AI tools)
#
# Portable skills are authored once in ai/skills/ and projected into
# provider-aware runtime sources under .ai-runtime/.
# Runtime directories such as .agents/skills/ and .claude/skills/ are generated
# outputs, not authoring homes. Claude-specific skills in claude/skills/ remain
# optional overlays that each runtime can opt into explicitly.
#

CLAUDE_DIR="$HOME/.claude"
SHARED_SKILLS_SRC="$DOTFILES_ROOT/ai/skills"
CLAUDE_SKILLS_SRC="$DOTFILES_ROOT/claude/skills"
SHARED_AGENTS_SRC="$DOTFILES_ROOT/ai/agents"
CLAUDE_AGENTS_SRC="$DOTFILES_ROOT/claude/agents"
PI_AGENTS_SRC="$DOTFILES_ROOT/pi/agents"
OPENCODE_DIR="$HOME/.config/opencode"
PROJECTED_SKILLS_ROOT="$DOTFILES_ROOT/.ai-runtime"
PROJECTED_CODEX_SKILLS_SRC="$PROJECTED_SKILLS_ROOT/codex/skills"
PROJECTED_CLAUDE_SKILLS_SRC="$PROJECTED_SKILLS_ROOT/claude-code/skills"
PROJECTED_OPENCODE_SKILLS_SRC="$PROJECTED_SKILLS_ROOT/opencode/skills"
PROJECTED_PI_SKILLS_SRC="$PROJECTED_SKILLS_ROOT/pi/skills"
PROJECT_AGENTS_SKILLS_DIR="$DOTFILES_ROOT/.agents/skills"
PROJECT_CLAUDE_SKILLS_DIR="$DOTFILES_ROOT/.claude/skills"
REVIEW_BODY_SRC="$SHARED_AGENTS_SRC/review.body.md"
CLAUDE_REVIEW_FRONTMATTER="$CLAUDE_AGENTS_SRC/review.frontmatter"
CLAUDE_REVIEW_APPENDIX="$CLAUDE_AGENTS_SRC/review.appendix.md"
PI_REVIEW_FRONTMATTER="$PI_AGENTS_SRC/review.frontmatter"
PI_REVIEW_APPENDIX="$PI_AGENTS_SRC/review.appendix.md"

if ! command -v node >/dev/null 2>&1; then
  echo "  ERROR: node is required to project shared skills"
  exit 1
fi

log_info "Refreshing projected shared skill sources..."
node "$DOTFILES_ROOT/ai/scripts/project-skills.mjs" codex "$SHARED_SKILLS_SRC" "$PROJECTED_CODEX_SKILLS_SRC"
node "$DOTFILES_ROOT/ai/scripts/project-skills.mjs" claude-code "$SHARED_SKILLS_SRC" "$PROJECTED_CLAUDE_SKILLS_SRC"
node "$DOTFILES_ROOT/ai/scripts/project-skills.mjs" opencode "$SHARED_SKILLS_SRC" "$PROJECTED_OPENCODE_SKILLS_SRC"
node "$DOTFILES_ROOT/ai/scripts/project-skills.mjs" pi "$SHARED_SKILLS_SRC" "$PROJECTED_PI_SKILLS_SRC"

# Repo-local runtime skill projections
log_info "Refreshing repo runtime skills..."
sync_skill_runtime_dir "$PROJECTED_CODEX_SKILLS_SRC" "$PROJECT_AGENTS_SKILLS_DIR" ".agents/skills" ""
sync_skill_runtime_dir "$PROJECTED_CLAUDE_SKILLS_SRC" "$PROJECT_CLAUDE_SKILLS_DIR" ".claude/skills" "$CLAUDE_SKILLS_SRC"

# Claude Code skills
log_info "Setting up Claude Code skills..."
sync_skill_runtime_dir "$PROJECTED_CLAUDE_SKILLS_SRC" "$CLAUDE_DIR/skills" "$CLAUDE_DIR/skills" "$CLAUDE_SKILLS_SRC"

# Claude Code agents
if [ -d "$CLAUDE_AGENTS_SRC" ]; then
  log_info "Setting up Claude Code agents..."
  mkdir -p "$CLAUDE_DIR/agents"
  clean_dead_symlinks "$CLAUDE_DIR/agents"
  claude_generated_agents=""

  if [ -f "$REVIEW_BODY_SRC" ] && [ -f "$CLAUDE_REVIEW_FRONTMATTER" ]; then
    claude_generated_agents="review.md"
  fi

  clean_stale_managed_markdown_files "$CLAUDE_DIR/agents" "$MANAGED_AGENT_MARKER" "$claude_generated_agents"

  if [ -n "$claude_generated_agents" ]; then
    assemble_agent_file \
      "$CLAUDE_REVIEW_FRONTMATTER" \
      "$REVIEW_BODY_SRC" \
      "$CLAUDE_REVIEW_APPENDIX" \
      "$CLAUDE_DIR/agents/review.md" \
      "$CLAUDE_DIR/agents/review.md" \
      "claude/agents/review.md"
  fi

  for agent_file in "$CLAUDE_AGENTS_SRC"/*.md; do
    [ -e "$agent_file" ] || continue
    case "$agent_file" in
      *.appendix.md)
        continue
        ;;
    esac
    agent_name=$(basename "$agent_file")
    ensure_symlink "$agent_file" "$CLAUDE_DIR/agents/$agent_name" "$CLAUDE_DIR/agents/$agent_name"
  done
fi

# Pi agents
log_info "Setting up Pi agents..."
PI_AGENT_DIR="$HOME/.pi/agent/agents"
mkdir -p "$PI_AGENT_DIR"
clean_dead_symlinks "$PI_AGENT_DIR"
pi_generated_agents=""

if [ -f "$REVIEW_BODY_SRC" ] && [ -f "$PI_REVIEW_FRONTMATTER" ]; then
  pi_generated_agents="review.md"
fi

clean_stale_managed_markdown_files "$PI_AGENT_DIR" "$MANAGED_AGENT_MARKER" "$pi_generated_agents"

if [ -n "$pi_generated_agents" ]; then
  assemble_agent_file \
    "$PI_REVIEW_FRONTMATTER" \
    "$REVIEW_BODY_SRC" \
    "$PI_REVIEW_APPENDIX" \
    "$PI_AGENT_DIR/review.md" \
    "$PI_AGENT_DIR/review.md" \
    "pi/agents/review.md"
fi

# Symlink standalone Pi agent files (skip frontmatter, appendix, and body fragments)
for agent_file in "$PI_AGENTS_SRC"/*.md; do
  [ -e "$agent_file" ] || continue
  case "$agent_file" in
    *.appendix.md|*.body.md)
      continue
      ;;
  esac
  agent_name=$(basename "$agent_file")
  ensure_symlink "$agent_file" "$PI_AGENT_DIR/$agent_name" "$PI_AGENT_DIR/$agent_name"
done

# Share the same global Pi agents into both active profile roots.
mkdir -p "$HOME/.pi/work" "$HOME/.pi/personal"
ensure_symlink "$PI_AGENT_DIR" "$HOME/.pi/work/agents" "$HOME/.pi/work/agents"
ensure_symlink "$PI_AGENT_DIR" "$HOME/.pi/personal/agents" "$HOME/.pi/personal/agents"

# OpenCode skills
log_info "Setting up OpenCode skills..."
# Note: OpenCode uses 'skill' not 'skills'. It gets only portable shared skills.
sync_skill_runtime_dir "$PROJECTED_OPENCODE_SKILLS_SRC" "$OPENCODE_DIR/skill" "$OPENCODE_DIR/skill" ""

# OpenCode agents
# NOTE: Claude agents use incompatible frontmatter (tools: comma string vs YAML record).
# Skipping symlink until OpenCode-specific agents are created.
# See: https://opencode.ai/docs/agents/
# Clean up stale agent symlinks from before this was disabled.
if [ -d "$OPENCODE_DIR/agents" ]; then
  clean_dead_symlinks "$OPENCODE_DIR/agents"
  for link in "$OPENCODE_DIR/agents"/*; do
    [ -L "$link" ] || continue
    target="$(readlink "$link")"
    case "$target" in
      */claude/agents/*)
        echo "  Removing stale OpenCode agent symlink: $(basename "$link") (Claude-incompatible)"
        rm "$link"
        ;;
    esac
  done
  # Remove empty agents dir
  rmdir "$OPENCODE_DIR/agents" 2>/dev/null || true
fi

log_success "AI configuration complete!"
