#!/bin/sh
#
# Zed Configuration
#
# Symlinks user-authored Zed config into ~/.config/Zed/.
#
# Usage:
#   ./install.sh          # Normal install
#   ./install.sh --force  # Back up existing files and replace with symlinks

set -e

FORCE=false
for arg in "$@"; do
  case "$arg" in
    --force) FORCE=true ;;
  esac
done

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"

. "$DOTFILES_ROOT/lib/symlink.sh"

if [ "$FORCE" = "true" ]; then
  log_force_enabled
fi

ZED_CONFIG_DIR="$HOME/.config/Zed"
mkdir -p "$ZED_CONFIG_DIR"

ensure_symlink "$DOTFILES_ROOT/zed/settings.json" "$ZED_CONFIG_DIR/settings.json" "Zed/settings.json"

for optional_config in keymap.json tasks.json snippets themes prompts; do
  src="$DOTFILES_ROOT/zed/$optional_config"
  [ -e "$src" ] || continue
  ensure_symlink "$src" "$ZED_CONFIG_DIR/$optional_config" "Zed/$optional_config"
done

log_success "Zed configuration complete!"
