#!/bin/sh
#
# cmux Configuration
#
# Symlinks cmux's JSONC config into ~/.config/cmux/.
#
# Usage:
#   ./install.sh          # Normal install
#   ./install.sh --force  # Fix misdirected symlinks

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

CMUX_CONFIG_DIR="$HOME/.config/cmux"
mkdir -p "$CMUX_CONFIG_DIR"

ensure_symlink "$DOTFILES_ROOT/cmux/cmux.json" "$CMUX_CONFIG_DIR/cmux.json" "cmux/cmux.json"

log_success "cmux configuration complete!"
