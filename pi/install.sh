#!/bin/sh
#
# Pi Coding Agent Configuration
#
# Sets up Pi profile directories, materializes writable settings, and symlinks
# managed resources. Installs Pi packages via `pi install`.
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

PI_PACKAGE="@earendil-works/pi-coding-agent"
PI_BIN="$HOME/.bun/bin/pi"

if [ ! -x "$PI_BIN" ]; then
  log_info "Installing Pi coding agent ($PI_PACKAGE)..."
  if command -v mise >/dev/null 2>&1 && mise exec -C "$DOTFILES_ROOT" -- bun install -g "$PI_PACKAGE" --minimum-release-age=0 >/dev/null 2>&1; then
    log_success "Installed pi"
  else
    log_warn "pi not installed, skipping Pi setup"
    log_hint "Run manually: mise exec -C $DOTFILES_ROOT -- bun install -g $PI_PACKAGE --minimum-release-age=0"
    exit 0
  fi
fi

log_info "Setting up Pi coding agent..."

# Pi persists interactive model choices and changelog state in settings.json.
# Materialize a writable runtime file instead of symlinking it into Git. Repo
# settings remain the managed baseline, while explicitly runtime-owned fields
# survive subsequent installer runs.
materialize_pi_settings() {
  settings_src="$1"
  settings_dst="$2"
  settings_label="$3"

  if ! command -v jq >/dev/null 2>&1; then
    log_error "jq is required to materialize $settings_label"
    log_hint "Install it with: brew install jq"
    return 1
  fi

  if [ -e "$settings_dst" ] && [ ! -f "$settings_dst" ]; then
    log_error "$settings_label exists but is not a settings file"
    return 1
  fi

  settings_tmp="$(mktemp "${settings_dst}.tmp.XXXXXX")"

  if [ -e "$settings_dst" ]; then
    if ! jq --argjson runtime_keys '["defaultProvider", "defaultModel", "defaultThinkingLevel", "lastChangelogVersion", "trackingId"]' -s '
      .[0] as $managed
      | .[1] as $runtime
      | $managed * (
          $runtime
          | with_entries(
              .key as $key
              | select($runtime_keys | index($key) != null)
            )
        )
    ' "$settings_src" "$settings_dst" > "$settings_tmp"; then
      rm -f "$settings_tmp"
      log_error "Failed to merge $settings_label"
      return 1
    fi
  else
    cp "$settings_src" "$settings_tmp"
  fi

  if [ ! -L "$settings_dst" ] && [ -f "$settings_dst" ] && cmp -s "$settings_tmp" "$settings_dst"; then
    rm -f "$settings_tmp"
    return 0
  fi

  # mv replaces a legacy symlink itself rather than writing through it.
  mv "$settings_tmp" "$settings_dst"
  log_success "Materialized $settings_label"
}

setup_pi_profile() {
  profile_dir="$1"
  settings_src="$2"
  profile_name="$3"

  mkdir -p "$profile_dir"
  materialize_pi_settings "$settings_src" "$profile_dir/settings.json" "$profile_name/settings.json"

  if [ -d "$DOTFILES_ROOT/pi/node_modules" ]; then
    ensure_symlink "$DOTFILES_ROOT/pi/node_modules" "$profile_dir/node_modules" "$profile_name/node_modules"
  else
    log_warn "Pi extension dependencies are missing"
    log_hint "Run manually: cd $DOTFILES_ROOT/pi && npm install"
  fi

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

# D4 retires these installer-managed extension links. Match the exact absolute
# source path that previous installer runs created, including links that are
# now dead because the source was deleted. Never remove user-owned files,
# directories, or links to another live source.
remove_retired_extension_link() {
  profile_dir="$1"
  profile_name="$2"
  extension_name="$3"
  extension_source="$DOTFILES_ROOT/pi/extensions/$extension_name"
  extension_target="$profile_dir/extensions/$extension_name"
  extension_label="$profile_name/extensions/$extension_name"

  if [ -L "$extension_target" ]; then
    if [ "$(readlink "$extension_target")" = "$extension_source" ]; then
      rm "$extension_target"
      log_success "Removed retired managed extension link: $extension_label"
    elif [ -e "$extension_target" ]; then
      log_warn "Preserving unmanaged extension link: $extension_label"
    else
      log_warn "Preserving dead unmanaged extension link: $extension_label"
    fi
  elif [ -e "$extension_target" ]; then
    log_warn "Preserving user-owned extension entry: $extension_label"
  fi
}

setup_pi_profile "$HOME/.pi/work" "$DOTFILES_ROOT/pi/settings.work.json" "$HOME/.pi/work"
setup_pi_profile "$HOME/.pi/personal" "$DOTFILES_ROOT/pi/settings.personal.json" "$HOME/.pi/personal"

for profile_name in work personal; do
  profile_dir="$HOME/.pi/$profile_name"
  remove_retired_extension_link "$profile_dir" "$profile_name" cost.ts
  remove_retired_extension_link "$profile_dir" "$profile_name" watchdog.ts
done

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
if [ -f "$DOTFILES_ROOT/pi/packages/pi-subagents/package-lock.json" ]; then
  log_info "Installing pi-subagents runtime dependencies..."
  if npm_config_legacy_peer_deps=true mise exec -C "$DOTFILES_ROOT/pi/packages/pi-subagents" -- npm ci --omit=dev --ignore-scripts >/dev/null 2>&1; then
    log_success "Installed pi-subagents dependencies"
  else
    log_warn "Failed to install pi-subagents dependencies"
    log_hint "Run manually: npm_config_legacy_peer_deps=true mise exec -C $DOTFILES_ROOT/pi/packages/pi-subagents -- npm ci --omit=dev --ignore-scripts"
  fi
fi

PACKAGES="
  $DOTFILES_ROOT/pi/packages/pi-exa
  $DOTFILES_ROOT/pi/packages/pi-parallel
  $DOTFILES_ROOT/pi/packages/pi-openai-fast
  $DOTFILES_ROOT/pi/packages/pi-subagents
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
    if ! PI_CODING_AGENT_DIR="$profile_dir" mise exec -C "$DOTFILES_ROOT" -- "$PI_BIN" install "$pkg" 2>/dev/null; then
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
