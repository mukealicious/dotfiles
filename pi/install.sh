#!/bin/sh
#
# Pi Coding Agent Configuration
#
# Sets up Pi's standard agent directory, materializes writable settings,
# and symlinks managed resources. Installs Pi packages via `pi install`.
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
AGENT_DIR="$HOME/.pi/agent"
MIN_PI_VERSION="0.99.1"
MITSUPI_PACKAGE="git:github.com/mitsuhiko/agent-stuff@0865c849befd2021490679f96a8dee58c84ac857"
FAST_PACKAGE="npm:@benvargas/pi-openai-fast@1.1.1"
FAST_DIR="$AGENT_DIR/npm/node_modules/@benvargas/pi-openai-fast"
FAST_PATCH="$DOTFILES_ROOT/pi/patches/pi-openai-fast-1.1.1-policy.patch"
FAST_STATUS_PATCH="$DOTFILES_ROOT/pi/patches/pi-openai-fast-1.1.1-footer-status.patch"
FAST_PRISTINE_SHA256="2dbe16ae6db42877ca84d435395e0028a99e3bb8be932e4a576918495ce3911c"
FAST_POLICY_PATCHED_SHA256="3c94d6a8895c23344824a420abef1cd455b9073408ecbe3a6374b65ec3a097f2"
FAST_PATCHED_SHA256="596b7a9171df69d6be59b875ce38760457866d244ac48f0fe431b1410cffd82d"

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
  log_error "patch is required to apply the Fast package patches"
  exit 1
fi

if [ ! -f "$FAST_PATCH" ]; then
  log_error "Fast policy patch is missing: $FAST_PATCH"
  exit 1
fi

if [ ! -f "$FAST_STATUS_PATCH" ]; then
  log_error "Fast footer status patch is missing: $FAST_STATUS_PATCH"
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
    log_error "Pi $pi_version is too old; Pi >= $MIN_PI_VERSION is required for native MCP and ChatGPT login"
    exit 1
  fi
  log_success "Pi $pi_version supports native MCP and ChatGPT login"
}

check_subagents_dependencies() {
  # This is intentionally read-only: npm ci would replace dependencies also
  # used by active runner processes through the source-linked package tree.
  SUBAGENTS_NODE_MODULES="$DOTFILES_ROOT/pi/packages/pi-subagents/node_modules"
  for dependency in acorn jiti undici yaml; do
    dependency_dir="$SUBAGENTS_NODE_MODULES/$dependency"
    expected_version="$(jq -r --arg package "node_modules/$dependency" '.packages[$package].version // empty' "$DOTFILES_ROOT/pi/packages/pi-subagents/package-lock.json")"
    if [ ! -f "$dependency_dir/package.json" ] || [ -z "$expected_version" ] \
      || ! jq -e --arg name "$dependency" --arg version "$expected_version" '.name == $name and .version == $version' "$dependency_dir/package.json" >/dev/null 2>&1; then
      log_error "pi-subagents dependency is missing or does not match the lockfile: $dependency_dir"
      log_hint "Stop all Pi/subagent runners, then refresh dependencies manually: cd $DOTFILES_ROOT/pi/packages/pi-subagents && npm_config_legacy_peer_deps=true mise exec -C $DOTFILES_ROOT -- npm ci --omit=dev --ignore-scripts"
      exit 1
    fi
  done
}

# Reject a broken source-linked dependency tree before settings, links, or
# package resources are changed. This check never writes into node_modules.
check_pi_version
check_subagents_dependencies

# Adopt the exact reviewed npm artifact, not another vendored fork. Configuration
# remains owned by /fast; never reset active/persistState/supportedModels here.
if [ ! -e "$FAST_DIR" ]; then
  PI_CODING_AGENT_DIR="$AGENT_DIR" mise exec -C "$DOTFILES_ROOT" -- "$PI_BIN" install "$FAST_PACKAGE"
