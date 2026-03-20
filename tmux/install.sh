#!/bin/sh
#
# Tmux Configuration
#
# Sets up tmux config and installs TPM (plugin manager)

set -e

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"

. "$DOTFILES_ROOT/lib/log.sh"

log_info "Setting up tmux..."

# Install TPM (Tmux Plugin Manager) if not present
TPM_DIR="$HOME/.tmux/plugins/tpm"
if [ ! -d "$TPM_DIR" ]; then
  log_info "Installing TPM (Tmux Plugin Manager)..."
  git clone https://github.com/tmux-plugins/tpm "$TPM_DIR"
else
  log_success "TPM already installed"
fi

log_success "tmux configuration complete!"
log_hint "After starting tmux, press prefix + I to install plugins"
log_hint "(prefix is Ctrl-; as configured)"
