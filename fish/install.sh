#!/bin/sh
#
# Fish Shell Configuration
#
# Sets up Fish shell config by symlinking to ~/.config/fish/

set -e

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
FISH_SRC="$DOTFILES_ROOT/fish"
FISH_DEST="$HOME/.config/fish"

echo "  Setting up Fish shell..."

# Create fish config directory
mkdir -p "$FISH_DEST"
mkdir -p "$FISH_DEST/conf.d"
mkdir -p "$FISH_DEST/functions"
mkdir -p "$FISH_DEST/completions"

# Symlink config.fish
if [ -L "$FISH_DEST/config.fish" ]; then
  rm "$FISH_DEST/config.fish"
fi
if [ ! -e "$FISH_DEST/config.fish" ]; then
  echo "  Linking config.fish"
  ln -s "$FISH_SRC/config.fish" "$FISH_DEST/config.fish"
else
  echo "  config.fish exists (not a symlink), skipping"
fi

# Symlink conf.d files
for file in "$FISH_SRC/conf.d"/*.fish; do
  [ -e "$file" ] || continue
  name=$(basename "$file")
  target="$FISH_DEST/conf.d/$name"
  if [ -L "$target" ]; then
    rm "$target"
  fi
  if [ ! -e "$target" ]; then
    echo "  Linking conf.d/$name"
    ln -s "$file" "$target"
  fi
done

# Symlink functions
for file in "$FISH_SRC/functions"/*.fish; do
  [ -e "$file" ] || continue
  name=$(basename "$file")
  target="$FISH_DEST/functions/$name"
  if [ -L "$target" ]; then
    rm "$target"
  fi
  if [ ! -e "$target" ]; then
    echo "  Linking functions/$name"
    ln -s "$file" "$target"
  fi
done

# Symlink completions
for file in "$FISH_SRC/completions"/*.fish; do
  [ -e "$file" ] || continue
  name=$(basename "$file")
  target="$FISH_DEST/completions/$name"
  if [ -L "$target" ]; then
    rm "$target"
  fi
  if [ ! -e "$target" ]; then
    echo "  Linking completions/$name"
    ln -s "$file" "$target"
  fi
done

echo "  Fish configuration complete!"
echo "  To switch to Fish: chsh -s /opt/homebrew/bin/fish"
