#!/usr/bin/env bash
#
# Install global Bun packages
#

set -e

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"

. "$DOTFILES_ROOT/lib/log.sh"

# Check if bun is installed
if ! command -v bun >/dev/null 2>&1; then
    log_warn "bun is not installed. Please install it first (brew install bun)"
    exit 1
fi

# Install packages from bun.reqs if it exists
if [ -f "$DOTFILES_ROOT/bun.reqs" ]; then
    log_info "Installing global Bun packages from bun.reqs"

    while IFS= read -r package || [ -n "$package" ]; do
        # Skip empty lines and comments
        if [ -z "$package" ] || [[ "$package" =~ ^[[:space:]]*# ]]; then
            continue
        fi

        # Trim whitespace
        package=$(echo "$package" | xargs)

        log_info "Installing $package..."
        if bun install -g "$package" 2>/dev/null; then
            log_success "$package installed"
        else
            log_warn "Failed to install $package"
        fi
    done < "$DOTFILES_ROOT/bun.reqs"

    log_success "Bun packages installation complete"
else
    log_warn "No bun.reqs file found, skipping Bun packages installation"
fi
