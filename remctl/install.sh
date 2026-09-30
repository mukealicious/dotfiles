#!/bin/sh
# Install the reviewed, notarized RemCTL distribution. Upstream owns the app,
# protected Python, ownership manifest, and transactional replacement.
set -e

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
# shellcheck source=../lib/log.sh
. "$DOTFILES_ROOT/lib/log.sh"
# shellcheck source=version.env
. "$DOTFILES_ROOT/remctl/version.env"
FORCE="${FORCE:-false}"
DRY_RUN=false
for arg in "$@"; do
  case "$arg" in
    --force) FORCE=true ;;
    --dry-run) DRY_RUN=true ;;
    *) log_error "Unknown remctl installer option: $arg"; exit 1 ;;
  esac
done

if [ "$(uname -s)" != Darwin ]; then
  log_warn "RemCTL is macOS-only; skipping"
  exit 0
fi
if [ "$(uname -m)" != arm64 ]; then
  log_error "The pinned RemCTL download supports Apple silicon only"
  log_hint "Intel requires a separately reviewed upstream source-build installation"
  exit 1
fi

BIN_DIR="$HOME/.local/bin"
APP_PATH="$HOME/Applications/RemCTL Capability Host.app"
AGENT_PATH="$HOME/Library/LaunchAgents/net.macstories.remctl.capability-host.plist"
REMCTL_BIN="$BIN_DIR/remctl"
SIGNING_REQUIREMENT='=identifier "net.macstories.remctl.capability-host" and anchor apple generic and certificate leaf[field.1.2.840.113635.100.6.1.13] exists and certificate leaf[subject.OU] = "4W35M4UN6R"'

install_is_current() {
  [ -x "$REMCTL_BIN" ] || return 1
  [ "$("$REMCTL_BIN" --version 2>/dev/null)" = "$REMCTL_VERSION" ] || return 1
  [ -f "$BIN_DIR/.remctl-install-manifest.json" ] || return 1
  [ -f "$AGENT_PATH" ] || return 1
  [ "$(plutil -extract version raw "$APP_PATH/Contents/Resources/distribution.json" 2>/dev/null)" = "$REMCTL_VERSION" ] || return 1
  codesign --verify --deep --strict -R "$SIGNING_REQUIREMENT" "$APP_PATH" >/dev/null 2>&1 || return 1
  [ -f "$HOME/.config/fish/completions/remctl.fish" ] || return 1
  [ -L "$BIN_DIR/rctl" ] && [ "$(readlink "$BIN_DIR/rctl")" = remctl ] || return 1
  [ -L "$BIN_DIR/reminders" ] && [ "$(readlink "$BIN_DIR/reminders")" = remctl ]
}

if [ "$FORCE" != true ] && [ "$DRY_RUN" != true ] && install_is_current; then
  log_success "RemCTL $REMCTL_VERSION is already installed"
  exit 0
fi

CACHE_DIR="$HOME/Library/Caches/remctl/$REMCTL_REF"
DMG="$CACHE_DIR/RemCTL-arm64.dmg"
mkdir -p "$CACHE_DIR"
STAGE="$(mktemp -d "${TMPDIR:-/tmp}/dot-remctl.XXXXXX")"
MOUNT="$STAGE/mounted"
MOUNTED=false
cleanup() {
  if [ "$MOUNTED" = true ]; then
    if ! hdiutil detach "$MOUNT" -quiet; then
      log_warn "Could not eject $MOUNT; preserving $STAGE"
      return
    fi
  fi
  rm -rf "$STAGE"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

verify_checksum() {
  [ -f "$1" ] && [ "$(shasum -a 256 "$1" | awk '{print $1}')" = "$REMCTL_DMG_SHA256" ]
}
if ! verify_checksum "$DMG"; then
  log_info "Downloading RemCTL $REMCTL_VERSION"
  curl --fail --location --silent --show-error --proto '=https' --tlsv1.2 \
    "https://github.com/viticci/remctl/releases/download/$REMCTL_REF/RemCTL-arm64.dmg" \
    -o "$STAGE/RemCTL.dmg"
  if ! verify_checksum "$STAGE/RemCTL.dmg"; then
    log_error "RemCTL download checksum mismatch; nothing installed"
    exit 1
  fi
  mv "$STAGE/RemCTL.dmg" "$DMG"
fi
mkdir "$MOUNT"
hdiutil attach "$DMG" -readonly -nobrowse -mountpoint "$MOUNT" -quiet
MOUNTED=true
PREBUILT="$MOUNT/RemCTL Capability Host.app"
# Verify before executing any code from the downloaded app, including install.sh.
codesign --verify --deep --strict -R "$SIGNING_REQUIREMENT" "$PREBUILT"
spctl --assess --type execute "$PREBUILT"
if [ "$(plutil -extract version raw "$PREBUILT/Contents/Resources/distribution.json")" != "$REMCTL_VERSION" ]; then
  log_error "RemCTL distribution version does not match the pin"
  exit 1
fi

set -- --prebuilt "$PREBUILT" --shell-completions fish
if [ "$DRY_RUN" = true ]; then
  set -- "$@" --dry-run
elif [ ! -t 0 ] || [ ! -t 1 ]; then
  log_error "Run ~/.dotfiles/remctl/install.sh in Terminal to approve installation"
  log_hint "The upstream installer may need sudo and one-time legacy-file confirmation"
  exit 1
fi

# Keep the existing CLI path, but the standard app and socket locations.
# Do not use --bootstrap: onboarding is separate and explicitly excludes MCP.
PREFIX="$HOME" REMCTL_BIN_DIR="$BIN_DIR" REMCTL_APP_DIR="$HOME/Applications" \
  REMCTL_LAUNCH_AGENT_DIR="$HOME/Library/LaunchAgents" \
  bash "$PREBUILT/Contents/Resources/Distribution/install.sh" "$@"
if [ "$DRY_RUN" = true ]; then
  log_success "RemCTL $REMCTL_VERSION dry run passed; installation unchanged"
  exit 0
fi
if ! install_is_current; then
  log_error "RemCTL installation verification failed"
  exit 1
fi
log_success "RemCTL $REMCTL_VERSION installed (CLI only; no MCP registration)"
log_hint "First migration: remctl onboard --no-mcp"
log_hint "Verify: remctl doctor --for-agent --json"
