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
  echo "  Running in --force mode: will fix misdirected symlinks"
fi

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"

#
# Helper: Create or validate a symlink
#
# Usage: ensure_symlink <source> <target> <description>
#
# Behavior:
# - If target doesn't exist: create symlink
# - If target is correct symlink: skip
# - If target is broken symlink: remove and recreate
# - If target points elsewhere: warn (or fix with --force)
# - If target is regular file/dir: warn and skip
#
ensure_symlink() {
  src="$1"
  target="$2"
  desc="$3"

  if [ -L "$target" ]; then
    current="$(readlink "$target")"
    if [ ! -e "$target" ]; then
      # Broken symlink
      echo "  Removing dead symlink: $desc"
      rm "$target"
      echo "  Linking $desc"
      ln -s "$src" "$target"
    elif [ "$current" = "$src" ]; then
      # Correct symlink
      echo "  $desc already linked correctly"
    else
      # Points to wrong location
      if [ "$FORCE" = "true" ]; then
        echo "  Fixing $desc (was: $current)"
        rm "$target"
        ln -s "$src" "$target"
      else
        echo "  Warning: $desc points to wrong location"
        echo "    Current:  $current"
        echo "    Expected: $src"
        echo "    Fix: rm \"$target\" && dot"
      fi
    fi
  elif [ -e "$target" ]; then
    # Regular file or directory
    echo "  Warning: $desc exists but is not a symlink"
    echo "    Skipping to preserve existing content"
  else
    # Doesn't exist
    echo "  Linking $desc"
    ln -s "$src" "$target"
  fi
}

MANAGED_INSTRUCTIONS_MARKER='<!-- Managed by ~/.dotfiles/ai/install.sh. Edit source files instead. -->'
MANAGED_AGENT_MARKER='# Managed by ~/.dotfiles/ai/install.sh. Edit source files instead.'

is_legacy_instruction_symlink() {
  legacy_target="$1"

  case "$legacy_target" in
    "$HOME/.AGENTS.md"|*"/ai/AGENTS.md.symlink")
      return 0
      ;;
  esac

  return 1
}

write_managed_file() {
  src_tmp="$1"
  target="$2"
  desc="$3"

  mkdir -p "$(dirname "$target")"

  if [ -L "$target" ]; then
    current="$(readlink "$target")"
    if is_legacy_instruction_symlink "$current"; then
      echo "  Replacing legacy symlink: $desc"
      rm "$target"
    elif [ "$FORCE" = "true" ]; then
      echo "  Replacing symlinked $desc (was: $current)"
      rm "$target"
    else
      echo "  Warning: $desc is a symlink to an unexpected location"
      echo "    Current:  $current"
      echo "    Expected: installer-managed file"
      echo "    Fix: rm \"$target\" && dot"
      rm "$src_tmp"
      return 0
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
    current="$(readlink "$target")"
    case "$current" in
      *"$legacy_suffix")
        echo "  Replacing legacy symlink: $desc"
        rm "$target"
        ;;
      *)
        if [ "$FORCE" = "true" ]; then
          echo "  Replacing symlinked $desc (was: $current)"
          rm "$target"
        else
          echo "  Warning: $desc is a symlink to an unexpected location"
          echo "    Current:  $current"
          echo "    Expected: installer-managed file"
          echo "    Fix: rm \"$target\" && dot"
          rm "$src_tmp"
          return 0
        fi
        ;;
    esac
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

  {
    printf '%s\n' '---'
    printf '%s\n' "$MANAGED_AGENT_MARKER"
    cat "$frontmatter_src"
    printf '%s\n\n' '---'
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
    if [ -L "$link" ] && [ ! -e "$link" ]; then
      echo "  Removing dead symlink: $(basename "$link")"
      rm "$link"
    fi
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
# - Portable skills from ai/skills/ are always the baseline projection
# - Optional harness-specific overlays are applied second
# - Target directories are runtime outputs, not authoring sources
#
sync_skill_runtime_dir() {
  target_dir="$1"
  label="$2"
  overlay_src="$3"

  mkdir -p "$target_dir"
  clean_dead_symlinks "$target_dir"

  if [ -d "$SHARED_SKILLS_SRC" ]; then
    for skill_dir in "$SHARED_SKILLS_SRC"/*/; do
      [ -d "$skill_dir" ] || continue
      skill_name=$(basename "$skill_dir")
      ensure_symlink "$skill_dir" "$target_dir/$skill_name" "$label/$skill_name (shared)"
    done
  fi

  if [ -n "$overlay_src" ] && [ -d "$overlay_src" ]; then
    for skill_dir in "$overlay_src"/*/; do
      [ -d "$skill_dir" ] || continue
      skill_name=$(basename "$skill_dir")
      ensure_symlink "$skill_dir" "$target_dir/$skill_name" "$label/$skill_name (overlay)"
    done
  fi
}

echo "  Setting up AI instruction files..."

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

# Pi: AGENTS.md in ~/.pi/agent/
mkdir -p "$HOME/.pi/agent"
assemble_instruction_file "$HOME/.pi/agent/AGENTS.md" "$HOME/.pi/agent/AGENTS.md" "$PI_INSTRUCTIONS_APPENDIX"

#
# Skills and Agents (single source of truth for all AI tools)
#
# Portable skills are authored once in ai/skills/.
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
PROJECT_AGENTS_SKILLS_DIR="$DOTFILES_ROOT/.agents/skills"
PROJECT_CLAUDE_SKILLS_DIR="$DOTFILES_ROOT/.claude/skills"
REVIEW_BODY_SRC="$SHARED_AGENTS_SRC/review.body.md"
CLAUDE_REVIEW_FRONTMATTER="$CLAUDE_AGENTS_SRC/review.frontmatter"
CLAUDE_REVIEW_APPENDIX="$CLAUDE_AGENTS_SRC/review.appendix.md"
PI_REVIEW_FRONTMATTER="$PI_AGENTS_SRC/review.frontmatter"
PI_REVIEW_APPENDIX="$PI_AGENTS_SRC/review.appendix.md"

# Repo-local runtime skill projections
echo "  Refreshing repo runtime skills..."
sync_skill_runtime_dir "$PROJECT_AGENTS_SKILLS_DIR" ".agents/skills" ""
sync_skill_runtime_dir "$PROJECT_CLAUDE_SKILLS_DIR" ".claude/skills" "$CLAUDE_SKILLS_SRC"

# Claude Code skills
echo "  Setting up Claude Code skills..."
sync_skill_runtime_dir "$CLAUDE_DIR/skills" "$CLAUDE_DIR/skills" "$CLAUDE_SKILLS_SRC"

# Claude Code agents
if [ -d "$CLAUDE_AGENTS_SRC" ]; then
  echo "  Setting up Claude Code agents..."
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
echo "  Setting up Pi agents..."
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

# OpenCode skills
echo "  Setting up OpenCode skills..."
# Note: OpenCode uses 'skill' not 'skills'. Keep the current shared + Claude
# overlay behavior for now; Sprint 3 is only changing instruction assembly.
sync_skill_runtime_dir "$OPENCODE_DIR/skill" "$OPENCODE_DIR/skill" "$CLAUDE_SKILLS_SRC"

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

echo "  AI configuration complete!"
