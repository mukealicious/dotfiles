#!/bin/sh
#
# Starship Prompt
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

log_info "Setting up starship..."

ensure_symlink "$DOTFILES_ROOT/starship/starship.toml" "$HOME/.config/starship.toml" "starship config"

log_success "starship configuration complete!"
