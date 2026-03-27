#!/bin/sh
#
# OpenCode configuration
#
# Manages OpenCode TUI theme resources in ~/.config/opencode/
#
# Usage:
#   ./install.sh          # Normal install (warns about misconfigurations)
#   ./install.sh --force  # Fix symlinks pointing to wrong locations

set -e

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
OPENCODE_SRC="$DOTFILES_ROOT/opencode"
OPENCODE_DEST="$HOME/.config/opencode"

. "$DOTFILES_ROOT/lib/symlink.sh"

FORCE="${FORCE:-false}"
if [ "$1" = "--force" ]; then
  FORCE=true
fi

if [ "$FORCE" = "true" ]; then
  log_force_enabled
fi

log_info "Setting up OpenCode..."

mkdir -p "$OPENCODE_DEST"
mkdir -p "$OPENCODE_DEST/themes"

ensure_symlink "$OPENCODE_SRC/opencode.json" "$OPENCODE_DEST/opencode.json" "OpenCode config"
ensure_symlink "$OPENCODE_SRC/tui.json" "$OPENCODE_DEST/tui.json" "OpenCode TUI config"
ensure_symlink "$OPENCODE_SRC/themes/gruvbox-light.json" "$OPENCODE_DEST/themes/gruvbox-light.json" "OpenCode Gruvbox Light theme"

log_success "OpenCode configuration complete!"
