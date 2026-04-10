#!/bin/sh
#
# Pi Coding Agent Configuration
#
# Sets up Pi profile directories and symlinks per-profile settings.
# Installs Pi packages via `pi install`.
#
# Usage:
#   ./install.sh          # Normal install
#   ./install.sh --force  # Fix misdirected symlinks

set -e

# Parse arguments
FORCE=false
for arg in "$@"; do
  case "$arg" in
    --force) FORCE=true ;;
  esac
done

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"

# Shared symlink helpers
. "$DOTFILES_ROOT/lib/symlink.sh"

if [ "$FORCE" = "true" ]; then
  log_force_enabled
fi

if ! command -v pi >/dev/null 2>&1; then
  log_warn "pi not installed, skipping Pi setup"
  exit 0
fi

log_info "Setting up Pi coding agent..."

setup_pi_profile() {
  profile_dir="$1"
  settings_src="$2"
  profile_name="$3"

  mkdir -p "$profile_dir"
  ensure_symlink "$settings_src" "$profile_dir/settings.json" "$profile_name/settings.json"

  mkdir -p "$profile_dir/themes"
  for theme in "$DOTFILES_ROOT/pi/themes/"*.json; do
    [ -e "$theme" ] || continue
    name="$(basename "$theme")"
    ensure_symlink "$theme" "$profile_dir/themes/$name" "$profile_name/themes/$name"
  done

  EXTENSIONS_SRC="$DOTFILES_ROOT/pi/extensions"
  EXTENSIONS_DIR="$profile_dir/extensions"
  if [ -d "$EXTENSIONS_SRC" ]; then
    mkdir -p "$EXTENSIONS_DIR"
    for ext in "$EXTENSIONS_SRC"/*.ts; do
      [ -e "$ext" ] || continue
      name="$(basename "$ext")"
      ensure_symlink "$ext" "$EXTENSIONS_DIR/$name" "$profile_name/extensions/$name"
    done
  fi
}

# Shared backing store for global Pi resources (assembled AGENTS.md, agents/).
# Not a user-facing profile — pi dispatches to work or personal.
setup_pi_profile "$HOME/.pi/agent" "$DOTFILES_ROOT/pi/settings.work.json" "$HOME/.pi/agent"
setup_pi_profile "$HOME/.pi/work" "$DOTFILES_ROOT/pi/settings.work.json" "$HOME/.pi/work"
setup_pi_profile "$HOME/.pi/personal" "$DOTFILES_ROOT/pi/settings.personal.json" "$HOME/.pi/personal"

# Seed the personal profile with existing shared OAuth credentials on first split.
if [ -e "$HOME/.pi/agent/auth.json" ]; then
  if [ ! -s "$HOME/.pi/personal/auth.json" ] || [ "$(tr -d '[:space:]' < "$HOME/.pi/personal/auth.json" 2>/dev/null)" = "{}" ]; then
    cp "$HOME/.pi/agent/auth.json" "$HOME/.pi/personal/auth.json"
    chmod 600 "$HOME/.pi/personal/auth.json"
    log_success "Seeded ~/.pi/personal/auth.json from ~/.pi/agent/auth.json"
  fi
fi

# Install researcher support CLI required by pi-parallel.
# Upstream documents Homebrew, but the published tap does not currently
# resolve; use Parallel's official installer script which places the binary
# in ~/.local/bin (already on PATH in this dotfiles setup).
if command -v parallel-cli >/dev/null 2>&1 && parallel-cli --version >/dev/null 2>&1; then
  log_success "parallel-cli already installed"
else
  log_info "Installing parallel-cli via upstream installer..."
  if curl -fsSL https://parallel.ai/install.sh | bash >/dev/null 2>&1; then
    log_success "Installed parallel-cli"
  else
    log_warn "Failed to install parallel-cli"
    log_hint "Run manually: curl -fsSL https://parallel.ai/install.sh | bash"
  fi
fi

# Install Pi packages.
# Remote packages use fully qualified sources (git: or npm: prefix).
# Local vendored packages are installed from repo paths for tighter supply-chain control.
PACKAGES="
  git:https://github.com/HazAT/pi-parallel
  $DOTFILES_ROOT/pi/packages/pi-openai-fast
  npm:mitsupi
"

log_info "Installing Pi packages..."
for pkg in $PACKAGES; do
  # Extract display name: strip git:/npm: prefix, URL path, .git suffix
  display_name="${pkg##*/}"
  display_name="${display_name%.git}"
  display_name="${display_name#npm:}"
  failed=false
  for profile_dir in "$HOME/.pi/work" "$HOME/.pi/personal"; do
    if ! PI_CODING_AGENT_DIR="$profile_dir" "$HOME/.bun/bin/pi" install "$pkg" 2>/dev/null; then
      failed=true
      break
    fi
  done

  if [ "$failed" = false ]; then
    log_success "Installed $display_name"
  else
    log_warn "Failed to install $display_name (run 'PI_CODING_AGENT_DIR=<profile> pi install $pkg' manually)"
  fi
done

log_success "Pi configuration complete!"
