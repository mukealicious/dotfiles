#!/bin/sh
#
# Pi Coding Agent Configuration
#
# Sets up Pi profile directories, materializes writable settings and personal
# modes, and symlinks managed resources. Installs Pi packages via `pi install`.
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
MIN_PI_VERSION="0.80.6"
MITSUPI_PACKAGE="npm:mitsupi@1.6.0"
MITSUPI_PROMPT_EDITOR_PATCH="$DOTFILES_ROOT/pi/patches/mitsupi-1.6.0-prompt-editor.patch"
MITSUPI_PROMPT_EDITOR_THEME_PATCH="$DOTFILES_ROOT/pi/patches/mitsupi-1.6.0-prompt-editor-theme.patch"
MITSUPI_FILES_SHORTCUT_PATCH="$DOTFILES_ROOT/pi/patches/mitsupi-1.6.0-files-shortcut.patch"
PERSONAL_MODES_BASELINE="$DOTFILES_ROOT/pi/modes.personal.json"

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

if ! command -v jq >/dev/null 2>&1; then
  log_error "jq is required for Pi setup"
  log_hint "Install it with: brew install jq"
  exit 1
fi

if ! command -v patch >/dev/null 2>&1; then
  log_error "patch is required to apply the Mitsupi compatibility patch"
  exit 1
fi

if [ ! -f "$MITSUPI_PROMPT_EDITOR_PATCH" ]; then
  log_error "Mitsupi compatibility patch is missing: $MITSUPI_PROMPT_EDITOR_PATCH"
  exit 1
fi

if [ ! -f "$MITSUPI_PROMPT_EDITOR_THEME_PATCH" ]; then
  log_error "Mitsupi compatibility patch is missing: $MITSUPI_PROMPT_EDITOR_THEME_PATCH"
  exit 1
fi

if [ ! -f "$MITSUPI_FILES_SHORTCUT_PATCH" ]; then
  log_error "Mitsupi compatibility patch is missing: $MITSUPI_FILES_SHORTCUT_PATCH"
  exit 1
fi

pi_version_at_least() {
  actual="$1"
  minimum="$2"
  awk -v actual="$actual" -v minimum="$minimum" '
    BEGIN {
      split(actual, a, ".")
      split(minimum, b, ".")
      for (i = 1; i <= 3; i++) {
        if ((a[i] + 0) > (b[i] + 0)) exit 0
        if ((a[i] + 0) < (b[i] + 0)) exit 1
      }
      exit 0
    }
  '
}

check_pi_version() {
  pi_version="$($PI_BIN --version 2>/dev/null | sed -n 's/.*\([0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\).*/\1/p' | head -n 1)"
  if [ -z "$pi_version" ]; then
    log_error "Unable to determine Pi version; Pi >= $MIN_PI_VERSION is required"
    exit 1
  fi
  if ! pi_version_at_least "$pi_version" "$MIN_PI_VERSION"; then
    log_error "Pi $pi_version is too old; Pi >= $MIN_PI_VERSION is required for native max thinking"
    exit 1
  fi
  log_success "Pi $pi_version supports native max thinking"
}

mitsupi_package_dir() {
  printf '%s/.pi/%s/npm/node_modules/mitsupi\n' "$HOME" "$1"
}

check_mitsupi_patch_context() {
  if (cd "$1" && patch -p1 -N -F 0 -t --dry-run < "$3") >/dev/null 2>&1; then
    return 0
  fi
  if (cd "$1" && patch -R -p1 -F 0 -t --dry-run < "$3") >/dev/null 2>&1; then
    return 0
  fi

  log_error "Unknown Mitsupi 1.6.0 $4 context for $2: $5"
  log_hint "Refusing to mutate either profile; inspect the installed package before retrying"
  exit 1
}

check_mitsupi_package_copy() {
  profile_name="$1"
  package_dir="$(mitsupi_package_dir "$profile_name")"

  # A missing package is installed below. An existing package, including a
  # malformed directory, must be validated before any profile is mutated.
  if [ ! -e "$package_dir" ] && [ ! -L "$package_dir" ]; then
    log_info "Mitsupi is not installed for $profile_name yet"
    return 0
  fi

  package_json="$package_dir/package.json"
  prompt_editor="$package_dir/extensions/prompt-editor.ts"
  files_extension="$package_dir/extensions/files.ts"
  if [ ! -f "$package_json" ] || ! jq -e --arg version "1.6.0" '.name == "mitsupi" and .version == $version' "$package_json" >/dev/null 2>&1; then
    log_error "Mitsupi $profile_name copy is not exactly version 1.6.0: $package_dir"
    log_hint "Remove or reinstall only this profile's package with PI_CODING_AGENT_DIR=$HOME/.pi/$profile_name pi install $MITSUPI_PACKAGE"
    exit 1
  fi
  if [ ! -f "$prompt_editor" ]; then
    log_error "Mitsupi $profile_name prompt-editor context is missing: $prompt_editor"
    exit 1
  fi
  if [ ! -f "$files_extension" ]; then
    log_error "Mitsupi $profile_name files context is missing: $files_extension"
    exit 1
  fi

  check_mitsupi_patch_context "$package_dir" "$profile_name" "$MITSUPI_PROMPT_EDITOR_PATCH" "prompt-editor" "$prompt_editor"
  check_mitsupi_patch_context "$package_dir" "$profile_name" "$MITSUPI_PROMPT_EDITOR_THEME_PATCH" "prompt-editor theme" "$prompt_editor"
  check_mitsupi_patch_context "$package_dir" "$profile_name" "$MITSUPI_FILES_SHORTCUT_PATCH" "files shortcut" "$files_extension"
  log_success "Validated Mitsupi 1.6.0 patch contexts for $profile_name"
}

