#!/bin/sh

set -eu

TEST_ROOT="$(/bin/realpath "$(mktemp -d)")"
trap 'rm -rf "$TEST_ROOT"' EXIT

HOME="$TEST_ROOT/home"
export HOME
CAPTURE_ROOT="$HOME/Library/Application Support/Hammerspoon Agent/Captures"
CAPTURE_DIR="$CAPTURE_ROOT/2026-01-01-120000"
MOJA_GLAVA_DIR="$HOME/Code/moja-glava"
MOJA_SKILL="$TEST_ROOT/moja-glava/SKILL.md"
mkdir -p "$CAPTURE_DIR" "$MOJA_GLAVA_DIR/03 - Resources" "$(dirname "$MOJA_SKILL")" "$TEST_ROOT/bin"
printf '# Vault guidance\n' > "$MOJA_GLAVA_DIR/AGENTS.md"
printf '# Test capture\n' > "$CAPTURE_DIR/context.md"
printf 'png' > "$CAPTURE_DIR/screenshot.png"
printf '%s\n' '---' 'name: moja-glava' 'description: test skill' '---' > "$MOJA_SKILL"

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd -P)"
JQ_BIN="$(command -v jq)"
export JQ_BIN
HERDR_LOG="$TEST_ROOT/herdr.log"
PANE_LIST_COUNT_FILE="$TEST_ROOT/pane-list-count"
export HERDR_LOG MOJA_GLAVA_DIR PANE_LIST_COUNT_FILE

cat > "$TEST_ROOT/bin/pi-personal" <<'EOF'
#!/bin/sh
exit 0
EOF
cat > "$TEST_ROOT/bin/hunk" <<'EOF'
#!/bin/sh
exit 0
EOF
cat > "$TEST_ROOT/bin/herdr" <<'EOF'
#!/bin/sh
printf '%s\n' "$*" >> "$HERDR_LOG"

case "$1 $2" in
  "pane list")
    if [ "${HERDR_MALFORMED:-0}" = 1 ]; then
      printf '{not-json\n'
    elif [ "${HERDR_NO_WORKSPACE_THEN_EXISTING:-0}" = 1 ]; then
      pane_list_count_file="${PANE_LIST_COUNT_FILE:?}"
      pane_list_count=0
      [ ! -f "$pane_list_count_file" ] || pane_list_count="$(cat "$pane_list_count_file")"
      pane_list_count=$((pane_list_count + 1))
      printf '%s\n' "$pane_list_count" > "$pane_list_count_file"
      if [ "$pane_list_count" -eq 1 ]; then
        printf '{"result":{"panes":[]}}\n'
      else
        "$JQ_BIN" -cn --arg root "$MOJA_GLAVA_DIR" \
          '{result:{panes:[{pane_id:"w1:p1",tab_id:"w1:t1",workspace_id:"w1",cwd:$root,foreground_cwd:$root}]}}'
      fi
    elif [ "${HERDR_NO_WORKSPACE:-0}" = 1 ]; then
      printf '{"result":{"panes":[]}}\n'
    else
      "$JQ_BIN" -cn --arg root "$MOJA_GLAVA_DIR" \
        '{result:{panes:[{pane_id:"w1:p1",tab_id:"w1:t1",workspace_id:"w1",cwd:($root + "/03 - Resources"),foreground_cwd:($root + "/03 - Resources")}]}}'
    fi
    ;;
  "workspace create")
    if [ "${HERDR_FAIL_WORKSPACE:-0}" = 1 ]; then
      exit 1
    fi
    printf '{"result":{"workspace":{"workspace_id":"w2"},"tab":{"tab_id":"w2:t1"},"root_pane":{"pane_id":"w2:p1"}}}\n'
    ;;
  "tab create")
    if [ "${HERDR_FAIL_TAB:-0}" = 1 ]; then
      exit 1
    fi
    printf '{"result":{"tab":{"tab_id":"w1:t2"},"root_pane":{"pane_id":"w1:p2"}}}\n'
    ;;
  "pane split")
    if [ "${HERDR_FAIL_SPLIT:-0}" = 1 ]; then
      exit 1
    fi
    case "$3" in
      w2:p1) pane_id="w2:p2" ;;
      *) pane_id="w1:p3" ;;
    esac
    printf '{"result":{"pane":{"pane_id":"%s"}}}\n' "$pane_id"
    ;;
  "pane run")
    if [ "${HERDR_FAIL_RUN_ID:-}" = "$3" ]; then
      exit 1
    fi
    ;;
  "tab focus")
    if [ "${HERDR_FAIL_FOCUS:-0}" = 1 ]; then
      exit 1
    fi
    ;;
  "pane rename"|"tab rename")
    ;;
  *)
    echo "unexpected herdr command: $*" >&2
    exit 1
    ;;
