#!/bin/sh
# Open Conductor and switch to AeroSpace workspace C
#
# Stream Deck: Page 1 — "Conductor"

set -e

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

APP="Conductor"
WORKSPACE="C"

# Check if a Conductor window already exists in AeroSpace
WINDOW_ID=$(aerospace list-windows --all 2>/dev/null \
  | grep -i "$APP" \
  | head -1 \
  | awk '{print $1}')

if [ -n "$WINDOW_ID" ]; then
  aerospace move-node-to-workspace "$WORKSPACE" --window-id "$WINDOW_ID"
  aerospace workspace "$WORKSPACE"
  exit 0
fi

open -a "$APP"

i=0
while [ $i -lt 10 ]; do
  sleep 0.5
  WINDOW_ID=$(aerospace list-windows --all 2>/dev/null \
    | grep -i "$APP" \
    | head -1 \
    | awk '{print $1}')
  if [ -n "$WINDOW_ID" ]; then
    aerospace move-node-to-workspace "$WORKSPACE" --window-id "$WINDOW_ID"
    break
  fi
  i=$((i + 1))
done

aerospace workspace "$WORKSPACE"
