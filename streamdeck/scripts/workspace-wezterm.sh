#!/bin/sh
# Open WezTerm and switch to AeroSpace workspace T
#
# Stream Deck: Page 1 — "Terminal"

set -e

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

APP="WezTerm"
WORKSPACE="T"

# Check if a WezTerm window already exists in AeroSpace
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