esac
EOF
chmod +x "$TEST_ROOT/bin/pi-personal" "$TEST_ROOT/bin/hunk" "$TEST_ROOT/bin/herdr"

run_launcher() {
  HERDR_MALFORMED="${HERDR_MALFORMED:-0}" \
  HERDR_NO_WORKSPACE="${HERDR_NO_WORKSPACE:-0}" \
  HERDR_NO_WORKSPACE_THEN_EXISTING="${HERDR_NO_WORKSPACE_THEN_EXISTING:-0}" \
  HERDR_FAIL_WORKSPACE="${HERDR_FAIL_WORKSPACE:-0}" \
  HERDR_FAIL_TAB="${HERDR_FAIL_TAB:-0}" \
  HERDR_FAIL_SPLIT="${HERDR_FAIL_SPLIT:-0}" \
  HERDR_FAIL_FOCUS="${HERDR_FAIL_FOCUS:-0}" \
  HERDR_FAIL_RUN_ID="${HERDR_FAIL_RUN_ID:-}" \
  MOJA_GLAVA_DIR="$MOJA_GLAVA_DIR" \
  MOJA_SKILL="$MOJA_SKILL" \
  PI_BIN="$TEST_ROOT/bin/pi-personal" \
  HERDR_BIN="${HERDR_BIN_OVERRIDE:-$TEST_ROOT/bin/herdr}" \
  HUNK_BIN="${HUNK_BIN_OVERRIDE:-$TEST_ROOT/bin/hunk}" \
  JQ_BIN="$JQ_BIN" \
  "$SCRIPT_DIR/bin/start-agent.sh" "$@"
}

# Save creates a non-focused, resumable Pi + Hunk tab in the existing vault workspace.
: > "$HERDR_LOG"
POISONED_QUEUE_FILE="$TEST_ROOT/poisoned-production-packet/queue-agent.json"
OUTPUT="$(MOJA_GLAVA_QUEUE_FILE="$POISONED_QUEUE_FILE" run_launcher save "$CAPTURE_DIR/context.md" "$CAPTURE_DIR/screenshot.png")"
printf '%s' "$OUTPUT" | "$JQ_BIN" -e '
  .status == "started"
  and .destination == "herdr"
  and .mode == "save"
  and .workspace_id == "w1"
  and .tab_id == "w1:t2"
  and .pi_pane_id == "w1:p2"
  and .hunk_pane_id == "w1:p3"
  and .focused == false
' >/dev/null
grep -F "tab create --workspace w1 --cwd $MOJA_GLAVA_DIR --label π Save 2026-01-01-120000 --no-focus" "$HERDR_LOG" >/dev/null
grep -F "pane split w1:p2 --direction right --ratio 0.38 --cwd $MOJA_GLAVA_DIR --no-focus" "$HERDR_LOG" >/dev/null
grep -F "pane rename w1:p2 pi" "$HERDR_LOG" >/dev/null
grep -F "pane rename w1:p3 hunk" "$HERDR_LOG" >/dev/null
grep -F "pane run w1:p3 '$TEST_ROOT/bin/hunk' diff --watch" "$HERDR_LOG" >/dev/null
grep -F "pane run w1:p2" "$HERDR_LOG" | grep -F "'$TEST_ROOT/bin/pi-personal'" >/dev/null
grep -F "pane run w1:p2" "$HERDR_LOG" | grep -F "'MOJA_GLAVA_MODE=save'" >/dev/null
grep -F "pane run w1:p2" "$HERDR_LOG" | grep -F "'@$CAPTURE_DIR/context.md'" >/dev/null
grep -F "pane run w1:p2" "$HERDR_LOG" | grep -F "'@$CAPTURE_DIR/screenshot.png'" >/dev/null
grep -F "pane run w1:p2" "$HERDR_LOG" | grep -F "'--skill' '$MOJA_SKILL'" >/dev/null
grep -F "Complete the initial vault changes" "$HERDR_LOG" >/dev/null
if grep -F "MOJA_GLAVA_QUEUE_FILE" "$HERDR_LOG" >/dev/null || [ -e "$POISONED_QUEUE_FILE" ]; then
  echo 'save leaked inherited queue-control state into Pi or the filesystem' >&2
  exit 1
