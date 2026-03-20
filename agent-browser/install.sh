#!/bin/sh
#
# Install agent-browser Chromium dependency
#
# agent-browser requires Chromium for headless browser automation.
# This runs after the bun package is installed.

set -e

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"

. "$DOTFILES_ROOT/lib/log.sh"

if ! command -v agent-browser >/dev/null 2>&1; then
  log_warn "agent-browser not installed, skipping Chromium setup"
  exit 0
fi

log_info "Installing agent-browser Chromium..."
agent-browser install
log_success "agent-browser Chromium installed"
