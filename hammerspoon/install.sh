#!/bin/sh
# shellcheck disable=SC1091
# Install the tracked Hammerspoon desktop-agent configuration.

set -e

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
HAMMERSPOON_SRC="$DOTFILES_ROOT/hammerspoon"
HAMMERSPOON_DEST="$HOME/.hammerspoon"

# shellcheck source=../lib/symlink.sh
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

log_info "Setting up Hammerspoon..."
mkdir -p "$HAMMERSPOON_DEST"
ensure_symlink "$HAMMERSPOON_SRC/init.lua" "$HAMMERSPOON_DEST/init.lua" "Hammerspoon init.lua"
ensure_symlink "$HAMMERSPOON_SRC/lib" "$HAMMERSPOON_DEST/lib" "Hammerspoon lib"
ensure_symlink "$HAMMERSPOON_SRC/bin" "$HAMMERSPOON_DEST/bin" "Hammerspoon bin"

chmod +x \
  "$HAMMERSPOON_SRC/bin/start-agent.sh" \
  "$HAMMERSPOON_SRC/bin/wait-for-agent.sh" \
  "$HAMMERSPOON_SRC/test/run-lua-test.sh" \
  "$HAMMERSPOON_SRC/test/run-lua-test.test.sh" \
  "$HAMMERSPOON_SRC/test/start-agent.test.sh" \
  "$HAMMERSPOON_SRC/test/wait-for-agent.test.sh"

log_success "Hammerspoon configuration complete!"
if [ -d "/Applications/Hammerspoon.app" ]; then
  log_hint "Open Hammerspoon once and grant Accessibility and Screen Recording permissions"
else
  log_hint "Install Hammerspoon from the Brewfile, then open it once to grant permissions"
fi
