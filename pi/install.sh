#!/bin/sh
#
# Pi Coding Agent Configuration
#
# Sets up ~/.pi/agent/ directory structure and symlinks settings.
# Installs Tier 1 extensions via `pi install`.
#
# Usage:
#   ./install.sh          # Normal install
#   ./install.sh --force  # Fix misdirected symlinks

set -e

# Parse arguments
FORCE=false
if [ "$1" = "--force" ]; then
  FORCE=true
  echo "  Running in --force mode: will fix misdirected symlinks"
fi

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"

if ! command -v pi >/dev/null 2>&1; then
  echo "  pi not installed, skipping Pi setup"
  exit 0
fi

#
# Helper: Create or validate a symlink
#
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

echo "  Setting up Pi coding agent..."

# Create directory structure
PI_DIR="$HOME/.pi/agent"
mkdir -p "$PI_DIR"

# Symlink settings.json
ensure_symlink "$DOTFILES_ROOT/pi/settings.json" "$PI_DIR/settings.json" "~/.pi/agent/settings.json"

# Install Tier 1 extensions
# Uses `pi install npm:<pkg>` — idempotent, skips if already installed
TIER1_PACKAGES="
  pi-mcp-adapter
  pi-subagents
  pi-interactive-shell
  pi-web-access
"

echo "  Installing Pi extensions..."
for pkg in $TIER1_PACKAGES; do
  if pi install "npm:$pkg" 2>/dev/null; then
    echo "    Installed $pkg"
  else
    echo "    Warning: Failed to install $pkg (run 'pi install npm:$pkg' manually)"
  fi
done

echo "  Pi configuration complete!"
