#!/bin/sh
#
# Herdr Configuration
#
# Symlinks the tracked config and refreshes the two supported Pi integrations.
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
  log_info "Refreshing supported Pi integrations..."

  # Herdr owns generated integration state; invoke its official installer only.
  for profile in work personal; do
    profile_dir="$HOME/.pi/$profile"
    if [ -d "$profile_dir" ]; then
      PI_CODING_AGENT_DIR="$profile_dir" herdr integration install pi
    fi
  done

  # Preserve the existing global integrations for other installed agents.
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
