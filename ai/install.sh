#!/bin/sh
#
# AI Tools
#
# This sets up the unified instruction file system for all AI tools

set -e

echo "  Setting up AI instruction files..."

# The bootstrap script creates .AGENTS.md (with dot prefix) in home directory
# We need to create AGENTS.md (without dot) and then link other tools to it

# First, create AGENTS.md symlink to .AGENTS.md if it doesn't exist
if [ -L "$HOME/.AGENTS.md" ] && [ ! -e "$HOME/AGENTS.md" ]; then
  echo "  Linking ~/AGENTS.md -> ~/.AGENTS.md"
  ln -s "$HOME/.AGENTS.md" "$HOME/AGENTS.md"
elif [ -L "$HOME/AGENTS.md" ]; then
  echo "  ~/AGENTS.md symlink already exists"
fi

# Now create symlinks from AGENTS.md to each tool's expected location

# Claude expects CLAUDE.md in home directory
if [ -e "$HOME/AGENTS.md" ] && [ ! -e "$HOME/CLAUDE.md" ]; then
  echo "  Linking ~/CLAUDE.md -> ~/AGENTS.md"
  ln -s "$HOME/AGENTS.md" "$HOME/CLAUDE.md"
elif [ -L "$HOME/CLAUDE.md" ]; then
  echo "  ~/CLAUDE.md symlink already exists"
fi

# OpenCode expects AGENTS.md in ~/.config/opencode/
if [ ! -d "$HOME/.config/opencode" ]; then
  echo "  Creating ~/.config/opencode directory"
  mkdir -p "$HOME/.config/opencode"
fi

if [ -e "$HOME/AGENTS.md" ] && [ ! -e "$HOME/.config/opencode/AGENTS.md" ]; then
  echo "  Linking ~/.config/opencode/AGENTS.md -> ~/AGENTS.md"
  ln -s "$HOME/AGENTS.md" "$HOME/.config/opencode/AGENTS.md"
elif [ -L "$HOME/.config/opencode/AGENTS.md" ]; then
  echo "  ~/.config/opencode/AGENTS.md symlink already exists"
fi

# Gemini expects GEMINI.md in ~/.gemini/
if [ ! -d "$HOME/.gemini" ]; then
  echo "  Creating ~/.gemini directory"
  mkdir -p "$HOME/.gemini"
fi

if [ -e "$HOME/AGENTS.md" ] && [ ! -e "$HOME/.gemini/GEMINI.md" ]; then
  echo "  Linking ~/.gemini/GEMINI.md -> ~/AGENTS.md"
  ln -s "$HOME/AGENTS.md" "$HOME/.gemini/GEMINI.md"
elif [ -L "$HOME/.gemini/GEMINI.md" ]; then
  echo "  ~/.gemini/GEMINI.md symlink already exists"
fi

# Codex has instructions.md in ~/.codex/
if [ ! -d "$HOME/.codex" ]; then
  echo "  Creating ~/.codex directory"
  mkdir -p "$HOME/.codex"
fi

# Backup existing instructions.md if it exists and isn't a symlink
if [ -f "$HOME/.codex/instructions.md" ] && [ ! -L "$HOME/.codex/instructions.md" ]; then
  echo "  Backing up existing ~/.codex/instructions.md"
  mv "$HOME/.codex/instructions.md" "$HOME/.codex/instructions.md.backup"
fi

if [ -e "$HOME/AGENTS.md" ] && [ ! -e "$HOME/.codex/instructions.md" ]; then
  echo "  Linking ~/.codex/instructions.md -> ~/AGENTS.md"
  ln -s "$HOME/AGENTS.md" "$HOME/.codex/instructions.md"
elif [ -L "$HOME/.codex/instructions.md" ]; then
  echo "  ~/.codex/instructions.md symlink already exists"
fi

echo "  AI instruction file setup complete!"