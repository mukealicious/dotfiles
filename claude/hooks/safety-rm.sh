#!/usr/bin/env bash
# safety-rm.sh - PreToolUse hook to redirect rm to trash
#
# Intercepts rm commands and rewrites them to use macOS trash command
# Only matches rm with -r/-f/-rf flags to avoid blocking simple file removes

set -euo pipefail

# Read JSON from stdin
input=$(cat)

# Extract command from tool_input
command=$(echo "$input" | jq -r '.tool_input.command // empty')

# Skip if no command
[[ -z "$command" ]] && exit 0

# Pattern: rm with -r, -f, or -rf flags (destructive removes)
# Matches: rm -rf, rm -r, rm -f, rm -fr, rm --recursive, rm --force
if echo "$command" | grep -qE '^[[:space:]]*rm[[:space:]]+-[rf]'; then
  # Extract paths: remove 'rm', flags, and clean up whitespace
  paths=$(echo "$command" | sed -E 's/^[[:space:]]*rm[[:space:]]+//' | sed -E 's/-[rf]+[[:space:]]*//g' | sed -E 's/--recursive[[:space:]]*//g' | sed -E 's/--force[[:space:]]*//g')

  # Rewrite to trash command
  new_command="trash $paths"

  # Output hook response with modified command
  jq -n \
    --arg cmd "$new_command" \
    --arg reason "Redirected rm to trash for safety" \
    '{
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason: $reason,
        updatedInput: {
          command: $cmd
        }
      }
    }'
  exit 0
fi

# No modification needed - exit silently
exit 0
