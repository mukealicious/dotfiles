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

echo "  AI instruction file setup complete!"