#!/bin/sh
#
# Reading Tools Configuration
#
# Configures local reading helpers (for example speedread in bin/).
# External support CLIs such as ffmpeg and yt-dlp are managed via Brewfile
# and validated by dot doctor.
#
# Usage:
#   ./install.sh          # Normal install
#   ./install.sh --force  # Fix misdirected symlinks

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

log_info "Setting up reading tools..."

# speedread goes into bin/ via symlink (bin/ is already on PATH)
ensure_symlink "$DOTFILES_ROOT/reading/speedread" "$DOTFILES_ROOT/bin/speedread" "bin/speedread"

log_success "reading tools configuration complete!"
