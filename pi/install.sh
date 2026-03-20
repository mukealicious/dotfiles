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
for arg in "$@"; do
  case "$arg" in
    --force) FORCE=true; echo "  Running in --force mode: will fix misdirected symlinks" ;;
  esac
done

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"

# Shared symlink helpers
. "$DOTFILES_ROOT/lib/symlink.sh"

if ! command -v pi >/dev/null 2>&1; then
  echo "  pi not installed, skipping Pi setup"
  exit 0
fi

echo "  Setting up Pi coding agent..."

# Create directory structure
PI_DIR="$HOME/.pi/agent"
mkdir -p "$PI_DIR"

# Symlink settings.json
ensure_symlink "$DOTFILES_ROOT/pi/settings.json" "$PI_DIR/settings.json" "~/.pi/agent/settings.json"

# Symlink themes directory
mkdir -p "$PI_DIR/themes"
for theme in "$DOTFILES_ROOT/pi/themes/"*.json; do
  [ -e "$theme" ] || continue
  name="$(basename "$theme")"
  ensure_symlink "$theme" "$PI_DIR/themes/$name" "~/.pi/agent/themes/$name"
done

# Symlink custom extensions
EXTENSIONS_SRC="$DOTFILES_ROOT/pi/extensions"
EXTENSIONS_DIR="$PI_DIR/extensions"
if [ -d "$EXTENSIONS_SRC" ]; then
  mkdir -p "$EXTENSIONS_DIR"
  for ext in "$EXTENSIONS_SRC"/*.ts; do
    [ -e "$ext" ] || continue
    name="$(basename "$ext")"
    ensure_symlink "$ext" "$EXTENSIONS_DIR/$name" "~/.pi/agent/extensions/$name"
  done
fi

# Install packages
# Packages are fully qualified (git: or npm: prefix)
PACKAGES="
  git:https://github.com/HazAT/pi-interactive-subagents
  git:https://github.com/sasha-computer/pi-cmux
  git:https://github.com/HazAT/pi-parallel
  npm:pi-interactive-shell
  npm:mitsupi
"

echo "  Installing Pi packages..."
for pkg in $PACKAGES; do
  # Extract display name: strip git:/npm: prefix, URL path, .git suffix
  display_name="${pkg##*/}"
  display_name="${display_name%.git}"
  display_name="${display_name#npm:}"
  if pi install "$pkg" 2>/dev/null; then
    echo "    Installed $display_name"
  else
    echo "    Warning: Failed to install $display_name (run 'pi install $pkg' manually)"
  fi
done

echo "  Pi configuration complete!"
