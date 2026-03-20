#!/usr/bin/env bash
#
# Install Python tools via uv
#

set -e

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"

. "$DOTFILES_ROOT/lib/log.sh"

# Check if uv is installed
if ! command -v uv >/dev/null 2>&1; then
    log_warn "uv is not installed. Please install it first (brew install uv)"
    exit 1
fi

# Install tools from uv.reqs if it exists
if [ -f "$DOTFILES_ROOT/uv.reqs" ]; then
    log_info "Installing Python tools from uv.reqs"
    
    while IFS= read -r tool || [ -n "$tool" ]; do
        # Skip empty lines and comments
        if [ -z "$tool" ] || [[ "$tool" =~ ^[[:space:]]*# ]]; then
            continue
        fi
        
        # Trim whitespace
        tool=$(echo "$tool" | xargs)
        
        log_info "Installing $tool..."
        if uv tool install "$tool" --quiet; then
            log_success "$tool installed"
        else
            log_warn "Failed to install $tool"
        fi
    done < "$DOTFILES_ROOT/uv.reqs"
    
    log_success "Python tools installation complete"
else
    log_warn "No uv.reqs file found, skipping Python tools installation"
fi
