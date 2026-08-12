#!/bin/sh

set -eu

TEST_ROOT="$(/bin/realpath "$(mktemp -d)")"
trap 'rm -rf "$TEST_ROOT"' EXIT
mkdir -p "$TEST_ROOT/bin"

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd -P)"
JQ_BIN="$(command -v jq)"
HERDR_LOG="$TEST_ROOT/herdr.log"
GET_COUNT_FILE="$TEST_ROOT/get-count"
WAIT_STATUS_FILE="$TEST_ROOT/wait-status"
export HERDR_LOG GET_COUNT_FILE WAIT_STATUS_FILE

cat > "$TEST_ROOT/bin/herdr" <<'EOF'
#!/bin/sh
printf '%s\n' "$*" >> "$HERDR_LOG"
case "$1 $2" in
  "agent get")
    count=0
    [ ! -f "$GET_COUNT_FILE" ] || count="$(cat "$GET_COUNT_FILE")"
    count=$((count + 1))
    printf '%s\n' "$count" > "$GET_COUNT_FILE"
    if [ "${GET_ALWAYS_MISSING:-0}" = 1 ]; then
      printf '{"error":{"code":"agent_not_found"}}\n'
      exit 1
    fi
    if [ "$count" -le "${GET_UNKNOWN_COUNT:-0}" ]; then
      status=unknown
    else
      status="${GET_STATUS:-working}"
    fi
    printf '{"result":{"agent":{"agent_status":"%s"}}}\n' "$status"
    ;;
  "agent wait")
    if [ "${WAIT_FAIL:-0}" = 1 ]; then
      exit 1
    fi
    printf '{"result":{"agent":{"agent_status":"%s"}}}\n' "$(cat "$WAIT_STATUS_FILE")"
    ;;
  *)
    echo "unexpected herdr command: $*" >&2
    exit 1
    ;;
esac
EOF
chmod +x "$TEST_ROOT/bin/herdr"

run_waiter() {
  printf '%s\n' "${WAIT_STATUS:-done}" > "$WAIT_STATUS_FILE"
  GET_UNKNOWN_COUNT="${GET_UNKNOWN_COUNT:-0}" \
  GET_ALWAYS_MISSING="${GET_ALWAYS_MISSING:-0}" \
  GET_STATUS="${GET_STATUS:-working}" \
  WAIT_FAIL="${WAIT_FAIL:-0}" \
  HERDR_BIN="$TEST_ROOT/bin/herdr" \
  JQ_BIN="$JQ_BIN" \
  START_TIMEOUT_MS="${TEST_START_TIMEOUT_MS:-1000}" \
  START_POLL_SECONDS=0.01 \
  INITIAL_TURN_TIMEOUT_MS=20 \
  "$SCRIPT_DIR/bin/wait-for-agent.sh" w1:p2
}

# A newly created pane may not be recognized as an agent immediately. Poll until
# Herdr reports a real lifecycle state, then wait for the working turn to settle.
: > "$HERDR_LOG"
rm -f "$GET_COUNT_FILE"
OUTPUT="$(GET_UNKNOWN_COUNT=2 run_waiter)"
printf '%s' "$OUTPUT" | "$JQ_BIN" -e '.status == "settled" and .pane_id == "w1:p2"' >/dev/null
[ "$(grep -c '^agent get w1:p2$' "$HERDR_LOG")" -eq 3 ]
grep -F 'agent wait w1:p2 --until blocked --until done --until idle --timeout 20' "$HERDR_LOG" >/dev/null

# A blocked initial turn is not settled. Releasing the next writer here would
# allow the blocked turn to resume concurrently after user approval.
rm -f "$GET_COUNT_FILE"
if GET_STATUS=blocked run_waiter >/dev/null 2>&1; then
  echo 'expected initially blocked Pi to pause queue admission' >&2
  exit 1
fi

rm -f "$GET_COUNT_FILE"
if WAIT_STATUS=blocked run_waiter >/dev/null 2>&1; then
  echo 'expected Pi blocked while working to pause queue admission' >&2
  exit 1
fi

# A turn already completed by the time it is detected needs no second wait.
: > "$HERDR_LOG"
rm -f "$GET_COUNT_FILE"
OUTPUT="$(GET_STATUS='done' run_waiter)"
printf '%s' "$OUTPUT" | "$JQ_BIN" -e '.status == "settled"' >/dev/null
if grep -F '^agent wait' "$HERDR_LOG" >/dev/null; then
  echo 'settled agent unexpectedly waited again' >&2
  exit 1
fi

# Idle is not accepted as proof that the initial prompt started. Newly detected
# Pi processes can briefly report idle before their first working transition.
rm -f "$GET_COUNT_FILE"
if GET_STATUS=idle TEST_START_TIMEOUT_MS=1 run_waiter >/dev/null 2>&1; then
  echo 'expected idle-before-start to remain pending' >&2
  exit 1
fi

# The startup poll is bounded when Herdr never recognizes the pane as an agent.
rm -f "$GET_COUNT_FILE"
if GET_ALWAYS_MISSING=1 TEST_START_TIMEOUT_MS=1 run_waiter >/dev/null 2>&1; then
  echo 'expected missing initial agent status to fail' >&2
  exit 1
fi

rm -f "$GET_COUNT_FILE"
if WAIT_FAIL=1 run_waiter >/dev/null 2>&1; then
  echo 'expected initial-turn settlement failure' >&2
  exit 1
fi

if START_TIMEOUT_MS=bad HERDR_BIN="$TEST_ROOT/bin/herdr" JQ_BIN="$JQ_BIN" \
  "$SCRIPT_DIR/bin/wait-for-agent.sh" w1:p2 >/dev/null 2>&1; then
  echo 'expected an invalid timeout to fail' >&2
  exit 1
fi

printf 'wait-for-agent tests passed\n'
