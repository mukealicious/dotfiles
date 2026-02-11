#!/bin/sh
# Play a notification sound and show macOS notification when Claude Code
# finishes a task or needs permission.

SOUND="/System/Library/Sounds/Glass.aiff"
if [ -f "$SOUND" ]; then
  afplay "$SOUND" &
fi

osascript -e 'display notification "Claude Code needs attention" with title "Claude Code"' 2>/dev/null || true

exit 0
