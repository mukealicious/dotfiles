#!/bin/sh
# Open a fresh WezTerm window in the current AeroSpace workspace.
#
# Stream Deck: Page 1 — "Terminal"

set -e

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

APP="WezTerm"
CURRENT_WORKSPACE=$(aerospace list-workspaces --focused 2>/dev/null | head -1)

wezterm_window_ids() {
  if command -v jq >/dev/null 2>&1; then
    aerospace list-windows --all --json 2>/dev/null \
      | jq -r --arg app "$APP" '.[] | select(."app-name" == $app) | ."window-id"'
    return
  fi

  aerospace list-windows --all 2>/dev/null \
    | awk -F '|' -v app="$APP" 'tolower($2) ~ "^[[:space:]]*" tolower(app) "[[:space:]]*$" { gsub(/[[:space:]]/, "", $1); print $1 }'
}

before_ids=$(wezterm_window_ids | tr '\n' ' ')

if command -v wezterm >/dev/null 2>&1; then
  wezterm start --cwd "$HOME" >/dev/null 2>&1 &
else
  open -n -a "$APP"
fi

is_new_window() {
  window_id="$1"
  case " $before_ids " in
    *" $window_id "*) return 1 ;;
    *) return 0 ;;
  esac
}

i=0
while [ $i -lt 20 ]; do
  sleep 0.5
  for window_id in $(wezterm_window_ids); do
    if is_new_window "$window_id"; then
      if [ -n "$CURRENT_WORKSPACE" ]; then
        aerospace move-node-to-workspace "$CURRENT_WORKSPACE" --window-id "$window_id" 2>/dev/null || true
        aerospace workspace "$CURRENT_WORKSPACE" 2>/dev/null || true
      fi
      exit 0
    fi
  done
  i=$((i + 1))
done

[ -n "$CURRENT_WORKSPACE" ] && aerospace workspace "$CURRENT_WORKSPACE" 2>/dev/null || true
