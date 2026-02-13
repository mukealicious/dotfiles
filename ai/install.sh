#!/bin/sh
#
# AI Tools Configuration
#
# Single source of truth for AI tool configuration:
# - Unified instruction files (CLAUDE.md, AGENTS.md, etc.)
# - Skills and agents for Claude Code and OpenCode
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

echo "  Setting up AI instruction files..."

AGENTS_FILE="$HOME/.AGENTS.md"

# Ensure ~/.AGENTS.md exists (created by bootstrap from AGENTS.md.symlink)
if [ ! -e "$AGENTS_FILE" ]; then
  echo "  ERROR: $AGENTS_FILE not found. Run bootstrap first."
  exit 1
fi

# Claude: CLAUDE.md in ~/.claude/ (user-level instructions)
# Note: ~/CLAUDE.md is NOT used — it would be discovered by Pi's upward
# directory traversal, causing duplicate instructions. ~/.claude/CLAUDE.md
# is Claude Code's dedicated user-level location and avoids this.
mkdir -p "$HOME/.claude"
ensure_symlink "$AGENTS_FILE" "$HOME/.claude/CLAUDE.md" "~/.claude/CLAUDE.md"

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
if [ ! -e "$HOME/.config/opencode/AGENTS.md" ]; then
  echo "  Linking ~/.config/opencode/AGENTS.md -> ~/.AGENTS.md"
  ln -s "$AGENTS_FILE" "$HOME/.config/opencode/AGENTS.md"
else
  echo "  ~/.config/opencode/AGENTS.md already exists"
fi

# Gemini: GEMINI.md in ~/.gemini/
mkdir -p "$HOME/.gemini"
if [ ! -e "$HOME/.gemini/GEMINI.md" ]; then
  echo "  Linking ~/.gemini/GEMINI.md -> ~/.AGENTS.md"
  ln -s "$AGENTS_FILE" "$HOME/.gemini/GEMINI.md"
else
  echo "  ~/.gemini/GEMINI.md already exists"
fi

# Codex: instructions.md in ~/.codex/
mkdir -p "$HOME/.codex"
if [ ! -e "$HOME/.codex/instructions.md" ]; then
  echo "  Linking ~/.codex/instructions.md -> ~/.AGENTS.md"
  ln -s "$AGENTS_FILE" "$HOME/.codex/instructions.md"
else
  echo "  ~/.codex/instructions.md already exists"
fi

# Pi: AGENTS.md in ~/.pi/agent/
mkdir -p "$HOME/.pi/agent"
ensure_symlink "$AGENTS_FILE" "$HOME/.pi/agent/AGENTS.md" "~/.pi/agent/AGENTS.md"

#
# Skills and Agents (single source of truth for all AI tools)
#
# Order: shared skills (ai/skills/) first, then harness-specific (claude/skills/).
# This ensures deterministic symlink ordering — shared skills are the baseline,
# harness-specific skills overlay on top.
#

CLAUDE_DIR="$HOME/.claude"
SHARED_SKILLS_SRC="$DOTFILES_ROOT/ai/skills"
CLAUDE_SKILLS_SRC="$DOTFILES_ROOT/claude/skills"
AGENTS_SRC="$DOTFILES_ROOT/claude/agents"
OPENCODE_DIR="$HOME/.config/opencode"

# Claude Code skills
echo "  Setting up Claude Code skills..."
mkdir -p "$CLAUDE_DIR/skills"
clean_dead_symlinks "$CLAUDE_DIR/skills"

# Shared skills first (ai/skills/ -> ~/.claude/skills/)
if [ -d "$SHARED_SKILLS_SRC" ]; then
  for skill_dir in "$SHARED_SKILLS_SRC"/*/; do
    [ -d "$skill_dir" ] || continue
    skill_name=$(basename "$skill_dir")
    ensure_symlink "$skill_dir" "$CLAUDE_DIR/skills/$skill_name" "~/.claude/skills/$skill_name (shared)"
  done
fi

# Harness-specific skills second (claude/skills/ -> ~/.claude/skills/)
if [ -d "$CLAUDE_SKILLS_SRC" ]; then
  for skill_dir in "$CLAUDE_SKILLS_SRC"/*/; do
    [ -d "$skill_dir" ] || continue
    skill_name=$(basename "$skill_dir")
    ensure_symlink "$skill_dir" "$CLAUDE_DIR/skills/$skill_name" "~/.claude/skills/$skill_name"
  done
fi

# Claude Code agents
if [ -d "$AGENTS_SRC" ]; then
  echo "  Setting up Claude Code agents..."
  mkdir -p "$CLAUDE_DIR/agents"
  clean_dead_symlinks "$CLAUDE_DIR/agents"

  for agent_file in "$AGENTS_SRC"/*.md; do
    [ -e "$agent_file" ] || continue
    agent_name=$(basename "$agent_file")
    ensure_symlink "$agent_file" "$CLAUDE_DIR/agents/$agent_name" "~/.claude/agents/$agent_name"
  done
fi

# OpenCode skills
echo "  Setting up OpenCode skills..."
mkdir -p "$OPENCODE_DIR/skill"  # Note: OpenCode uses 'skill' not 'skills'
clean_dead_symlinks "$OPENCODE_DIR/skill"

# Shared skills first (ai/skills/ -> ~/.config/opencode/skill/)
if [ -d "$SHARED_SKILLS_SRC" ]; then
  for skill_dir in "$SHARED_SKILLS_SRC"/*/; do
    [ -d "$skill_dir" ] || continue
    skill_name=$(basename "$skill_dir")
    ensure_symlink "$skill_dir" "$OPENCODE_DIR/skill/$skill_name" "~/.config/opencode/skill/$skill_name (shared)"
  done
fi

# Harness-specific skills second (claude/skills/ -> ~/.config/opencode/skill/)
if [ -d "$CLAUDE_SKILLS_SRC" ]; then
  for skill_dir in "$CLAUDE_SKILLS_SRC"/*/; do
    [ -d "$skill_dir" ] || continue
    skill_name=$(basename "$skill_dir")
    ensure_symlink "$skill_dir" "$OPENCODE_DIR/skill/$skill_name" "~/.config/opencode/skill/$skill_name"
  done
fi

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
