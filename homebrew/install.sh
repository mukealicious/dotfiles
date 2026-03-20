#!/bin/sh
#
# Homebrew
#
# Installs Homebrew when missing.

set -e

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"

. "$DOTFILES_ROOT/lib/log.sh"

if command -v brew >/dev/null 2>&1; then
  log_success "Homebrew already installed"
  exit 0
fi

log_info "Installing Homebrew..."

if [ "$(uname)" = "Darwin" ]; then
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
elif [ "$(uname -s)" = "Linux" ]; then
  ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Linuxbrew/install/master/install)"
else
  log_warn "Unsupported platform for Homebrew installer: $(uname -s)"
fi
