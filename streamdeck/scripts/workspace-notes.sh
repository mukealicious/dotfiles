#!/bin/sh
# Open the Moja Glava Obsidian vault and switch to AeroSpace workspace N
#
# Stream Deck: Page 1 — "Obsidian"

set -e

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

APP="Obsidian"
VAULT="moja-glava"
WORKSPACE="N"

obsidian_window_id() {
  if command -v jq >/dev/null 2>&1; then
    aerospace list-windows --all --json 2>/dev/null \
      | jq -r --arg app "$APP" --arg vault "$VAULT" '.[] | select(."app-name" == $app and ((."window-title" // "") | ascii_downcase | contains($vault))) | ."window-id"' \
      | head -1
    return
  fi

  aerospace list-windows --all 2>/dev/null \
    | awk -F '|' -v app="$APP" -v vault="$VAULT" 'tolower($2) ~ "^[[:space:]]*" tolower(app) "[[:space:]]*$" && tolower($3) ~ tolower(vault) { gsub(/[[:space:]]/, "", $1); print $1; exit }'
}

move_and_focus() {
  window_id="$1"
  [ -n "$window_id" ] || return 1
  aerospace move-node-to-workspace "$WORKSPACE" --window-id "$window_id"
  aerospace workspace "$WORKSPACE"
}

WINDOW_ID=$(obsidian_window_id)
if move_and_focus "$WINDOW_ID"; then
  exit 0
fi

open "obsidian://open?vault=$VAULT"

i=0
while [ $i -lt 20 ]; do
  sleep 0.5
  WINDOW_ID=$(obsidian_window_id)
  if move_and_focus "$WINDOW_ID"; then
    exit 0
  fi
  i=$((i + 1))
done

aerospace workspace "$WORKSPACE"
