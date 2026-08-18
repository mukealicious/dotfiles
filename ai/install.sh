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
PI_STAGE_TREE=""
_cleanup() {
  for f in $_TMPFILES; do
    rm -f "$f"
  done
  [ -z "$PI_STAGE_TREE" ] || rm -rf "$PI_STAGE_TREE"
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

pi_profile_error() {
  echo "  ERROR: $1" >&2
  return 1
}

is_exact_symlink() {
  target="$1"
  expected="$2"
  [ -L "$target" ] && [ "$(readlink "$target")" = "$expected" ]
}

validate_staged_pi_tree() {
  tree="$1"

  [ -f "$tree/AGENTS.md" ] || pi_profile_error "staged Pi tree is missing AGENTS.md"
  [ -d "$tree/agents" ] || pi_profile_error "staged Pi tree is missing agents/"
  [ -d "$tree/skills" ] || pi_profile_error "staged Pi tree is missing skills/"

  set -- "$tree/agents"/*.md
  [ -f "$1" ] || pi_profile_error "staged Pi tree contains no managed agents"
  set -- "$tree/skills"/*
  [ -e "$1" ] || pi_profile_error "staged Pi tree contains no projected skills"
}

preflight_pi_profile() {
  profile_dir="$1"
  staged_tree="$2"
  instruction="$profile_dir/AGENTS.md"
  agents_dir="$profile_dir/agents"
  legacy_instruction="$HOME/.pi/agent/AGENTS.md"
  legacy_agents_dir="$HOME/.pi/agent/agents"

  if [ -e "$instruction" ] || [ -L "$instruction" ]; then
    if ! is_exact_symlink "$instruction" "$PI_RUNTIME_TREE/AGENTS.md" && ! is_exact_symlink "$instruction" "$legacy_instruction"; then
      pi_profile_error "$instruction is not the installer-managed link; preserve it and move it before rerunning"
      return 1
    fi
  fi

  if [ -e "$agents_dir" ] || [ -L "$agents_dir" ]; then
    if [ -L "$agents_dir" ]; then
      if ! is_exact_symlink "$agents_dir" "$legacy_agents_dir"; then
        pi_profile_error "$agents_dir must be a real directory for profile-local agents; refusing to replace its unrelated link"
        return 1
      fi
      return 0
    elif [ ! -d "$agents_dir" ]; then
      pi_profile_error "$agents_dir exists but is not a directory"
      return 1
    fi
  fi

  [ -d "$agents_dir" ] || return 0
  for managed_agent in "$staged_tree/agents"/*.md; do
    [ -f "$managed_agent" ] || continue
    name="$(basename "$managed_agent")"
    target="$agents_dir/$name"
    [ -e "$target" ] || [ -L "$target" ] || continue
    if is_exact_symlink "$target" "$PI_RUNTIME_TREE/agents/$name" || is_exact_symlink "$target" "$legacy_agents_dir/$name"; then
      continue
    fi
    pi_profile_error "managed agent collision at $target; rename or remove the profile-local entry before rerunning"
    return 1
  done
}

link_pi_profile_resources() {
  profile_dir="$1"
  tree="$2"
  instruction="$profile_dir/AGENTS.md"
  agents_dir="$profile_dir/agents"
  legacy_instruction="$HOME/.pi/agent/AGENTS.md"
  legacy_agents_dir="$HOME/.pi/agent/agents"

  mkdir -p "$profile_dir"
  if is_exact_symlink "$instruction" "$legacy_instruction"; then
    echo "  Replacing legacy Pi instruction link: $instruction"
    rm "$instruction"
  fi
  if [ ! -e "$instruction" ] && [ ! -L "$instruction" ]; then
    ln -s "$tree/AGENTS.md" "$instruction"
    echo "  Linked $instruction"
  fi

  if is_exact_symlink "$agents_dir" "$legacy_agents_dir"; then
    echo "  Replacing legacy Pi agents link: $agents_dir"
    rm "$agents_dir"
  fi
  mkdir -p "$agents_dir"

  # Remove only stale links previously managed by this generated tree. Preserve
  # profile-local files and links with any other owner.
  for target in "$agents_dir"/*.md; do
    [ -L "$target" ] || continue
    current="$(readlink "$target")"
    case "$current" in
      "$tree/agents/"*)
        [ -e "$target" ] && continue
        echo "  Removing stale managed Pi agent link: $target"
        rm "$target"
        ;;
    esac
  done

  for managed_agent in "$tree/agents"/*.md; do
    [ -f "$managed_agent" ] || continue
    name="$(basename "$managed_agent")"
    target="$agents_dir/$name"
    if is_exact_symlink "$target" "$legacy_agents_dir/$name"; then
      echo "  Replacing legacy Pi agent link: $target"
      rm "$target"
    fi
    if [ ! -e "$target" ] && [ ! -L "$target" ]; then
      ln -s "$managed_agent" "$target"
      echo "  Linked $target"
    fi
  done
}

swap_staged_pi_tree() {
  stage="$1"
  destination="$2"
  parent="$(dirname "$destination")"
  previous=""

  if [ -e "$destination" ] || [ -L "$destination" ]; then
    previous="$(mktemp -d "$parent/.pi.previous.XXXXXX")"
    rmdir "$previous"
    if ! mv "$destination" "$previous"; then
      pi_profile_error "could not prepare the previous generated Pi tree for replacement"
      return 1
    fi
  fi

  if ! mv "$stage" "$destination"; then
    if [ -n "$previous" ]; then
      mv "$previous" "$destination" || pi_profile_error "could not restore the previous generated Pi tree after a failed swap"
    fi
    pi_profile_error "could not activate the staged Pi tree"
    return 1
  fi

  [ -z "$previous" ] || rm -rf "$previous"
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
PROJECT_AGENTS_SKILLS_DIR="$DOTFILES_ROOT/.agents/skills"
PROJECT_CLAUDE_SKILLS_DIR="$DOTFILES_ROOT/.claude/skills"
REVIEW_BODY_SRC="$SHARED_AGENTS_SRC/review.body.md"
CLAUDE_REVIEW_FRONTMATTER="$CLAUDE_AGENTS_SRC/review.frontmatter"
CLAUDE_REVIEW_APPENDIX="$CLAUDE_AGENTS_SRC/review.appendix.md"
PI_REVIEW_FRONTMATTER="$PI_AGENTS_SRC/review.frontmatter"
PI_REVIEW_APPENDIX="$PI_AGENTS_SRC/review.appendix.md"

if command -v mise >/dev/null 2>&1 && mise which -C "$DOTFILES_ROOT" node >/dev/null 2>&1; then
  run_node() {
    mise exec -C "$DOTFILES_ROOT" -- node "$@"
  }
elif command -v node >/dev/null 2>&1; then
  run_node() {
    node "$@"
  }
else
  echo "  ERROR: node is required to project shared skills"
  exit 1
fi

log_info "Refreshing projected shared skill sources..."
run_node "$DOTFILES_ROOT/ai/scripts/project-skills.mjs" codex "$SHARED_SKILLS_SRC" "$PROJECTED_CODEX_SKILLS_SRC"
run_node "$DOTFILES_ROOT/ai/scripts/project-skills.mjs" claude-code "$SHARED_SKILLS_SRC" "$PROJECTED_CLAUDE_SKILLS_SRC"
run_node "$DOTFILES_ROOT/ai/scripts/project-skills.mjs" opencode "$SHARED_SKILLS_SRC" "$PROJECTED_OPENCODE_SKILLS_SRC"

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

# Pi generated resources. Build and validate a complete sibling tree before
# changing the active tree or either profile's resource links.
log_info "Staging generated Pi resources..."
PI_RUNTIME_TREE="$PROJECTED_SKILLS_ROOT/pi"
PI_STAGE_TREE="$(mktemp -d "$PROJECTED_SKILLS_ROOT/.pi.stage.XXXXXX")"
mkdir -p "$PI_STAGE_TREE/agents"
assemble_instruction_file "$PI_STAGE_TREE/AGENTS.md" "$PI_STAGE_TREE/AGENTS.md" "$PI_INSTRUCTIONS_APPENDIX"
run_node "$DOTFILES_ROOT/ai/scripts/project-skills.mjs" pi "$SHARED_SKILLS_SRC" "$PI_STAGE_TREE/skills"

if [ -f "$REVIEW_BODY_SRC" ] && [ -f "$PI_REVIEW_FRONTMATTER" ]; then
  assemble_agent_file \
    "$PI_REVIEW_FRONTMATTER" \
    "$REVIEW_BODY_SRC" \
    "$PI_REVIEW_APPENDIX" \
    "$PI_STAGE_TREE/agents/review.md" \
    "$PI_STAGE_TREE/agents/review.md" \
    ""
fi

# Materialize standalone Pi agents so the generated tree does not depend on a
# profile or the deprecated fallback directory.
for agent_file in "$PI_AGENTS_SRC"/*.md; do
  [ -e "$agent_file" ] || continue
  case "$agent_file" in
    *.appendix.md|*.body.md)
      continue
      ;;
  esac
  cp "$agent_file" "$PI_STAGE_TREE/agents/$(basename "$agent_file")"
done

if ! validate_staged_pi_tree "$PI_STAGE_TREE"; then
  rm -rf "$PI_STAGE_TREE"
  exit 1
fi

# Detect collisions before swapping the generated tree, so a profile-local
# custom agent or chain is never overwritten by a managed agent link.
for profile_dir in "$HOME/.pi/work" "$HOME/.pi/personal"; do
  if ! preflight_pi_profile "$profile_dir" "$PI_STAGE_TREE"; then
    rm -rf "$PI_STAGE_TREE"
    exit 1
  fi
done

if ! swap_staged_pi_tree "$PI_STAGE_TREE" "$PI_RUNTIME_TREE"; then
  rm -rf "$PI_STAGE_TREE"
  exit 1
fi
PI_STAGE_TREE=""

for profile_dir in "$HOME/.pi/work" "$HOME/.pi/personal"; do
  link_pi_profile_resources "$profile_dir" "$PI_RUNTIME_TREE"
done

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
