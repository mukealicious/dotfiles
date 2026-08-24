#!/bin/sh
# shellcheck disable=SC1091
#
# Install the pinned RemCTL release for shared Apple Reminders agent workflows.
#
# macOS privacy permissions are intentionally not requested here. Run
# `remctl onboard` interactively after installation, then verify from each
# agent host with `remctl doctor --for-agent --json`.

set -e

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
FORCE="${FORCE:-false}"

# shellcheck source=../lib/log.sh
. "$DOTFILES_ROOT/lib/log.sh"
# shellcheck source=version.env
. "$DOTFILES_ROOT/remctl/version.env"

for arg in "$@"; do
  case "$arg" in
    --force)
      FORCE=true
      ;;
    *)
      log_error "Unknown remctl installer option: $arg"
      exit 1
      ;;
  esac
done

if [ "$(uname -s)" != "Darwin" ]; then
  log_warn "RemCTL is macOS-only; skipping on $(uname -s)"
  exit 0
fi

if ! command -v git >/dev/null 2>&1; then
  log_error "git is required to install RemCTL"
  exit 1
fi

if ! command -v uv >/dev/null 2>&1; then
  log_error "uv is required to select a supported Python runtime for RemCTL"
  exit 1
fi

REMCTL_PYTHON="$(uv python find '>=3.10' 2>/dev/null || true)"
if [ -z "$REMCTL_PYTHON" ] || [ ! -x "$REMCTL_PYTHON" ]; then
  log_error "No Python 3.10 or newer runtime is available through uv"
  log_hint "Run: uv python install 3.12"
  exit 1
fi

BIN_DIR="$HOME/.local/bin"
SOURCE_DIR="$HOME/.local/share/remctl/source"
REMOTE_URL="https://github.com/viticci/remctl.git"
REMCTL_BIN="$BIN_DIR/remctl"

backup_conflict() {
  target="$1"
  desc="$2"

  if [ "$FORCE" != "true" ]; then
    log_error "$desc exists and is not managed by this installer: $target"
    log_hint "Move it aside, or rerun dot with --force to back it up"
    exit 1
  fi

  backup="$target.backup"
  suffix=1
  while [ -e "$backup" ] || [ -L "$backup" ]; do
    backup="$target.backup.$suffix"
    suffix=$((suffix + 1))
  done
  log_info "Backing up $desc to $backup"
  mv "$target" "$backup"
}

is_remctl_cli() {
  target="$1"
  [ -f "$target" ] && grep -Fq 'remctl — Power-user Reminders CLI' "$target" 2>/dev/null
}

preflight_install_targets() {
  mkdir -p "$BIN_DIR"

  if [ -e "$REMCTL_BIN" ] || [ -L "$REMCTL_BIN" ]; then
    if [ -L "$REMCTL_BIN" ] || ! is_remctl_cli "$REMCTL_BIN"; then
      backup_conflict "$REMCTL_BIN" "remctl command"
    fi
  fi

  for alias_name in rctl reminders; do
    alias_path="$BIN_DIR/$alias_name"
    [ -e "$alias_path" ] || [ -L "$alias_path" ] || continue
    if [ -L "$alias_path" ] && [ "$(readlink "$alias_path")" = "remctl" ]; then
      continue
    fi
    backup_conflict "$alias_path" "$alias_name command"
  done
}

install_is_current() {
  [ -x "$REMCTL_BIN" ] || return 1
  [ "$(head -n 1 "$REMCTL_BIN" 2>/dev/null || true)" = "#!$REMCTL_PYTHON" ] || return 1
  [ "$($REMCTL_BIN --version 2>/dev/null || true)" = "$REMCTL_VERSION" ] || return 1

  for required in \
    "$BIN_DIR/remctl_runtime.py" \
    "$BIN_DIR/remctl_images.py" \
    "$BIN_DIR/remctl_serialization.py" \
    "$BIN_DIR/remctl_smart_lists.py" \
    "$HOME/.config/fish/completions/remctl.fish" \
    "$HOME/.config/fish/completions/rctl.fish" \
    "$HOME/.config/fish/completions/reminders.fish"; do
    [ -e "$required" ] || return 1
  done

  [ -L "$BIN_DIR/rctl" ] && [ "$(readlink "$BIN_DIR/rctl")" = "remctl" ] || return 1
  [ -L "$BIN_DIR/reminders" ] && [ "$(readlink "$BIN_DIR/reminders")" = "remctl" ] || return 1

  if command -v swiftc >/dev/null 2>&1; then
    [ -x "$BIN_DIR/remctl-bridge" ] || return 1
  fi
}

pin_python_runtime() {
  target="$1"
  tmp="$(mktemp "$BIN_DIR/.remctl-python.XXXXXX")"
  {
    printf '#!%s\n' "$REMCTL_PYTHON"
    tail -n +2 "$target"
  } > "$tmp"
  chmod +x "$tmp"
  mv "$tmp" "$target"
}

if [ "$FORCE" != "true" ] && install_is_current; then
  log_success "RemCTL $REMCTL_VERSION is already installed"
  exit 0
fi

preflight_install_targets
mkdir -p "$(dirname "$SOURCE_DIR")"

if [ -e "$SOURCE_DIR" ] && [ ! -d "$SOURCE_DIR/.git" ]; then
  backup_conflict "$SOURCE_DIR" "RemCTL source checkout"
fi

if [ ! -d "$SOURCE_DIR/.git" ]; then
  log_info "Cloning RemCTL source"
  GIT_TERMINAL_PROMPT=0 git clone --filter=blob:none --no-checkout "$REMOTE_URL" "$SOURCE_DIR"
else
  origin_url="$(git -C "$SOURCE_DIR" remote get-url origin 2>/dev/null || true)"
  if [ "$origin_url" != "$REMOTE_URL" ]; then
    log_error "RemCTL source checkout has an unexpected origin: ${origin_url:-missing}"
    log_hint "Expected: $REMOTE_URL"
    exit 1
  fi
fi

log_info "Checking out RemCTL $REMCTL_REF ($REMCTL_COMMIT)"
GIT_TERMINAL_PROMPT=0 git -C "$SOURCE_DIR" fetch --depth 1 origin "$REMCTL_COMMIT"
git -C "$SOURCE_DIR" checkout --detach --force "$REMCTL_COMMIT"
actual_commit="$(git -C "$SOURCE_DIR" rev-parse HEAD)"
if [ "$actual_commit" != "$REMCTL_COMMIT" ]; then
  log_error "RemCTL checkout verification failed: expected $REMCTL_COMMIT, got $actual_commit"
  exit 1
fi

log_info "Installing RemCTL into $BIN_DIR"
PREFIX="$HOME/.local" bash "$SOURCE_DIR/install.sh" --bootstrap --shell-completions fish
pin_python_runtime "$REMCTL_BIN"

installed_version="$($REMCTL_BIN --version 2>/dev/null || true)"
if [ "$installed_version" != "$REMCTL_VERSION" ]; then
  log_error "RemCTL version verification failed: expected $REMCTL_VERSION, got ${installed_version:-missing}"
  exit 1
fi

log_success "RemCTL $REMCTL_VERSION installed"
log_hint "Next (interactive): remctl onboard"
log_hint "Then verify this agent host: remctl doctor --for-agent --json"
