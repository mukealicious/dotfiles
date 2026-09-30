#!/bin/sh
# Isolated wrapper tests: never mount a disk, request sudo, or touch Reminders.
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
STAGE="$(mktemp -d "${TMPDIR:-/tmp}/remctl-tests.XXXXXX")"
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$STAGE/repo/remctl" "$STAGE/repo/lib" "$STAGE/bin" "$STAGE/home"
cp "$ROOT/remctl/install.sh" "$ROOT/remctl/version.env" "$STAGE/repo/remctl/"
cp "$ROOT/lib/log.sh" "$STAGE/repo/lib/"
# shellcheck source=version.env
. "$ROOT/remctl/version.env"
export REMCTL_VERSION REMCTL_REF REMCTL_DMG_SHA256
export HOME="$STAGE/home" PATH="$STAGE/bin:$PATH" TEST_LOG="$STAGE/events"
export TEST_APP="$STAGE/app"
mkdir -p "$TEST_APP/Contents/Resources/Distribution"
cat > "$TEST_APP/Contents/Resources/Distribution/install.sh" <<'SH'
#!/bin/sh
set -eu
printf 'upstream %s\n' "$*" >> "$TEST_LOG"
[ "$PREFIX" = "$HOME" ]
[ "$REMCTL_BIN_DIR" = "$HOME/.local/bin" ]
[ "$REMCTL_APP_DIR" = "$HOME/Applications" ]
[ "$REMCTL_LAUNCH_AGENT_DIR" = "$HOME/Library/LaunchAgents" ]
[ "$#" = 5 ]
[ "$1" = --prebuilt ]
[ "$3" = --shell-completions ]
[ "$4" = fish ]
[ "$5" = --dry-run ]
exit "${UPSTREAM_STATUS:-0}"
SH
cat > "$STAGE/bin/mock" <<'SH'
#!/bin/sh
set -eu
name="$(basename "$0")"
printf '%s %s\n' "$name" "$*" >> "$TEST_LOG"
case "$name" in
  uname)
    case "$1" in
      -s) printf '%s\n' "${TEST_OS:-Darwin}" ;;
      -m) printf '%s\n' "${TEST_ARCH:-arm64}" ;;
    esac ;;
  curl)
    while [ "$1" != -o ]; do shift; done
    printf 'fixture' > "$2" ;;
  shasum) printf '%s  fixture\n' "${TEST_SHA:-$REMCTL_DMG_SHA256}" ;;
  codesign) exit "${SIGNATURE_STATUS:-0}" ;;
  spctl) exit "${GATEKEEPER_STATUS:-0}" ;;
  plutil) printf '%s\n' "${TEST_VERSION:-$REMCTL_VERSION}" ;;
  hdiutil)
    if [ "$1" = attach ]; then
      while [ "$1" != -mountpoint ]; do shift; done
      cp -R "$TEST_APP" "$2/RemCTL Capability Host.app"
    fi ;;
esac
SH
chmod +x "$STAGE/bin/mock"
for tool in uname curl shasum codesign spctl plutil hdiutil; do
  ln -s mock "$STAGE/bin/$tool"
done
INSTALL="$STAGE/repo/remctl/install.sh"

run_ok() {
  : > "$TEST_LOG"
  sh "$INSTALL" "$@" > "$STAGE/output" 2>&1 || { printf 'Unexpected failure\n'; more "$STAGE/output"; exit 1; }
}
run_fail() {
  : > "$TEST_LOG"
  if sh "$INSTALL" "$@" > "$STAGE/output" 2>&1; then
    printf 'Expected failure: %s\n' "$*"
    exit 1
  fi
}
assert_no_event() {
  if grep -q "$1" "$TEST_LOG"; then
    printf 'Unexpected event: %s\n' "$1"
    exit 1
  fi
}
no_upstream() { assert_no_event '^upstream '; }

run_fail --unknown
no_upstream
(TEST_OS=Linux run_ok)
no_upstream
(TEST_ARCH=x86_64 run_fail)
no_upstream
(TEST_SHA=bad run_fail --dry-run)
assert_no_event '^hdiutil attach'

run_ok --dry-run
grep -q "releases/download/$REMCTL_REF/RemCTL-arm64.dmg" "$TEST_LOG"
grep -q '^upstream .*--dry-run$' "$TEST_LOG"
grep -q '^hdiutil detach' "$TEST_LOG"
run_ok --dry-run
assert_no_event '^curl '

(SIGNATURE_STATUS=1 run_fail --dry-run)
no_upstream
grep -q '^hdiutil detach' "$TEST_LOG"
(GATEKEEPER_STATUS=1 run_fail --dry-run)
no_upstream
(TEST_VERSION=9.9.9 run_fail --dry-run)
no_upstream
(UPSTREAM_STATUS=1 run_fail --dry-run)
grep -q '^hdiutil detach' "$TEST_LOG"
run_fail < /dev/null
no_upstream
grep -q 'in Terminal' "$STAGE/output"

# A complete current install must be a no-op even without a terminal.
mkdir -p "$HOME/.local/bin" "$HOME/Library/LaunchAgents" "$HOME/.config/fish/completions"
cat > "$HOME/.local/bin/remctl" <<'SH'
#!/bin/sh
printf '%s\n' "$REMCTL_VERSION"
SH
chmod +x "$HOME/.local/bin/remctl"
ln -s remctl "$HOME/.local/bin/rctl"
ln -s remctl "$HOME/.local/bin/reminders"
touch "$HOME/.local/bin/.remctl-install-manifest.json" \
  "$HOME/Library/LaunchAgents/net.macstories.remctl.capability-host.plist" \
  "$HOME/.config/fish/completions/remctl.fish"
run_ok < /dev/null
grep -q 'already installed' "$STAGE/output"
assert_no_event '^hdiutil attach'
run_fail --force < /dev/null
no_upstream

printf 'RemCTL installer tests passed\n'
