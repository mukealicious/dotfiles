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

# Install Tier 1 extensions
# Uses `pi install npm:<pkg>` — idempotent, skips if already installed
TIER1_PACKAGES="
  pi-subagents
  pi-interactive-shell
  mitsupi
"

echo "  Installing Pi extensions..."
for pkg in $TIER1_PACKAGES; do
  if pi install "npm:$pkg" 2>/dev/null; then
    echo "    Installed $pkg"
  else
    echo "    Warning: Failed to install $pkg (run 'pi install npm:$pkg' manually)"
  fi
done

# Hotfix: mitsupi v1.1.1 ships with wrong execute() parameter order
# Fixed upstream (Feb 2, 2026) but not yet published to npm
# See: https://github.com/mitsuhiko/agent-stuff/commit/fix-extensions-update-tool-execute-signatures
# TODO: Remove this block once mitsupi >1.1.1 is released
patch_mitsupi() {
  MITSUPI_EXT="$(npm root -g 2>/dev/null)/mitsupi/pi-extensions"
  [ -d "$MITSUPI_EXT" ] || return 0

  # uv.ts: broken wrapper swaps signal/onUpdate params, crashing bash tool
  if grep -q 'async execute(id, params, onUpdate, _ctx, signal)' "$MITSUPI_EXT/uv.ts" 2>/dev/null; then
    awk '
      /pi\.registerTool\(\{/ { print "  pi.registerTool(bashTool);"; skip=1; next }
      skip && /\}\);/ { skip=0; next }
      skip { next }
      { print }
    ' "$MITSUPI_EXT/uv.ts" > "$MITSUPI_EXT/uv.ts.tmp" && mv "$MITSUPI_EXT/uv.ts.tmp" "$MITSUPI_EXT/uv.ts"
    echo "    Patched uv.ts (execute signature)"
  fi

  # todos.ts: missing _signal param shifts ctx to wrong position
  if grep -q 'execute(_toolCallId, params, _onUpdate, ctx)' "$MITSUPI_EXT/todos.ts" 2>/dev/null; then
    sed -i '' 's/execute(_toolCallId, params, _onUpdate, ctx)/execute(_toolCallId, params, _signal, _onUpdate, ctx)/' "$MITSUPI_EXT/todos.ts"
    echo "    Patched todos.ts (execute signature)"
  fi

  # loop.ts: missing _signal param shifts ctx to wrong position
  if grep -q 'execute(_toolCallId, _params, _onUpdate, ctx)' "$MITSUPI_EXT/loop.ts" 2>/dev/null; then
    sed -i '' 's/execute(_toolCallId, _params, _onUpdate, ctx)/execute(_toolCallId, _params, _signal, _onUpdate, ctx)/' "$MITSUPI_EXT/loop.ts"
    echo "    Patched loop.ts (execute signature)"
  fi
}

echo "  Applying mitsupi hotfixes..."
patch_mitsupi

echo "  Pi configuration complete!"
