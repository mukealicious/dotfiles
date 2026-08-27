#!/bin/sh
#
# Hunk diff review configuration
#
# Symlinks Hunk preferences and installs managed extensions.

set -e

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
HUNK_SRC="$DOTFILES_ROOT/hunk"
HUNK_DEST="$HOME/.config/hunk"
HUNK_COMMIT_LOG_NAME="hunk-commit-log"
HUNK_COMMIT_LOG_COMMIT="aac1a9b7fc1dda7fc47f058b7c35a0dbe202dec9"
HUNK_COMMIT_LOG_SOURCE="sadick254/hunk-commit-log@$HUNK_COMMIT_LOG_COMMIT"
HUNK_COMMIT_LOG_DIR="$HUNK_DEST/extensions/installed/$HUNK_COMMIT_LOG_NAME"
HUNK_EXTENSION_RECORDS="$HUNK_DEST/extensions/installed/records.json"

# shellcheck disable=SC1091
. "$DOTFILES_ROOT/lib/symlink.sh"

FORCE="${FORCE:-false}"
if [ "$1" = "--force" ]; then
  FORCE=true
fi

if [ "$FORCE" = "true" ]; then
  log_force_enabled
fi

log_info "Setting up Hunk..."

mkdir -p "$HUNK_DEST"
ensure_symlink "$HUNK_SRC/config.toml" "$HUNK_DEST/config.toml" "hunk config.toml"

# Hunk moved from its old tap to Homebrew core before adding extension support.
# Migrate existing installations that brew bundle otherwise treats as satisfying
# the unqualified `hunk` formula in the Brewfile.
if command -v brew >/dev/null 2>&1 && brew list --formula modem-dev/tap/hunk >/dev/null 2>&1; then
  log_info "Migrating Hunk from modem-dev/tap to Homebrew core..."
  brew uninstall modem-dev/tap/hunk
  brew install homebrew/core/hunk
  brew untap modem-dev/tap >/dev/null 2>&1 || true
fi

if ! command -v hunk >/dev/null 2>&1; then
  log_warn "Hunk is not installed; skipping $HUNK_COMMIT_LOG_NAME"
  log_hint "Run dot to install Hunk and its managed extensions"
elif ! hunk extension list >/dev/null 2>&1; then
  log_warn "Installed Hunk does not support extensions; skipping $HUNK_COMMIT_LOG_NAME"
  log_hint "Hunk 0.19.0 or newer is required; run dot to upgrade"
else
  recorded_source=''
  recorded_commit=''
  installed_commit=''

  if [ -f "$HUNK_EXTENSION_RECORDS" ]; then
    recorded_source="$(jq -r --arg name "$HUNK_COMMIT_LOG_NAME" '.installs[$name].source // empty' "$HUNK_EXTENSION_RECORDS")"
    recorded_commit="$(jq -r --arg name "$HUNK_COMMIT_LOG_NAME" '.installs[$name].commit // empty' "$HUNK_EXTENSION_RECORDS")"
  fi
  if [ -d "$HUNK_COMMIT_LOG_DIR/.git" ]; then
    installed_commit="$(git -C "$HUNK_COMMIT_LOG_DIR" rev-parse HEAD 2>/dev/null || true)"
  fi

  if [ "$recorded_source" = "$HUNK_COMMIT_LOG_SOURCE" ] &&
     [ "$recorded_commit" = "$HUNK_COMMIT_LOG_COMMIT" ] &&
     [ "$installed_commit" = "$HUNK_COMMIT_LOG_COMMIT" ]; then
    log_success "$HUNK_COMMIT_LOG_NAME already installed at its pinned commit"
  elif [ -n "$recorded_source" ]; then
    log_info "Reinstalling $HUNK_COMMIT_LOG_NAME at its pinned commit..."
    if hunk extension remove "$HUNK_COMMIT_LOG_NAME" >/dev/null 2>&1 &&
       hunk extension install "$HUNK_COMMIT_LOG_SOURCE" --yes >/dev/null 2>&1; then
      log_success "Installed $HUNK_COMMIT_LOG_NAME"
    else
      log_warn "Failed to install $HUNK_COMMIT_LOG_NAME"
      log_hint "Run manually: hunk extension install $HUNK_COMMIT_LOG_SOURCE --yes"
    fi
  elif [ -e "$HUNK_COMMIT_LOG_DIR" ] || [ -L "$HUNK_COMMIT_LOG_DIR" ]; then
    log_warn "Preserving unmanaged $HUNK_COMMIT_LOG_DIR"
    log_hint "Move it aside, then re-run dot to install the pinned extension"
  elif hunk extension install "$HUNK_COMMIT_LOG_SOURCE" --yes >/dev/null 2>&1; then
    log_success "Installed $HUNK_COMMIT_LOG_NAME"
  else
    log_warn "Failed to install $HUNK_COMMIT_LOG_NAME"
    log_hint "Run manually: hunk extension install $HUNK_COMMIT_LOG_SOURCE --yes"
  fi
fi

log_success "Hunk configuration complete!"
