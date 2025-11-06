#!/bin/sh
#
# Claude Code Skills
#
# This sets up Claude Code skills by symlinking individual skills
# from the dotfiles to ~/.claude/skills/

set -e

echo "  Setting up Claude Code skills..."

# Get the dotfiles root directory
DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
SKILLS_SOURCE="$DOTFILES_ROOT/claude/skills"
SKILLS_TARGET="$HOME/.claude/skills"

# Create ~/.claude directory if it doesn't exist
if [ ! -d "$HOME/.claude" ]; then
  echo "  Creating ~/.claude directory"
  mkdir -p "$HOME/.claude"
fi

# Create ~/.claude/skills directory if it doesn't exist
if [ ! -d "$SKILLS_TARGET" ]; then
  echo "  Creating ~/.claude/skills directory"
  mkdir -p "$SKILLS_TARGET"
fi

# Symlink each skill individually
for skill_dir in "$SKILLS_SOURCE"/*; do
  if [ -d "$skill_dir" ]; then
    skill_name=$(basename "$skill_dir")
    target_path="$SKILLS_TARGET/$skill_name"

    if [ -L "$target_path" ]; then
      echo "  ~/.claude/skills/$skill_name symlink already exists"
    elif [ -e "$target_path" ]; then
      echo "  Warning: ~/.claude/skills/$skill_name already exists (not a symlink)"
      echo "  Skipping to preserve existing skill"
    else
      echo "  Linking ~/.claude/skills/$skill_name -> $skill_dir"
      ln -s "$skill_dir" "$target_path"
    fi
  fi
done

echo "  Claude Code skills setup complete!"
