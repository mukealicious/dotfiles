#!/bin/sh
#
# AI Tools
#
# Sets up unified instruction files for all AI tools.
# bootstrap creates ~/.AGENTS.md symlink to dotfiles source.
# This script creates tool-specific symlinks pointing to ~/.AGENTS.md.

set -e

echo "  Setting up AI instruction files..."

AGENTS_FILE="$HOME/.AGENTS.md"

# Ensure ~/.AGENTS.md exists (created by bootstrap from AGENTS.md.symlink)
if [ ! -e "$AGENTS_FILE" ]; then
  echo "  ERROR: $AGENTS_FILE not found. Run bootstrap first."
  exit 1
fi

# Claude: CLAUDE.md in home directory
if [ ! -e "$HOME/CLAUDE.md" ]; then
  echo "  Linking ~/CLAUDE.md -> ~/.AGENTS.md"
  ln -s "$AGENTS_FILE" "$HOME/CLAUDE.md"
else
  echo "  ~/CLAUDE.md already exists"
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

# Claude Code: agents and skills
DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
CLAUDE_DIR="$HOME/.claude"

# Claude agents
CLAUDE_AGENTS_SRC="$DOTFILES_ROOT/claude/agents"
CLAUDE_AGENTS_DST="$CLAUDE_DIR/agents"
if [ -d "$CLAUDE_AGENTS_SRC" ]; then
  echo "  Setting up Claude agents..."
  mkdir -p "$CLAUDE_AGENTS_DST"
  for agent_file in "$CLAUDE_AGENTS_SRC"/*.md; do
    [ -f "$agent_file" ] || continue
    agent_name=$(basename "$agent_file")
    target_link="$CLAUDE_AGENTS_DST/$agent_name"
    if [ -L "$target_link" ]; then
      echo "  ~/.claude/agents/$agent_name symlink already exists"
    elif [ -e "$target_link" ]; then
      echo "  Warning: $target_link already exists (not a symlink)"
    else
      echo "  Linking ~/.claude/agents/$agent_name"
      ln -s "$agent_file" "$target_link"
    fi
  done
fi

# Claude skills
CLAUDE_SKILLS_SRC="$DOTFILES_ROOT/claude/skills"
CLAUDE_SKILLS_DST="$CLAUDE_DIR/skills"
if [ -d "$CLAUDE_SKILLS_SRC" ]; then
  echo "  Setting up Claude skills..."
  mkdir -p "$CLAUDE_SKILLS_DST"
  for skill_dir in "$CLAUDE_SKILLS_SRC"/*/; do
    [ -d "$skill_dir" ] || continue
    skill_name=$(basename "$skill_dir")
    target_link="$CLAUDE_SKILLS_DST/$skill_name"
    if [ -L "$target_link" ]; then
      echo "  ~/.claude/skills/$skill_name symlink already exists"
    elif [ -e "$target_link" ]; then
      echo "  Warning: $target_link already exists (not a symlink)"
    else
      echo "  Linking ~/.claude/skills/$skill_name"
      ln -s "$skill_dir" "$target_link"
    fi
  done
fi

echo "  AI instruction file setup complete!"