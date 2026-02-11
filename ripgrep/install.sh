#!/bin/sh
#
# Ripgrep Configuration
#
# Usage:
#   ./install.sh          # Normal install (warns about misconfigurations)
#   ./install.sh --force  # Fix symlinks pointing to wrong locations

set -e

FORCE=false
if [ "$1" = "--force" ]; then
  FORCE=true
  echo "  Running in --force mode: will fix misdirected symlinks"
fi

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"

ensure_symlink() {
  src="$1"
  target="$2"
  desc="$3"

  if [ -L "$target" ]; then
    current="$(readlink "$target")"
    if [ ! -e "$target" ]; then
      echo "  Removing dead symlink: $desc"
      rm "$target"
      echo "  Linking $desc"
      ln -s "$src" "$target"
    elif [ "$current" = "$src" ]; then
      echo "  $desc already linked correctly"
    else
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
    echo "  Warning: $desc exists but is not a symlink"
    echo "    Skipping to preserve existing content"
  else
    echo "  Linking $desc"
    ln -s "$src" "$target"
  fi
}

echo "  Setting up ripgrep..."

RG_CONFIG_DIR="$HOME/.config/ripgrep"
mkdir -p "$RG_CONFIG_DIR"

ensure_symlink "$DOTFILES_ROOT/ripgrep/config" "$RG_CONFIG_DIR/config" "ripgrep config"
