#!/bin/sh
#
# Hunk diff review configuration
#
# Symlinks Hunk preferences into ~/.config/hunk/.

set -e

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
HUNK_SRC="$DOTFILES_ROOT/hunk"
HUNK_DEST="$HOME/.config/hunk"

# shellcheck disable=SC1091
. "$DOTFILES_ROOT/lib/symlink.sh"

FORCE="${FORCE:-false}"
if [ "$1" = "--force" ]; then
  FORCE=true
fi

if [ "$FORCE" = "true" ]; then
  log_force_enabled
fi

log_info "Setting up Hunk..."

mkdir -p "$HUNK_DEST"
ensure_symlink "$HUNK_SRC/config.toml" "$HUNK_DEST/config.toml" "hunk config.toml"

log_success "Hunk configuration complete!"