fi
if ! jq -e '.name == "@benvargas/pi-openai-fast" and .version == "1.1.1"' "$FAST_DIR/package.json" >/dev/null 2>&1; then
  log_error "Expected $FAST_PACKAGE at $FAST_DIR; refusing unknown package context"
  exit 1
fi
fast_extension_sha256() {
  shasum -a 256 "$1" | awk '{print $1}'
}

# Whole-file digests reject edits both inside and outside patch hunks. Accept the
# pinned pristine artifact or exact prior policy output, and verify staged output.
fast_context_sha256="$(fast_extension_sha256 "$FAST_DIR/extensions/index.ts")"
if [ "$fast_context_sha256" = "$FAST_PATCHED_SHA256" ]; then
  log_success "Fast policy and footer status patches already applied"
elif [ "$fast_context_sha256" = "$FAST_PRISTINE_SHA256" ] || [ "$fast_context_sha256" = "$FAST_POLICY_PATCHED_SHA256" ]; then
  fast_stage="$(mktemp -d)"
  fast_tmp=""
  trap 'rm -rf "$fast_stage"; [ -z "$fast_tmp" ] || rm -f "$fast_tmp"' EXIT
  mkdir -p "$fast_stage/extensions"
  cp "$FAST_DIR/extensions/index.ts" "$fast_stage/extensions/index.ts"
  if [ "$fast_context_sha256" = "$FAST_PRISTINE_SHA256" ]; then
    if ! (cd "$fast_stage" && patch -p1 -N -F 0 -f < "$FAST_PATCH") >/dev/null; then
      log_error "Fast policy patch failed against its pinned pristine artifact"
      exit 1
    fi
    if [ "$(fast_extension_sha256 "$fast_stage/extensions/index.ts")" != "$FAST_POLICY_PATCHED_SHA256" ]; then
      log_error "Fast policy patch output does not match its pinned digest"
      exit 1
    fi
  fi
  if ! (cd "$fast_stage" && patch -p1 -N -F 0 -f < "$FAST_STATUS_PATCH") >/dev/null; then
    log_error "Fast footer status patch failed against its pinned policy artifact"
    exit 1
  fi
  if [ "$(fast_extension_sha256 "$fast_stage/extensions/index.ts")" != "$FAST_PATCHED_SHA256" ]; then
    log_error "Fast status patch output does not match its pinned digest"
    exit 1
  fi
  fast_tmp="$(mktemp "$FAST_DIR/extensions/index.ts.XXXXXX")"
  cp "$fast_stage/extensions/index.ts" "$fast_tmp"
  mv "$fast_tmp" "$FAST_DIR/extensions/index.ts"
  fast_tmp=""
  rm -rf "$fast_stage"
  trap - EXIT
  log_success "Applied Fast policy and footer status patches"
else
  log_error "Unknown or partially patched Fast package context: $FAST_DIR/extensions/index.ts"
  log_hint "Reinstall $FAST_PACKAGE to restore the pinned pristine artifact, then rerun this installer"
  exit 1
fi

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

  # Source owns resource selection; native /model and /settings own preferences.
  # Defaults bootstrap missing keys, not overwrite deliberate runtime choices.
  managed_keys='["packages", "skills", "extensions", "prompts", "themes", "defaultTools"]'

  if [ -e "$settings_dst" ]; then
    if ! jq --argjson managed_keys "$managed_keys" -s '
      .[0] as $managed
      | .[1] as $runtime
      | $managed * ($runtime | with_entries(.key as $key | select($managed_keys | index($key) == null)))
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

# Native mcp.json is machine-local and writable through /mcp. Do not overwrite
# server choices or credentials on subsequent installs.

