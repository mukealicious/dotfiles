#!/usr/bin/env bash
# shellcheck disable=SC1091
#
# Install Surf browser lane native hosts.
#
# This dotfiles setup intentionally avoids Surf's single default /tmp/surf.sock.
# Brave and Edge get separate native-host wrappers and sockets so agents target
# the intended browser consistently.

set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"

# shellcheck source=../lib/log.sh
. "$DOTFILES_ROOT/lib/log.sh"

NODE_VERSION="$(awk -F= '/^[[:space:]]*node[[:space:]]*=/{gsub(/[ \"'"'"']/, "", $2); print $2; exit}' "$DOTFILES_ROOT/mise.toml")"

if ! command -v mise >/dev/null 2>&1; then
  log_warn "mise is not installed; skipping Surf lane setup"
  log_hint "Fix: run homebrew/install.sh or brew install mise"
  exit 0
fi

if [ -z "$NODE_VERSION" ]; then
  log_warn "No Node version found in mise.toml; skipping Surf lane setup"
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
    # Brave's macOS build resolves user-level native hosts through Chromium's
    # Google Chrome path, even though its profile data lives under BraveSoftware.
    brave_manifest_dir="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
    brave_extension_path="$WRAPPER_DIR/brave-agent-extension"
    brave_user_data_dir="$WRAPPER_DIR/brave-user-data"
    edge_manifest_dir="$HOME/Library/Application Support/Microsoft Edge/NativeMessagingHosts"
    ;;
  Linux)
    WRAPPER_DIR="$HOME/.local/share/surf-cli-dotfiles"
    brave_manifest_dir="$HOME/.config/BraveSoftware/Brave-Browser/NativeMessagingHosts"
    brave_extension_path="$WRAPPER_DIR/brave-agent-extension"
    brave_user_data_dir="$WRAPPER_DIR/brave-user-data"
    edge_manifest_dir="$HOME/.config/microsoft-edge/NativeMessagingHosts"
    ;;
  *)
    log_warn "Surf lane setup is only implemented for macOS and Linux"
    exit 0
    ;;
esac

sync_managed_extension() {
  local source="$1"
  local destination="$2"

  "$NODE_PATH" - "$source" "$destination" <<'NODE'
const fs = require('node:fs');
const [source, destination] = process.argv.slice(2);
fs.rmSync(destination, { recursive: true, force: true });
fs.cpSync(source, destination, { recursive: true });
NODE
}

sync_managed_extension "$EXTENSION_PATH" "$brave_extension_path"
log_success "Updated managed Brave agent extension"
log_hint "Extension path: $brave_extension_path"

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
  if extension_id="$(find_extension_id "$browser" "$extension_path" "$browser_root" "$err_file")"; then
    local wrapper
    wrapper="$(write_wrapper "$browser" "$socket")"
    write_manifest "$manifest_dir" "$extension_id" "$wrapper" "$label"
    log_hint "CLI wrapper: surf-$browser (socket $socket)"
  else
    log_warn "Surf extension not found for $label; native host not installed"
    while IFS= read -r line; do
      [ -n "$line" ] && log_hint "$line"
    done < "$err_file"
    if [ "$browser" = "brave" ]; then
      log_hint "First setup: run surf-brave tab.list once, then rerun this installer"
    fi
  fi

  rm -f "$err_file"
}

log_info "Setting up Surf browser lanes"
log_hint "Extension path: $EXTENSION_PATH"
log_hint "Do not use 'surf install' for these lanes; this installer writes per-browser sockets."

install_lane "brave" "Brave agent profile" "/tmp/surf-brave.sock" "$brave_manifest_dir" "$brave_extension_path" "$brave_user_data_dir"
install_lane "edge" "Microsoft Edge" "/tmp/surf-edge.sock" "$edge_manifest_dir" "$EXTENSION_PATH" ""

log_success "Surf lane setup complete"
log_hint "Restart any browser whose native host was updated, then test with: surf-brave tab.list or surf-edge tab.list"
