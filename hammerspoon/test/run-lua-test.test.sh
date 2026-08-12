#!/bin/sh

set -eu

TEST_ROOT="$(/bin/realpath "$(mktemp -d)")"
trap 'rm -rf "$TEST_ROOT"' EXIT
mkdir -p "$TEST_ROOT/bin"

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname "$0")" && pwd -P)"
STATUS_FILE="$TEST_ROOT/status.json"
EVENTS_FILE="$TEST_ROOT/events.log"
export STATUS_FILE EVENTS_FILE

cat > "$TEST_ROOT/bin/hs" <<'EOF'
#!/bin/sh
case "$*" in
  *beginMaintenance*)
    [ "${STATUS_UNAVAILABLE:-0}" != 1 ] || exit 1
    cat "$STATUS_FILE"
    ;;
  *dofile*)
    printf 'fixture\n' >> "$EVENTS_FILE"
    ;;
esac
EOF
cat > "$TEST_ROOT/bin/osascript" <<'EOF'
#!/bin/sh
printf 'quit\n' >> "$EVENTS_FILE"
EOF
cat > "$TEST_ROOT/bin/pgrep" <<'EOF'
#!/bin/sh
exit 1
EOF
cat > "$TEST_ROOT/bin/open" <<'EOF'
#!/bin/sh
printf 'open\n' >> "$EVENTS_FILE"
EOF
chmod +x "$TEST_ROOT/bin/hs" "$TEST_ROOT/bin/osascript" "$TEST_ROOT/bin/pgrep" "$TEST_ROOT/bin/open"

printf 'return true\n' > "$TEST_ROOT/fixture.lua"

run_fixture() {
  STATUS_UNAVAILABLE="${1:-0}" \
  HS_BIN="$TEST_ROOT/bin/hs" \
  JQ_BIN="$(command -v jq)" \
  OSASCRIPT_BIN="$TEST_ROOT/bin/osascript" \
  PGREP_BIN="$TEST_ROOT/bin/pgrep" \
  OPEN_BIN="$TEST_ROOT/bin/open" \
  "$SCRIPT_DIR/run-lua-test.sh" "$TEST_ROOT/fixture.lua"
}

: > "$EVENTS_FILE"
printf '{"acquired":false,"error":"capture queue is not idle","status":{"idle":false,"active":true,"queued":1,"tasks":1,"paused":false}}\n' > "$STATUS_FILE"
if run_fixture >/dev/null 2>&1; then
  echo 'expected a non-idle capture queue to block the Lua fixture' >&2
  exit 1
fi
[ ! -s "$EVENTS_FILE" ]

: > "$EVENTS_FILE"
printf '{"acquired":true,"status":{"idle":false,"maintenance":true}}\n' > "$STATUS_FILE"
if run_fixture 1 >/dev/null 2>&1; then
  echo 'expected unavailable queue status to block the Lua fixture' >&2
  exit 1
fi
[ ! -s "$EVENTS_FILE" ]

: > "$EVENTS_FILE"
run_fixture >/dev/null
[ "$(grep -c '^fixture$' "$EVENTS_FILE")" -eq 1 ]
[ "$(grep -c '^quit$' "$EVENTS_FILE")" -eq 1 ]
[ "$(grep -c '^open$' "$EVENTS_FILE")" -eq 1 ]

printf 'run-lua-test tests passed\n'
