#!/bin/sh

# tldraw offline owns and updates the actual context injector. Keep this
# dotfiles-owned adapter portable and harmless until the app has installed it.
hook="$HOME/skills/tldraw-offline/inject-server-context.mjs"
[ -f "$hook" ] || exit 0

exec node "$hook" "${1:-SubagentStart}"
