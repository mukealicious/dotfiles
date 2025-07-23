#!/usr/bin/env bash
#
# Install Python tools via uv
#

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "uv is not installed. Please install it first (brew install uv)"
    exit 1
fi

# Get the dotfiles root directory
DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"

# Install tools from uv.reqs if it exists
if [ -f "$DOTFILES_ROOT/uv.reqs" ]; then
    echo "› Installing Python tools from uv.reqs"
    
    while IFS= read -r tool || [ -n "$tool" ]; do
        # Skip empty lines and comments
        if [ -z "$tool" ] || [[ "$tool" =~ ^[[:space:]]*# ]]; then
            continue
        fi
        
        # Trim whitespace
        tool=$(echo "$tool" | xargs)
        
        echo "  Installing $tool..."
        if uv tool install "$tool" --quiet; then
            echo "  ✓ $tool installed"
        else
            echo "  ✗ Failed to install $tool"
        fi
    done < "$DOTFILES_ROOT/uv.reqs"
    
    echo "› Python tools installation complete"
else
    echo "› No uv.reqs file found, skipping Python tools installation"
fi