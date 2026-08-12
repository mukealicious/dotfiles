#!/bin/sh
# Run a Hammerspoon Lua fixture, then restart the app so test doubles cannot
# leak into the long-lived production Lua state.

set -eu

[ "$#" -eq 1 ] || {
  echo "Usage: run-lua-test.sh <test.lua>" >&2
  exit 2
}

HS_BIN="${HS_BIN:-/Applications/Hammerspoon.app/Contents/Frameworks/hs/hs}"
JQ_BIN="${JQ_BIN:-$(command -v jq 2>/dev/null || true)}"
OSASCRIPT_BIN="${OSASCRIPT_BIN:-/usr/bin/osascript}"
PGREP_BIN="${PGREP_BIN:-/usr/bin/pgrep}"
OPEN_BIN="${OPEN_BIN:-/usr/bin/open}"
[ -x "$HS_BIN" ] || {
  echo "run-lua-test.sh: Hammerspoon CLI not found: $HS_BIN" >&2
  exit 1
}
[ -x "$JQ_BIN" ] || {
  echo "run-lua-test.sh: jq is required to verify capture queue state" >&2
  exit 1
}

TEST_PATH="$(/bin/realpath "$1")"
DOTFILES_ROOT="$(CDPATH='' cd -- "$(dirname "$0")/../.." && pwd -P)"

begin_maintenance() {
  status="$("$HS_BIN" -t 2 -q -c '
    local palette = _G.desktopAgentPalette
    if not palette or not palette.beginMaintenance then
      return hs.json.encode({acquired=false, error="desktop capture palette is not loaded"})
    end
    local acquired, err = palette:beginMaintenance()
    return hs.json.encode({acquired=acquired == true, error=err, status=palette:writerQueueStatus()})
  ' 2>/dev/null)" || {
    echo "run-lua-test.sh: cannot acquire Hammerspoon maintenance mode; refusing to run the fixture" >&2
    return 1
  }

  if ! printf '%s\n' "$status" | "$JQ_BIN" -e '.acquired == true' >/dev/null 2>&1; then
    echo "run-lua-test.sh: capture queue is not idle; refusing to run the fixture or restart Hammerspoon" >&2
    printf '%s\n' "$status" >&2
    return 1
  fi
}

begin_maintenance

set +e
"$HS_BIN" -t 10 -c "package.path='$DOTFILES_ROOT/hammerspoon/lib/?.lua;' .. package.path; dofile('$TEST_PATH'); return true"
test_status=$?
set -e

"$OSASCRIPT_BIN" -e 'tell application "Hammerspoon" to quit' >/dev/null 2>&1 || true
while "$PGREP_BIN" -x Hammerspoon >/dev/null 2>&1; do sleep 0.1; done
"$OPEN_BIN" -a Hammerspoon

attempt=0
until "$HS_BIN" -t 2 -q -c 'return true' >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  [ "$attempt" -lt 100 ] || {
    echo "run-lua-test.sh: Hammerspoon did not become ready after restart" >&2
    exit 1
  }
  sleep 0.1
done

exit "$test_status"
