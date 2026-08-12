#!/bin/sh
#
# Herdr Configuration
#
# Symlinks the tracked config and refreshes integrations for installed agents.
#
# Usage:
#   ./install.sh          # Normal install (preserves an existing regular file)
#   ./install.sh --force  # Back up and replace an existing regular file

set -e

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
HERDR_SRC="$DOTFILES_ROOT/herdr/config.toml"
HERDR_DEST="$HOME/.config/herdr"

# shellcheck disable=SC1091
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

if command -v herdr >/dev/null 2>&1; then
  log_info "Refreshing Herdr agent integrations..."

  if [ -d "$HOME/.pi/work" ]; then
    PI_CODING_AGENT_DIR="$HOME/.pi/work" herdr integration install pi
  fi
  if [ -d "$HOME/.pi/personal" ]; then
    PI_CODING_AGENT_DIR="$HOME/.pi/personal" herdr integration install pi
  fi
  if command -v claude >/dev/null 2>&1; then
    herdr integration install claude
  fi
  if command -v codex >/dev/null 2>&1; then
    herdr integration install codex
  fi
  if command -v opencode >/dev/null 2>&1; then
    herdr integration install opencode
  fi
fi

log_success "Herdr configuration complete!"
