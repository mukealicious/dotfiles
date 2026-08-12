#!/bin/sh
# Wait for a queued Save/Study capture's initial autonomous Pi turn.

set -eu

export PATH="$HOME/.dotfiles/bin:/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:$HOME/.local/share/mise/shims:$HOME/.bun/bin:/usr/bin:/bin:/usr/sbin:/sbin"

usage() {
  echo "Usage: wait-for-agent.sh <pane-id>" >&2
  exit 2
}

[ "$#" -eq 1 ] || usage

pane_id="$1"
HERDR_BIN="${HERDR_BIN:-$(command -v herdr 2>/dev/null || true)}"
JQ_BIN="${JQ_BIN:-$(command -v jq 2>/dev/null || true)}"
START_TIMEOUT_MS="${START_TIMEOUT_MS:-60000}"
INITIAL_TURN_TIMEOUT_MS="${INITIAL_TURN_TIMEOUT_MS:-3600000}"
START_POLL_SECONDS="${START_POLL_SECONDS:-0.25}"

[ -x "$HERDR_BIN" ] || {
  echo "wait-for-agent.sh: Herdr is required" >&2
  exit 1
}
[ -x "$JQ_BIN" ] || {
  echo "wait-for-agent.sh: jq is required" >&2
  exit 1
}

case "$START_TIMEOUT_MS:$INITIAL_TURN_TIMEOUT_MS" in
  *[!0-9:]*|:*|*:) echo "wait-for-agent.sh: timeouts must be positive integers" >&2; exit 1 ;;
esac
[ "$START_TIMEOUT_MS" -gt 0 ] && [ "$INITIAL_TURN_TIMEOUT_MS" -gt 0 ] || {
  echo "wait-for-agent.sh: timeouts must be positive integers" >&2
  exit 1
}

started_at_ns="$(date +%s%N)"
while :; do
  status="$({ "$HERDR_BIN" agent get "$pane_id" 2>/dev/null || true; } | "$JQ_BIN" -r '.result.agent.agent_status // "unknown"')"
  case "$status" in
    working|blocked|done) break ;;
  esac

  elapsed_ms=$((($(date +%s%N) - started_at_ns) / 1000000))
  if [ "$elapsed_ms" -ge "$START_TIMEOUT_MS" ]; then
    echo "wait-for-agent.sh: Pi did not start its initial turn in pane $pane_id" >&2
    exit 1
  fi
  sleep "$START_POLL_SECONDS"
done

if [ "$status" = "blocked" ]; then
  echo "wait-for-agent.sh: Pi blocked before settling its initial turn in pane $pane_id" >&2
  exit 1
fi

if [ "$status" = "working" ]; then
  if ! wait_result="$($HERDR_BIN agent wait "$pane_id" --until blocked --until "done" --until idle --timeout "$INITIAL_TURN_TIMEOUT_MS")"; then
    echo "wait-for-agent.sh: Pi did not settle its initial turn in pane $pane_id" >&2
    exit 1
  fi
  status="$(printf '%s\n' "$wait_result" | "$JQ_BIN" -r '.result.agent.agent_status // "unknown"')"
  case "$status" in
    done|idle) ;;
    blocked)
      echo "wait-for-agent.sh: Pi blocked before settling its initial turn in pane $pane_id" >&2
      exit 1
      ;;
    *)
      echo "wait-for-agent.sh: Herdr returned an invalid settlement state for pane $pane_id" >&2
      exit 1
      ;;
  esac
fi

# shellcheck disable=SC2016
"$JQ_BIN" -cn --arg pane_id "$pane_id" '{status: "settled", pane_id: $pane_id}'
