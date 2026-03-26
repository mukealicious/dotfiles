#!/bin/sh
#
# Stream Deck — install automation scripts and build .app wrappers
#
# Shell scripts can't be launched by Stream Deck's "System: Open" action
# (it opens them in a text editor). So we wrap each script in a tiny .app
# bundle using osacompile. The Stream Deck points to the .app instead.

source "$(dirname "$0")/../lib/log.sh"

log_section "Stream Deck"

TOPIC_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPTS_DIR="$TOPIC_DIR/scripts"
APPS_DIR="$TOPIC_DIR/apps"

mkdir -p "$APPS_DIR"

# Ensure all scripts are executable and build .app wrappers
for script in "$SCRIPTS_DIR"/*.sh; do
  [ -f "$script" ] || continue

  chmod +x "$script"
  script_name="$(basename "$script" .sh)"

  # Convert workspace-notes -> WorkspaceNotes (portable — no GNU sed needed)
  app_name=$(echo "$script_name" | python3 -c "import sys; print(''.join(w.capitalize() for w in sys.stdin.read().strip().split('-')))")
  app_path="$APPS_DIR/$app_name.app"

  # Rebuild the .app wrapper
  rm -rf "$app_path"
  osacompile -o "$app_path" \
    -e "do shell script \"$script &> /dev/null &\"" 2>/dev/null

  log_step "$script_name -> $app_name.app"
done

log_success "Stream Deck scripts and .app wrappers ready"
log_hint "Point Stream Deck 'Open' actions to: $APPS_DIR/<Name>.app"
