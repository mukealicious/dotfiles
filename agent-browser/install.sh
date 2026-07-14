#!/bin/sh
#
# Install agent-browser Chromium dependency
#
# agent-browser requires Chromium for headless browser automation.
# This runs after the bun package is installed.

set -e

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"

. "$DOTFILES_ROOT/lib/log.sh"

if ! command -v mise >/dev/null 2>&1 || ! mise exec -C "$DOTFILES_ROOT" -- agent-browser --version >/dev/null 2>&1; then
  log_warn "mise-managed agent-browser is not installed, skipping Chromium setup"
  log_hint "Fix: run $DOTFILES_ROOT/mise/install.sh"
  exit 0
fi

log_info "Installing agent-browser Chromium..."
mise exec -C "$DOTFILES_ROOT" -- agent-browser install
log_success "agent-browser Chromium installed"