fi
if grep -F "agent wait" "$HERDR_LOG" >/dev/null \
  || grep -F "tab focus" "$HERDR_LOG" >/dev/null \
  || grep -F "'--mode'" "$HERDR_LOG" >/dev/null; then
  echo 'save unexpectedly waited for, focused, or made Pi non-interactive' >&2
  exit 1
fi
[ "$(stat -f '%Lp' "$CAPTURE_DIR")" = 700 ]
[ "$(stat -f '%Lp' "$CAPTURE_DIR/context.md")" = 600 ]
[ "$(stat -f '%Lp' "$CAPTURE_DIR/screenshot.png")" = 600 ]

# Study is also non-focused and does not attach an absent screenshot.
: > "$HERDR_LOG"
OUTPUT="$(run_launcher study "$CAPTURE_DIR/context.md" "")"
printf '%s' "$OUTPUT" | "$JQ_BIN" -e '.mode == "study" and .focused == false' >/dev/null
grep -F "'MOJA_GLAVA_MODE=study'" "$HERDR_LOG" >/dev/null
if grep -F "@$CAPTURE_DIR/screenshot.png" "$HERDR_LOG" >/dev/null; then
  echo 'study unexpectedly attached an omitted screenshot' >&2
  exit 1
fi
if grep -F "tab focus" "$HERDR_LOG" >/dev/null; then
  echo 'study unexpectedly focused its Herdr tab' >&2
  exit 1
fi

# Study with me opens the same reviewable layout and focuses it immediately.
: > "$HERDR_LOG"
OUTPUT="$(run_launcher study-with-me "$CAPTURE_DIR/context.md" "$CAPTURE_DIR/screenshot.png")"
printf '%s' "$OUTPUT" | "$JQ_BIN" -e '.mode == "study-with-me" and .focused == true' >/dev/null
grep -F "'MOJA_GLAVA_MODE=study-with-me'" "$HERDR_LOG" >/dev/null
grep -F "Begin vault edits only after the user participates" "$HERDR_LOG" >/dev/null
grep -F "Keep the initial preparation read-only" "$HERDR_LOG" >/dev/null
if grep -F "Complete the initial vault changes" "$HERDR_LOG" >/dev/null; then
  echo 'study-with-me received contradictory initial-write instructions' >&2
  exit 1
fi
grep -F "tab focus w1:t2" "$HERDR_LOG" >/dev/null

# A focus failure after both commands were dispatched is partial success, not a
# failed launch that invites the user to create a duplicate session.
: > "$HERDR_LOG"
OUTPUT="$(HERDR_FAIL_FOCUS=1 run_launcher study-with-me "$CAPTURE_DIR/context.md" "$CAPTURE_DIR/screenshot.png")"
printf '%s' "$OUTPUT" | "$JQ_BIN" -e '
  .status == "started"
  and .mode == "study-with-me"
  and .focused == false
  and (.warning | contains("could not focus tab w1:t2"))
' >/dev/null
grep -F "pane run w1:p2" "$HERDR_LOG" >/dev/null
grep -F "tab focus w1:t2" "$HERDR_LOG" >/dev/null

# If no pane belongs to the vault, the launcher creates and names a workspace tab.
: > "$HERDR_LOG"
OUTPUT="$(HERDR_NO_WORKSPACE=1 run_launcher save "$CAPTURE_DIR/context.md" "")"
printf '%s' "$OUTPUT" | "$JQ_BIN" -e '
  .workspace_id == "w2"
  and .tab_id == "w2:t1"
  and .pi_pane_id == "w2:p1"
  and .hunk_pane_id == "w2:p2"
