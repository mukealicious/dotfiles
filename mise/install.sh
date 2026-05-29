#!/usr/bin/env bash
#
# Install mise-managed runtime tools and native-sensitive Node CLIs.
#
# Keep native Node packages (for example better-sqlite3 via qmd) out of Bun's
# global install so they are compiled against the mise-pinned Node runtime.

set -e

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"

. "$DOTFILES_ROOT/lib/log.sh"
. "$DOTFILES_ROOT/lib/symlink.sh"

if ! command -v mise >/dev/null 2>&1; then
    log_warn "mise is not installed. Run homebrew/install.sh or: brew install mise"
    exit 1
fi

log_info "Linking global mise config"
mkdir -p "$HOME/.config/mise"
ensure_symlink "$DOTFILES_ROOT/mise/config.toml" "$HOME/.config/mise/config.toml" "mise config.toml"

log_info "Trusting native mise config"
mise trust -y "$DOTFILES_ROOT/mise.toml"
mise trust -y "$HOME/.config/mise/config.toml"

log_info "Installing mise tools from $DOTFILES_ROOT/mise.toml"
(
    cd "$DOTFILES_ROOT"
    mise install
)

NODE_GLOBALS_FILE="$DOTFILES_ROOT/mise/node-globals.reqs"
NODE_VERSION="$(awk -F= '/^[[:space:]]*node[[:space:]]*=/{gsub(/[ \"'"'"']/, "", $2); print $2; exit}' "$DOTFILES_ROOT/mise.toml")"

if [ -z "$NODE_VERSION" ]; then
    log_warn "No Node version found in mise.toml; skipping Node globals installation"
    exit 1
fi

if [ -f "$NODE_GLOBALS_FILE" ]; then
    log_info "Installing Node globals with mise-managed Node $NODE_VERSION"

    while IFS= read -r package || [ -n "$package" ]; do
        # Skip empty lines and comments.
        if [ -z "$package" ] || [[ "$package" =~ ^[[:space:]]*# ]]; then
            continue
        fi

        package=$(echo "$package" | xargs)

        log_info "Installing $package..."
        mise exec -C "$DOTFILES_ROOT" "node@$NODE_VERSION" -- npm install -g "$package"
        log_success "$package installed"
    done < "$NODE_GLOBALS_FILE"

    log_success "mise-managed Node globals complete"
else
    log_warn "No mise/node-globals.reqs file found, skipping Node globals installation"
fi

log_success "mise runtime tools complete"
