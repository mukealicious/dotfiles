#!/usr/bin/env bash
# shellcheck disable=SC1091
#
# Install Surf browser lane native hosts.
#
# This dotfiles setup intentionally avoids Surf's single default /tmp/surf.sock.
# Edge uses its own native-host wrapper and socket; personal Brave stays separate.

set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"

# shellcheck source=../lib/log.sh
. "$DOTFILES_ROOT/lib/log.sh"

if ! command -v mise >/dev/null 2>&1; then
  log_warn "mise is not installed; skipping Surf lane setup"
  log_hint "Fix: run homebrew/install.sh or brew install mise"
  exit 0
fi

NODE_VERSION="$(mise current -C "$DOTFILES_ROOT" node 2>/dev/null || true)"
if [ -z "$NODE_VERSION" ]; then
  log_warn "No active Node version found through mise; skipping Surf lane setup"
  exit 0
fi

NODE_PATH="$(mise exec -C "$DOTFILES_ROOT" "node@$NODE_VERSION" -- which node 2>/dev/null || true)"
NPM_PREFIX="$(mise exec -C "$DOTFILES_ROOT" "node@$NODE_VERSION" -- npm prefix -g 2>/dev/null || true)"
NPM_ROOT="$(mise exec -C "$DOTFILES_ROOT" "node@$NODE_VERSION" -- npm root -g 2>/dev/null || true)"

if [ -z "$NODE_PATH" ] || [ ! -x "$NODE_PATH" ]; then
  log_warn "Could not find mise-managed Node; skipping Surf lane setup"
  log_hint "Fix: run $DOTFILES_ROOT/mise/install.sh"
  exit 0
fi

SURF_BIN="$NPM_PREFIX/bin/surf"
SURF_ROOT="$NPM_ROOT/surf-cli"
SURF_HOST="$SURF_ROOT/native/host.cjs"
SURF_SOCKET_MODULE="$SURF_ROOT/native/socket-path.cjs"

if [ -z "$NPM_PREFIX" ] || [ ! -x "$SURF_BIN" ] || [ ! -f "$SURF_HOST" ]; then
  log_warn "surf-cli is not installed under mise-managed Node; skipping Surf lane setup"
  log_hint "Fix: run $DOTFILES_ROOT/mise/install.sh"
  exit 0
fi

if [ ! -f "$SURF_SOCKET_MODULE" ] || ! grep -Fq 'process.env.SURF_SOCKET' "$SURF_SOCKET_MODULE"; then
  log_error "Installed surf-cli does not provide the required SURF_SOCKET interface"
  log_hint "Expected: $SURF_SOCKET_MODULE"
  log_hint "Fix: install the pinned surf-cli version with $DOTFILES_ROOT/mise/install.sh"
  exit 1
fi

EXTENSION_PATH="$(mise exec -C "$DOTFILES_ROOT" "node@$NODE_VERSION" -- "$SURF_BIN" extension-path 2>/dev/null || true)"
if [ -z "$EXTENSION_PATH" ] || [ ! -d "$EXTENSION_PATH" ]; then
  log_warn "Could not determine Surf extension path"
  log_hint "Command failed: $SURF_BIN extension-path"
  exit 0
fi

case "$(uname -s)" in
  Darwin)
    WRAPPER_DIR="$HOME/Library/Application Support/surf-cli-dotfiles"
    retired_manifest="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts/surf.browser.host.json"
    edge_manifest_dir="$HOME/Library/Application Support/Microsoft Edge/NativeMessagingHosts"
    ;;
  Linux)
    WRAPPER_DIR="$HOME/.local/share/surf-cli-dotfiles"
    retired_manifest="$HOME/.config/BraveSoftware/Brave-Browser/NativeMessagingHosts/surf.browser.host.json"
    edge_manifest_dir="$HOME/.config/microsoft-edge/NativeMessagingHosts"
    ;;
  *)
    log_warn "Surf lane setup is only implemented for macOS and Linux"
    exit 0
    ;;
esac

# Retire only our old Brave native host; preserve browser profiles and foreign hosts.
"$NODE_PATH" - "$retired_manifest" "$WRAPPER_DIR/brave-host-wrapper.sh" <<'NODE'
const fs = require('node:fs');
const [manifestPath, wrapperPath] = process.argv.slice(2);
if (fs.existsSync(manifestPath) && !fs.lstatSync(manifestPath).isSymbolicLink()) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.name === 'surf.browser.host' && manifest.path === wrapperPath &&
      manifest.description?.includes('dotfiles managed')) {
    fs.unlinkSync(manifestPath);
    console.log('  Retired dotfiles-managed Brave Surf native host');
  }
}
NODE

