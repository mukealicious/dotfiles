#!/usr/bin/env bash
#
# Install mise-managed runtime tools and native Node CLIs.
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

log_info "Installing qmd with the mise-managed Node runtime"
(
    cd "$DOTFILES_ROOT"
    mise exec -- npm install -g @tobilu/qmd@2.1.0
)

log_success "mise runtime tools complete"
