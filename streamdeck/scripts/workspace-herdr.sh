#!/bin/sh
# Open Herdr in WezTerm and switch to AeroSpace workspace A.
#
# Stream Deck: Page 1 — "Herdr"

set -e

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

APP="WezTerm"
WORKSPACE="A"

herdr_window_id() {
  if command -v jq >/dev/null 2>&1; then
    aerospace list-windows --all --json 2>/dev/null \
      | jq -r --arg app "$APP" '.[] | select(."app-name" == $app and ((."window-title" // "") | test("herdr"; "i"))) | ."window-id"' \
      | head -1
    return
  fi

  aerospace list-windows --all 2>/dev/null \
    | awk -F '|' -v app="$APP" 'tolower($2) ~ "^[[:space:]]*" tolower(app) "[[:space:]]*$" && tolower($0) ~ /herdr/ { gsub(/[[:space:]]/, "", $1); print $1; exit }'
}

move_and_focus() {
  window_id="$1"
  [ -n "$window_id" ] || return 1
  aerospace move-node-to-workspace "$WORKSPACE" --window-id "$window_id"
  aerospace workspace "$WORKSPACE"
}

WINDOW_ID=$(herdr_window_id)
if move_and_focus "$WINDOW_ID"; then
  exit 0
fi

if command -v wezterm >/dev/null 2>&1; then
  wezterm start --cwd "$HOME" -- herdr >/dev/null 2>&1 &
else
  open -a "$APP"
fi

i=0
while [ $i -lt 20 ]; do
  sleep 0.5
  WINDOW_ID=$(herdr_window_id)
  if move_and_focus "$WINDOW_ID"; then
    exit 0
  fi
  i=$((i + 1))
done

aerospace workspace "$WORKSPACE"
