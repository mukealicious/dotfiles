#!/bin/sh
#
# AI Tools Configuration
#
# Single source of truth for AI tool configuration:
# - Unified instruction files (CLAUDE.md, AGENTS.md, etc.)
# - Repo runtime skill projections plus installed skills
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

# Only exact links from retired publishers are ours to remove.
remove_retired_agent_link() {
  target="$1"
  source="$2"
  [ ! -L "$(dirname "$target")" ] || return 0
  if [ -L "$target" ] && [ "$(readlink "$target")" = "$source" ]; then
    rm "$target"
    echo "  Removed retired managed agent link: $target"
  fi
}

# Retired projected/source skills leave dangling links. Only remove links into
# our managed trees; an unrelated broken link may be intentional user state.
clean_dead_managed_skill_links() {
  dir="$1"
  [ -d "$dir" ] || return 0
  for link in "$dir"/*; do
    [ -L "$link" ] || continue
    [ -e "$link" ] && continue
    current="$(readlink "$link")"
    case "$current" in
      "$DOTFILES_ROOT/.ai-runtime/"*/skills/*|"$DOTFILES_ROOT/ai/skills/"*|"$DOTFILES_ROOT/claude/skills/"*)
        echo "  Removing stale managed skill link: $(basename "$link")"
        rm "$link"
        ;;
    esac
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
  clean_dead_managed_skill_links "$target_dir"

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

  [ -f "$tree/AGENTS.md" ] || { pi_profile_error "staged Pi tree is missing AGENTS.md"; return 1; }
  [ -d "$tree/skills" ] || { pi_profile_error "staged Pi tree is missing skills/"; return 1; }

  set -- "$tree/skills"/*
  [ -e "$1" ] || { pi_profile_error "staged Pi tree contains no projected skills"; return 1; }
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
# Skills (single source of truth for all AI tools)
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
OPENCODE_DIR="$HOME/.config/opencode"
PROJECTED_SKILLS_ROOT="$DOTFILES_ROOT/.ai-runtime"
PROJECTED_CODEX_SKILLS_SRC="$PROJECTED_SKILLS_ROOT/codex/skills"
PROJECTED_CLAUDE_SKILLS_SRC="$PROJECTED_SKILLS_ROOT/claude-code/skills"
PROJECTED_OPENCODE_SKILLS_SRC="$PROJECTED_SKILLS_ROOT/opencode/skills"
PROJECT_AGENTS_SKILLS_DIR="$DOTFILES_ROOT/.agents/skills"
PROJECT_CLAUDE_SKILLS_DIR="$DOTFILES_ROOT/.claude/skills"
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

# Narrow retirement cleanup; user-owned agents and directories are not managed.
for name in librarian oracle review; do
  remove_retired_agent_link "$CLAUDE_DIR/agents/$name.md" "$DOTFILES_ROOT/claude/agents/$name.md"
  remove_retired_agent_link "$OPENCODE_DIR/agents/$name.md" "$DOTFILES_ROOT/claude/agents/$name.md"
done
review_file="$CLAUDE_DIR/agents/review.md"
if [ ! -L "$CLAUDE_DIR/agents" ] && [ ! -L "$review_file" ] && [ -f "$review_file" ] \
  && grep -Fq "$MANAGED_AGENT_MARKER" "$review_file"; then
  rm "$review_file"
  echo "  Removed retired generated Claude review agent"
fi

# Pi generated resources. Build and validate a complete sibling tree before
# changing the active tree or installed resource links.
log_info "Staging generated Pi resources..."
PI_RUNTIME_TREE="$PROJECTED_SKILLS_ROOT/pi"
PI_STAGE_TREE="$(mktemp -d "$PROJECTED_SKILLS_ROOT/.pi.stage.XXXXXX")"
assemble_instruction_file "$PI_STAGE_TREE/AGENTS.md" "$PI_STAGE_TREE/AGENTS.md" "$PI_INSTRUCTIONS_APPENDIX"
run_node "$DOTFILES_ROOT/ai/scripts/project-skills.mjs" pi "$SHARED_SKILLS_SRC" "$PI_STAGE_TREE/skills" "$PI_RUNTIME_TREE/skills"

if ! validate_staged_pi_tree "$PI_STAGE_TREE"; then
  rm -rf "$PI_STAGE_TREE"
  exit 1
fi

# The instruction link remains managed; agent directories are user-owned.
pi_instruction="$HOME/.pi/agent/AGENTS.md"
if { [ -e "$pi_instruction" ] || [ -L "$pi_instruction" ]; } \
  && ! is_exact_symlink "$pi_instruction" "$PI_RUNTIME_TREE/AGENTS.md"; then
  pi_profile_error "$pi_instruction is not the installer-managed link; preserve it and move it before rerunning"
  exit 1
fi

if ! swap_staged_pi_tree "$PI_STAGE_TREE" "$PI_RUNTIME_TREE"; then
  rm -rf "$PI_STAGE_TREE"
  exit 1
fi
PI_STAGE_TREE=""

mkdir -p "$HOME/.pi/agent"
if [ ! -e "$pi_instruction" ] && [ ! -L "$pi_instruction" ]; then
  ln -s "$PI_RUNTIME_TREE/AGENTS.md" "$pi_instruction"
fi
for name in researcher review; do
  remove_retired_agent_link "$HOME/.pi/agent/agents/$name.md" "$PI_RUNTIME_TREE/agents/$name.md"
done

# OpenCode skills
log_info "Setting up OpenCode skills..."
# Note: OpenCode uses 'skill' not 'skills'. It gets only portable shared skills.
sync_skill_runtime_dir "$PROJECTED_OPENCODE_SKILLS_SRC" "$OPENCODE_DIR/skill" "$OPENCODE_DIR/skill" ""

log_success "AI configuration complete!"
