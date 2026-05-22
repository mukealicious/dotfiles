#!/bin/sh
# Open cmux and switch to AeroSpace workspace X
#
# Stream Deck: Page 1 — "Cmux"

set -e

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

APP="cmux"
WORKSPACE="X"

cmux_window_id() {
  if command -v jq >/dev/null 2>&1; then
    aerospace list-windows --all --json 2>/dev/null \
      | jq -r --arg app "$APP" '.[] | select(."app-name" == $app) | ."window-id"' \
      | head -1
    return
  fi

  aerospace list-windows --all 2>/dev/null \
    | awk -F '|' -v app="$APP" 'tolower($2) ~ "^[[:space:]]*" tolower(app) "[[:space:]]*$" { gsub(/[[:space:]]/, "", $1); print $1; exit }'
}

move_and_focus() {
  window_id="$1"
  [ -n "$window_id" ] || return 1
  aerospace move-node-to-workspace "$WORKSPACE" --window-id "$window_id"
  aerospace workspace "$WORKSPACE"
}

WINDOW_ID=$(cmux_window_id)
if move_and_focus "$WINDOW_ID"; then
  exit 0
fi

open -a "$APP"

i=0
while [ $i -lt 20 ]; do
  sleep 0.5
  WINDOW_ID=$(cmux_window_id)
  if move_and_focus "$WINDOW_ID"; then
    exit 0
  fi
  i=$((i + 1))
done

aerospace workspace "$WORKSPACE"
