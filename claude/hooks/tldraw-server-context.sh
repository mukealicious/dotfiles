#!/bin/sh

# tldraw offline owns and updates the actual context injector. Keep this
# dotfiles-owned adapter portable and harmless until the app has installed it.
hook="$HOME/skills/tldraw-offline/inject-server-context.sh"
[ -f "$hook" ] || exit 0

exec sh "$hook" "${1:-SubagentStart}"
