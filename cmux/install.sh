#!/bin/sh
#
# cmux configuration
#
# Manages cmux app theme overrides in macOS Application Support.
#
# Usage:
#   ./install.sh          # Normal install (warns about misconfigurations)
#   ./install.sh --force  # Fix symlinks pointing to wrong locations

set -e

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
CMUX_SRC="$DOTFILES_ROOT/cmux"
CMUX_DEST="$HOME/Library/Application Support/com.cmuxterm.app"
GHOSTTY_DEST="$HOME/Library/Application Support/com.mitchellh.ghostty"

. "$DOTFILES_ROOT/lib/symlink.sh"

FORCE="${FORCE:-false}"
if [ "$1" = "--force" ]; then
  FORCE=true
fi

if [ "$FORCE" = "true" ]; then
  log_force_enabled
fi

log_info "Setting up cmux..."

mkdir -p "$CMUX_DEST"
mkdir -p "$GHOSTTY_DEST"

if [ -e "$CMUX_DEST/config.ghostty" ] && [ ! -L "$CMUX_DEST/config.ghostty" ]; then
  if [ "$FORCE" = "true" ]; then
    rm "$CMUX_DEST/config.ghostty"
  else
    log_warn "cmux Ghostty config exists but is not a symlink"
    log_hint "Fix: sh install.sh --force"
  fi
fi

ensure_symlink "$CMUX_SRC/config.ghostty" "$CMUX_DEST/config.ghostty" "cmux Ghostty config"

if [ -f "$GHOSTTY_DEST/config.ghostty" ] && [ ! -s "$GHOSTTY_DEST/config.ghostty" ]; then
  rm "$GHOSTTY_DEST/config.ghostty"
fi

ensure_symlink "$CMUX_SRC/default-config.ghostty" "$GHOSTTY_DEST/config.ghostty" "Ghostty default config for cmux"

log_success "cmux configuration complete!"
