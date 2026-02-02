#!/bin/sh
#
# Tmux Configuration
#
# Sets up tmux config and installs TPM (plugin manager)

set -e

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"

echo "  Setting up tmux..."

# Install TPM (Tmux Plugin Manager) if not present
TPM_DIR="$HOME/.tmux/plugins/tpm"
if [ ! -d "$TPM_DIR" ]; then
  echo "  Installing TPM (Tmux Plugin Manager)..."
  git clone https://github.com/tmux-plugins/tpm "$TPM_DIR"
else
  echo "  TPM already installed"
fi

echo "  tmux configuration complete!"
echo "  After starting tmux, press prefix + I to install plugins"
echo "  (prefix is Ctrl-; as configured)"
