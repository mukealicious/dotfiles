#!/bin/sh
#
# Herdr Configuration
#
# Symlinks the tracked config to ~/.config/herdr/config.toml.
#
# Usage:
#   ./install.sh          # Normal install (preserves an existing regular file)
#   ./install.sh --force  # Back up and replace an existing regular file

set -e

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
HERDR_SRC="$DOTFILES_ROOT/herdr/config.toml"
HERDR_DEST="$HOME/.config/herdr"

. "$DOTFILES_ROOT/lib/symlink.sh"

FORCE="${FORCE:-false}"
for arg in "$@"; do
  case "$arg" in
    --force) FORCE=true ;;
  esac
done

if [ "$FORCE" = "true" ]; then
  log_force_enabled
fi

log_info "Setting up Herdr..."
mkdir -p "$HERDR_DEST"
ensure_symlink "$HERDR_SRC" "$HERDR_DEST/config.toml" "Herdr config.toml"
log_success "Herdr configuration complete!"
