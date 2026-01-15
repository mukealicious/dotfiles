#!/usr/bin/env bash
#
# Install global Bun packages
#

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "bun is not installed. Please install it first (brew install bun)"
    exit 1
fi

# Get the dotfiles root directory
DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"

# Install packages from bun.reqs if it exists
if [ -f "$DOTFILES_ROOT/bun.reqs" ]; then
    echo "› Installing global Bun packages from bun.reqs"

    while IFS= read -r package || [ -n "$package" ]; do
        # Skip empty lines and comments
        if [ -z "$package" ] || [[ "$package" =~ ^[[:space:]]*# ]]; then
            continue
        fi

        # Trim whitespace
        package=$(echo "$package" | xargs)

        echo "  Installing $package..."
        if bun install -g "$package" 2>/dev/null; then
            echo "  ✓ $package installed"
        else
            echo "  ✗ Failed to install $package"
        fi
    done < "$DOTFILES_ROOT/bun.reqs"

    echo "› Bun packages installation complete"
else
    echo "› No bun.reqs file found, skipping Bun packages installation"
fi
