#!/usr/bin/env bash
#
# Install the mise-managed JavaScript toolchain and native-sensitive Node CLIs.
#
# mise.toml/mise.lock are the canonical cross-machine toolchain. Native Node
# packages (for example better-sqlite3 via qmd) remain attached to that pinned
# Node runtime so install-time and run-time ABIs match.

set -e

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
UPDATE="${DOT_UPDATE:-false}"

. "$DOTFILES_ROOT/lib/log.sh"
. "$DOTFILES_ROOT/lib/symlink.sh"

if ! command -v mise >/dev/null 2>&1; then
    log_warn "mise is not installed. Run homebrew/install.sh or: brew install mise"
    exit 1
fi

log_info "Linking global mise config"
mkdir -p "$HOME/.config/mise"
ensure_symlink "$DOTFILES_ROOT/mise/config.toml" "$HOME/.config/mise/config.toml" "mise config.toml"
ensure_symlink "$DOTFILES_ROOT/mise.lock" "$HOME/.config/mise/mise.lock" "mise.lock"

log_info "Trusting native mise config"
mise trust -y "$DOTFILES_ROOT/mise.toml"
mise trust -y "$HOME/.config/mise/config.toml"

log_info "Installing foundational mise tools"
(
    cd "$DOTFILES_ROOT"
    mise install node pnpm bun
)

log_info "Installing locked mise tools from $DOTFILES_ROOT/mise.toml"
(
    cd "$DOTFILES_ROOT"
    mise install
)

# `dot` is the user-facing update workflow. Direct installer/bootstrap runs
# converge on the committed lockfile instead of advancing it unexpectedly.
if [ "$UPDATE" = "true" ]; then
    log_info "Upgrading mise tools within declared release lines"
    (
        cd "$DOTFILES_ROOT"
        mise upgrade --yes
    )

    log_info "Refreshing the cross-machine mise lockfile"
    mise lock -g --platform macos-arm64,macos-x64
fi

NODE_GLOBALS_FILE="$DOTFILES_ROOT/mise/node-globals.reqs"
NODE_VERSION="$(mise current -C "$DOTFILES_ROOT" node 2>/dev/null || true)"

if [ -z "$NODE_VERSION" ]; then
    log_warn "No active Node version found through mise; skipping Node globals installation"
    exit 1
fi

if [ -f "$NODE_GLOBALS_FILE" ]; then
    log_info "Installing Node globals with mise-managed Node $NODE_VERSION"

    while IFS= read -r package || [ -n "$package" ]; do
        # Skip empty lines and comments.
        if [ -z "$package" ] || [[ "$package" =~ ^[[:space:]]*# ]]; then
            continue
        fi

        entry=$(echo "$package" | xargs)
        package="${entry%%|*}"
        reviewed_builds=""
        if [[ "$entry" == *"|"* ]]; then
            reviewed_builds="${entry#*|}"
        fi

        npm_args=(install -g "$package" "--strict-allow-scripts=true")
        if [ -n "$reviewed_builds" ]; then
            IFS=',' read -r -a builds <<< "$reviewed_builds"
            for build in "${builds[@]}"; do
                npm_args+=("--allow-scripts=$build")
            done
        fi

        log_info "Installing $package..."
        mise exec -C "$DOTFILES_ROOT" "node@$NODE_VERSION" -- npm "${npm_args[@]}"
        log_success "$package installed"
    done < "$NODE_GLOBALS_FILE"

    log_success "mise-managed Node globals complete"
else
    log_warn "No mise/node-globals.reqs file found, skipping Node globals installation"
fi

log_success "mise runtime tools complete"
