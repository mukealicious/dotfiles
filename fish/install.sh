#!/bin/sh
#
# Fish Shell Configuration
#
# Sets up Fish shell config by symlinking to ~/.config/fish/
#
# Usage:
#   ./install.sh          # Normal install (warns about misconfigurations)
#   ./install.sh --force  # Fix symlinks pointing to wrong locations

set -e

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
FISH_SRC="$DOTFILES_ROOT/fish"
FISH_DEST="$HOME/.config/fish"

# Shared symlink helpers
. "$DOTFILES_ROOT/lib/symlink.sh"

# Parse arguments
FORCE="${FORCE:-false}"
if [ "$1" = "--force" ]; then
  FORCE=true
fi

echo "  Setting up Fish shell..."

# Create fish config directory
mkdir -p "$FISH_DEST"
mkdir -p "$FISH_DEST/conf.d"
mkdir -p "$FISH_DEST/functions"
mkdir -p "$FISH_DEST/completions"

# Symlink config.fish
ensure_symlink "$FISH_SRC/config.fish" "$FISH_DEST/config.fish" "config.fish"

# Symlink conf.d files from fish/conf.d/
for file in "$FISH_SRC/conf.d"/*.fish; do
  [ -e "$file" ] || continue
  name=$(basename "$file")
  ensure_symlink "$file" "$FISH_DEST/conf.d/$name" "conf.d/$name"
done

# Discover and symlink topic aliases (*/aliases.fish -> conf.d/<topic>-aliases.fish)
for file in "$DOTFILES_ROOT"/*/aliases.fish; do
  [ -e "$file" ] || continue
  topic=$(basename "$(dirname "$file")")
  ensure_symlink "$file" "$FISH_DEST/conf.d/${topic}-aliases.fish" "$topic/aliases.fish"
done

# Discover and symlink topic keybindings (*/keybindings.fish -> conf.d/<topic>-keybindings.fish)
for file in "$DOTFILES_ROOT"/*/keybindings.fish; do
  [ -e "$file" ] || continue
  topic=$(basename "$(dirname "$file")")
  ensure_symlink "$file" "$FISH_DEST/conf.d/${topic}-keybindings.fish" "$topic/keybindings.fish"
done

# Symlink functions
for file in "$FISH_SRC/functions"/*.fish; do
  [ -e "$file" ] || continue
  name=$(basename "$file")
  ensure_symlink "$file" "$FISH_DEST/functions/$name" "functions/$name"
done

# Symlink completions
for file in "$FISH_SRC/completions"/*.fish; do
  [ -e "$file" ] || continue
  name=$(basename "$file")
  ensure_symlink "$file" "$FISH_DEST/completions/$name" "completions/$name"
done

echo "  Fish configuration complete!"

# Only show shell switch instruction if not already using Fish
if [ "$SHELL" != "/opt/homebrew/bin/fish" ] && [ "$SHELL" != "/usr/local/bin/fish" ]; then
  current_shell=$(basename "$SHELL")

  # Ensure Fish is in /etc/shells before suggesting chsh
  FISH_PATH="/opt/homebrew/bin/fish"
  if [ ! -f "$FISH_PATH" ]; then
    FISH_PATH="/usr/local/bin/fish"
  fi

  if [ -f "$FISH_PATH" ] && ! grep -q "^$FISH_PATH$" /etc/shells; then
    echo "  Fish is not in /etc/shells"
    echo "  Fix: echo '$FISH_PATH' | sudo tee -a /etc/shells"
  fi

  echo "  Currently using $current_shell. To switch to Fish: chsh -s $FISH_PATH"
fi
