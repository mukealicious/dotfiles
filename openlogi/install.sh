#!/bin/sh
#
# OpenLogi Configuration
#
# OpenLogi writes config.toml atomically, which would replace a file-level
# symlink. Link the repo-managed config directory so GUI changes persist back
# here without exposing topic helper scripts under ~/.config/openlogi.
#
# Usage:
#   ./install.sh          # Normal install
#   ./install.sh --force  # Back up existing config dir and replace with symlink

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

log_info "Setting up OpenLogi..."

mkdir -p "$HOME/.config"
ensure_symlink "$DOTFILES_ROOT/openlogi/config" "$HOME/.config/openlogi" "OpenLogi config directory"

log_success "OpenLogi configuration complete!"