write_wrapper() {
  local lane="$1"
  local socket="$2"
  local wrapper="$WRAPPER_DIR/$lane-host-wrapper.sh"

  mkdir -p "$WRAPPER_DIR"
  cat > "$wrapper" <<EOF
#!/usr/bin/env bash
set -e
export SURF_SOCKET="$socket"
if [ "\${SURF_WRAPPER_DEBUG:-}" = "1" ]; then
  printf '%s %s %s\n' "\$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$lane" "$socket" >> /tmp/surf-native-host-wrapper.log
fi
cd "$(dirname "$SURF_HOST")"
exec "$NODE_PATH" "$SURF_HOST" "\$@"
EOF
  chmod 755 "$wrapper"
  printf '%s\n' "$wrapper"
}

write_manifest() {
  local manifest_dir="$1"
  local extension_id="$2"
  local wrapper="$3"
  local label="$4"
  local manifest_path="$manifest_dir/surf.browser.host.json"

  mkdir -p "$manifest_dir"
  cat > "$manifest_path" <<EOF
{
  "name": "surf.browser.host",
  "description": "Surf CLI Native Host ($label lane, dotfiles managed)",
  "path": "$wrapper",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://$extension_id/"
  ]
}
EOF
  log_success "Installed Surf native host for $label"
  log_hint "Manifest: $manifest_path"
}

find_extension_id() {
  local browser="$1"
  local extension_path="$2"
  local browser_root="$3"
  local err_file="$4"

  "$NODE_PATH" "$DOTFILES_ROOT/surf/scripts/find-extension-id.mjs" "$browser" "$extension_path" "$browser_root" 2>"$err_file"
}

# Edge may omit unpacked extensions from readable preferences. Retain a valid
# ID from our existing host instead of leaving its Node path stale on upgrades.
existing_extension_id() {
  "$NODE_PATH" - "$1/surf.browser.host.json" "$WRAPPER_DIR/$2-host-wrapper.sh" <<'NODE'
const fs = require('node:fs');
try {
  const manifest = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const origins = manifest.allowed_origins;
  if (manifest.name !== 'surf.browser.host' || manifest.type !== 'stdio' ||
      manifest.path !== process.argv[3] ||
      !manifest.description?.includes('dotfiles managed') ||
      !Array.isArray(origins) || origins.length !== 1) process.exit(1);
  const match = /^chrome-extension:\/\/([a-p]{32})\/$/.exec(origins[0]);
  if (!match) process.exit(1);
  console.log(match[1]);
} catch {
  process.exit(1);
}
NODE
}

install_lane() {
  local browser="$1"
  local label="$2"
  local socket="$3"
  local manifest_dir="$4"
  local extension_path="$5"
  local browser_root="$6"

  local err_file
  err_file="$(mktemp)"

  local extension_id
  if extension_id="$(find_extension_id "$browser" "$extension_path" "$browser_root" "$err_file")" ||
     extension_id="$(existing_extension_id "$manifest_dir" "$browser")"; then
    local wrapper
    wrapper="$(write_wrapper "$browser" "$socket")"
    write_manifest "$manifest_dir" "$extension_id" "$wrapper" "$label"
    log_hint "CLI wrapper: surf-$browser (socket $socket)"
  else
    log_warn "Surf extension not found for $label; native host not installed"
    while IFS= read -r line; do
      [ -n "$line" ] && log_hint "$line"
    done < "$err_file"
    log_hint "Load the unpacked extension in edge://extensions, then rerun this installer"
  fi

  rm -f "$err_file"
}

log_info "Setting up Surf browser lanes"
log_hint "Extension path: $EXTENSION_PATH"
log_hint "Do not use 'surf install' for these lanes; this installer writes per-browser sockets."

install_lane "edge" "Microsoft Edge" "/tmp/surf-edge.sock" "$edge_manifest_dir" "$EXTENSION_PATH" ""

log_success "Surf lane setup complete"
log_hint "Restart any browser whose native host was updated, then test with: surf tab.list"
