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
fi

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"

. "$DOTFILES_ROOT/lib/symlink.sh"

if [ "$FORCE" = "true" ]; then
  log_force_enabled
fi

log_info "Setting up ripgrep..."

RG_CONFIG_DIR="$HOME/.config/ripgrep"
mkdir -p "$RG_CONFIG_DIR"

ensure_symlink "$DOTFILES_ROOT/ripgrep/config" "$RG_CONFIG_DIR/config" "ripgrep config"

log_success "ripgrep configuration complete!"