' >/dev/null
grep -F "workspace create --cwd $MOJA_GLAVA_DIR --label moja-glava --no-focus" "$HERDR_LOG" >/dev/null
grep -F "tab rename w2:t1 π Save 2026-01-01-120000" "$HERDR_LOG" >/dev/null
grep -F "pane split w2:p1" "$HERDR_LOG" >/dev/null

# Workspace lookup is rechecked while holding the setup lock so a concurrent
# creator is reused instead of producing a duplicate workspace.
: > "$HERDR_LOG"
rm -f "$PANE_LIST_COUNT_FILE"
LOCK_DIR="$TEST_ROOT/workspace-lock"
OUTPUT="$(HERDR_NO_WORKSPACE_THEN_EXISTING=1 MOJA_GLAVA_WORKSPACE_LOCK_DIR="$LOCK_DIR" run_launcher save "$CAPTURE_DIR/context.md" "")"
printf '%s' "$OUTPUT" | "$JQ_BIN" -e '.workspace_id == "w1" and .tab_id == "w1:t2"' >/dev/null
[ "$(grep -c '^pane list$' "$HERDR_LOG")" -eq 2 ]
grep -F "tab create --workspace w1" "$HERDR_LOG" >/dev/null
if grep -F "workspace create" "$HERDR_LOG" >/dev/null; then
  echo 'workspace recheck unexpectedly created a duplicate workspace' >&2
  exit 1
fi
[ ! -e "$LOCK_DIR" ]

# Herdr and pane launch failures remain explicit while preserving the packet.
if HERDR_MALFORMED=1 run_launcher save "$CAPTURE_DIR/context.md" "" >/dev/null 2>&1; then
  echo 'expected malformed Herdr response to fail' >&2
  exit 1
fi
if HERDR_FAIL_TAB=1 run_launcher save "$CAPTURE_DIR/context.md" "" >/dev/null 2>&1; then
  echo 'expected tab creation failure' >&2
  exit 1
fi
if HERDR_FAIL_SPLIT=1 run_launcher save "$CAPTURE_DIR/context.md" "" >/dev/null 2>&1; then
  echo 'expected pane split failure' >&2
  exit 1
fi
if HERDR_FAIL_RUN_ID=w1:p3 run_launcher save "$CAPTURE_DIR/context.md" "" >/dev/null 2>&1; then
  echo 'expected Hunk launch failure' >&2
  exit 1
fi
if HERDR_FAIL_RUN_ID=w1:p2 run_launcher save "$CAPTURE_DIR/context.md" "" >/dev/null 2>&1; then
  echo 'expected Pi launch failure' >&2
  exit 1
fi
if HERDR_BIN_OVERRIDE=/does/not/exist run_launcher save "$CAPTURE_DIR/context.md" "" >/dev/null 2>&1; then
  echo 'expected missing Herdr to fail' >&2
  exit 1
fi
if HUNK_BIN_OVERRIDE=/does/not/exist run_launcher save "$CAPTURE_DIR/context.md" "" >/dev/null 2>&1; then
  echo 'expected missing Hunk to fail' >&2
  exit 1
fi
[ -f "$CAPTURE_DIR/context.md" ]

# Managed packet inputs are resolved canonically and cannot escape through links.
printf '# Outside capture\n' > "$TEST_ROOT/outside.md"
printf 'outside png\n' > "$TEST_ROOT/outside.png"
if run_launcher save "$TEST_ROOT/outside.md" "" >/dev/null 2>&1; then
  echo 'expected an unmanaged context path to fail' >&2
  exit 1
fi
if run_launcher save "$CAPTURE_DIR/context.md" "$TEST_ROOT/outside.png" >/dev/null 2>&1; then
  echo 'expected an external screenshot path to fail' >&2
  exit 1
fi
mkdir -p "$CAPTURE_ROOT/symlink-packet"
ln -s "$TEST_ROOT/outside.md" "$CAPTURE_ROOT/symlink-packet/context.md"
if run_launcher save "$CAPTURE_ROOT/symlink-packet/context.md" "" >/dev/null 2>&1; then
  echo 'expected a symlinked external context to fail' >&2
  exit 1
fi

if run_launcher unknown "$CAPTURE_DIR/context.md" "" >/dev/null 2>&1; then
  echo 'expected an unsupported mode to fail' >&2
  exit 1
fi

printf 'start-agent tests passed\n'
