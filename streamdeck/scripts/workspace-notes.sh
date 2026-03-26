#!/bin/sh
# Open Moya Glava in VSCode and switch to AeroSpace workspace N
#
# Stream Deck: Page 1, Position 0,0 — "Notes"

set -e

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

PROJECT="$HOME/Code/moya-glava"
WORKSPACE="N"

# Check if the window already exists in AeroSpace
WINDOW_ID=$(aerospace list-windows --all 2>/dev/null \
  | grep -i "moya-glava" \
  | head -1 \
  | awk '{print $1}')

if [ -n "$WINDOW_ID" ]; then
  # Window exists — just move and focus
  aerospace move-node-to-workspace "$WORKSPACE" --window-id "$WINDOW_ID"
  aerospace workspace "$WORKSPACE"
  exit 0
fi

# Window doesn't exist yet — launch VSCode and wait for it to register
open -a "Visual Studio Code" "$PROJECT"

# Poll for up to 5 seconds until AeroSpace sees the window
i=0
while [ $i -lt 10 ]; do
  sleep 0.5
  WINDOW_ID=$(aerospace list-windows --all 2>/dev/null \
    | grep -i "moya-glava" \
    | head -1 \
    | awk '{print $1}')
  if [ -n "$WINDOW_ID" ]; then
    aerospace move-node-to-workspace "$WORKSPACE" --window-id "$WINDOW_ID"
    break
  fi
  i=$((i + 1))
done

aerospace workspace "$WORKSPACE"