setup_pi_resources() {
  mkdir -p "$AGENT_DIR"
  materialize_pi_settings "$DOTFILES_ROOT/pi/settings.json" "$AGENT_DIR/settings.json" "agent/settings.json"

  # models.json is entirely user-owned. /fast owns managed priority policy.

  if [ -d "$DOTFILES_ROOT/pi/node_modules" ]; then
    ensure_symlink "$DOTFILES_ROOT/pi/node_modules" "$AGENT_DIR/node_modules" "agent/node_modules"
  else
    log_warn "Pi extension dependencies are missing"
    log_hint "Run manually: cd $DOTFILES_ROOT/pi && npm install"
  fi

  mkdir -p "$AGENT_DIR/themes"
  for theme in "$DOTFILES_ROOT/pi/themes/"*.json; do
    [ -e "$theme" ] || continue
    name="$(basename "$theme")"
    ensure_symlink "$theme" "$AGENT_DIR/themes/$name" "agent/themes/$name"
  done

  mkdir -p "$AGENT_DIR/prompts"
  for prompt in "$DOTFILES_ROOT/pi/prompts/"*.md; do
    [ -e "$prompt" ] || continue
    name="$(basename "$prompt")"
    ensure_symlink "$prompt" "$AGENT_DIR/prompts/$name" "agent/prompts/$name"
  done

  EXTENSIONS_SRC="$DOTFILES_ROOT/pi/extensions"
  EXTENSIONS_DIR="$AGENT_DIR/extensions"
  if [ -d "$EXTENSIONS_SRC" ]; then
    mkdir -p "$EXTENSIONS_DIR"
    for ext in "$EXTENSIONS_SRC"/*.ts; do
      [ -e "$ext" ] || continue
      name="$(basename "$ext")"
      ensure_symlink "$ext" "$EXTENSIONS_DIR/$name" "agent/extensions/$name"
    done
  fi
}

# D4 retires these installer-managed extension links. Match the exact absolute
# source path that previous installer runs created, including links that are
# now dead because the source was deleted. Never remove user-owned files,
# directories, or links to another live source.
remove_retired_extension_link() {
  extension_name="$1"
  extension_source="$DOTFILES_ROOT/pi/extensions/$extension_name"
  extension_target="$AGENT_DIR/extensions/$extension_name"
  extension_label="agent/extensions/$extension_name"

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

setup_pi_resources
# Retired modes.json files are left untouched; native settings own selection.
if [ ! -e "$AGENT_DIR/mcp.json" ] && [ ! -L "$AGENT_DIR/mcp.json" ]; then
  (umask 077; printf '%s\n' '{"mcpServers":{}}' > "$AGENT_DIR/mcp.json")
fi

for extension_name in cost.ts watchdog.ts usage-footer.ts handoff.ts; do
  remove_retired_extension_link "$extension_name"
done
# Only the retired handoff extension used this managed library link.
if [ -L "$AGENT_DIR/lib" ] && [ "$(readlink "$AGENT_DIR/lib")" = "$DOTFILES_ROOT/pi/lib" ]; then
  rm "$AGENT_DIR/lib"
  log_success "Removed retired managed handoff library link"
fi

PACKAGES="
  $DOTFILES_ROOT/pi/packages/pi-exa
  $DOTFILES_ROOT/pi/packages/pi-parallel
  $DOTFILES_ROOT/pi/packages/pi-subagents
  $MITSUPI_PACKAGE
"

log_info "Installing Pi packages..."
for pkg in $PACKAGES; do
  # Extract display name: strip git:/npm: prefix, URL path, .git suffix
  display_name="${pkg##*/}"
  display_name="${display_name%.git}"
  display_name="${display_name#npm:}"
  if ! PI_CODING_AGENT_DIR="$AGENT_DIR" mise exec -C "$DOTFILES_ROOT" -- "$PI_BIN" install "$pkg"; then
    log_error "Failed to install required package $display_name"
    log_hint "Retry manually: PI_CODING_AGENT_DIR=$AGENT_DIR mise exec -C $DOTFILES_ROOT -- $PI_BIN install $pkg"
    exit 1
  fi

  log_success "Installed $display_name"
done

log_success "Pi configuration complete!"