preflight_mitsupi_copies() {
  check_mitsupi_package_copy work
  check_mitsupi_package_copy personal
}

validate_pi_modes_baseline() {
  modes_src="$1"
  modes_label="$2"

  if [ ! -f "$modes_src" ]; then
    log_error "$modes_label is missing: $modes_src"
    exit 1
  fi

  if ! jq -e '
    type == "object"
    and .version == 1
    and (.currentMode | type == "string" and length > 0)
    and (.modes | type == "object" and length > 0)
    and (. as $root | $root.modes | has($root.currentMode))
    and all(
      .modes[];
      type == "object"
      and (.provider | type == "string" and length > 0)
      and (.modelId | type == "string" and length > 0)
      and (
        .thinkingLevel as $thinking
        | ["off", "minimal", "low", "medium", "high", "xhigh", "max"]
        | index($thinking) != null
      )
      and (
        .color as $color
        | ["thinkingOff", "thinkingMinimal", "thinkingLow", "thinkingMedium", "thinkingHigh", "thinkingXhigh", "thinkingMax"]
        | index($color) != null
      )
    )
  ' "$modes_src" >/dev/null 2>&1; then
    log_error "$modes_label is not a valid Mitsupi modes baseline: $modes_src"
    exit 1
  fi

  log_success "Validated $modes_label"
}

ensure_mitsupi_package() {
  for profile_name in work personal; do
    package_dir="$(mitsupi_package_dir "$profile_name")"
    if [ -d "$package_dir" ]; then
      continue
    fi
    log_info "Installing $MITSUPI_PACKAGE for $profile_name..."
    if ! PI_CODING_AGENT_DIR="$HOME/.pi/$profile_name" mise exec -C "$DOTFILES_ROOT" -- "$PI_BIN" install "$MITSUPI_PACKAGE"; then
      log_error "Failed to install $MITSUPI_PACKAGE for $profile_name"
      exit 1
    fi
  done
}

apply_mitsupi_patch_file() {
  if (cd "$1" && patch -p1 -N -F 0 -t --dry-run < "$3") >/dev/null 2>&1; then
    (cd "$1" && patch -p1 -N -F 0 -t < "$3") >/dev/null
    log_success "Applied Mitsupi 1.6.0 $4 patch for $2"
  elif (cd "$1" && patch -R -p1 -F 0 -t --dry-run < "$3") >/dev/null 2>&1; then
    log_success "Mitsupi 1.6.0 $4 patch already applied for $2"
  else
    log_error "Mitsupi 1.6.0 $4 context changed after preflight for $2"
    exit 1
  fi
}

apply_mitsupi_patches() {
  for profile_name in work personal; do
    package_dir="$(mitsupi_package_dir "$profile_name")"
    apply_mitsupi_patch_file "$package_dir" "$profile_name" "$MITSUPI_PROMPT_EDITOR_PATCH" "prompt-editor"
    apply_mitsupi_patch_file "$package_dir" "$profile_name" "$MITSUPI_PROMPT_EDITOR_THEME_PATCH" "prompt-editor theme"
    apply_mitsupi_patch_file "$package_dir" "$profile_name" "$MITSUPI_FILES_SHORTCUT_PATCH" "files shortcut"
  done
}

# Validate both existing copies before setup, package installation, or any
# profile link/settings mutation. Missing copies are the only allowed state;
# they are installed and validated again before the patch is applied.
check_pi_version
validate_pi_modes_baseline "$PERSONAL_MODES_BASELINE" "personal modes baseline"
preflight_mitsupi_copies

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

# Mitsupi writes mode edits atomically, so the runtime path must be a regular,
# writable file rather than a symlink into Git. The tracked baseline is the
# durable source of truth and is restored on each installer run.
materialize_pi_modes() {
  modes_src="$1"
  modes_dst="$2"
  modes_label="$3"

  if [ -e "$modes_dst" ] && [ ! -f "$modes_dst" ]; then
    log_error "$modes_label exists but is not a modes file"
    return 1
  fi

  modes_tmp="$(mktemp "${modes_dst}.tmp.XXXXXX")"
  if ! cp "$modes_src" "$modes_tmp"; then
    rm -f "$modes_tmp"
    log_error "Failed to materialize $modes_label"
    return 1
  fi
  chmod 600 "$modes_tmp"

  if [ ! -L "$modes_dst" ] && [ -f "$modes_dst" ] && cmp -s "$modes_tmp" "$modes_dst"; then
    chmod 600 "$modes_dst"
    rm -f "$modes_tmp"
    return 0
  fi

  # mv replaces a legacy symlink itself rather than writing through it.
  mv "$modes_tmp" "$modes_dst"
  log_success "Materialized $modes_label"
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
materialize_pi_modes "$PERSONAL_MODES_BASELINE" "$HOME/.pi/personal/modes.json" "$HOME/.pi/personal/modes.json"

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
"

ensure_mitsupi_package
preflight_mitsupi_copies
apply_mitsupi_patches

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
