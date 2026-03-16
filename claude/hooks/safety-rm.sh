#!/usr/bin/env bash
# safety-rm.sh - PreToolUse hook to redirect rm to trash
#
# Intercepts rm commands and rewrites them to use macOS trash command.
# Parses simple rm commands without evaluating shell expansions, detects
# destructive flags (-r, -f, --recursive, --force) anywhere in the argument
# list, and preserves raw path text/quoting in the rewritten command.

set -euo pipefail

# Read JSON from stdin
input=$(cat)

# Extract command from tool_input
command=$(echo "$input" | jq -r '.tool_input.command // empty')

# Skip if no command
[[ -z "$command" ]] && exit 0

RAW_TOKENS=()
COOKED_TOKENS=()

tokenize_shell_words() {
  local input="$1"
  RAW_TOKENS=()
  COOKED_TOKENS=()

  local length=${#input}
  local index=0
  local state="unquoted"
  local raw=""
  local cooked=""
  local ch next

  while (( index < length )); do
    ch="${input:index:1}"

    case "$state" in
      unquoted)
        if [[ -z "$raw" && "$ch" =~ [[:space:]] ]]; then
          ((index++))
          continue
        fi

        if [[ "$ch" =~ [[:space:]] ]]; then
          RAW_TOKENS+=("$raw")
          COOKED_TOKENS+=("$cooked")
          raw=""
          cooked=""
          ((index++))
          continue
        fi

        case "$ch" in
          "'")
            raw+="$ch"
            state="single"
            ;;
          '"')
            raw+="$ch"
            state="double"
            ;;
          '\\')
            raw+="$ch"
            ((index++))
            if (( index >= length )); then
              cooked+='\\'
              break
            fi
            next="${input:index:1}"
            raw+="$next"
            cooked+="$next"
            ;;
          ';'|'|'|'&'|'<'|'>'|'('|')'|'`')
            return 2
            ;;
          *)
            raw+="$ch"
            cooked+="$ch"
            ;;
        esac
        ;;
      single)
        raw+="$ch"
        if [[ "$ch" == "'" ]]; then
          state="unquoted"
        else
          cooked+="$ch"
        fi
        ;;
      double)
        raw+="$ch"
        if [[ "$ch" == '"' ]]; then
          state="unquoted"
        elif [[ "$ch" == '\\' ]]; then
          ((index++))
          if (( index >= length )); then
            cooked+='\\'
            break
          fi
          next="${input:index:1}"
          raw+="$next"
          case "$next" in
            '"'|'\\'|'$'|'`')
              cooked+="$next"
              ;;
            *)
              cooked+="\\$next"
              ;;
          esac
        else
          cooked+="$ch"
        fi
        ;;
    esac

    ((index++))
  done

  if [[ -n "$raw" ]]; then
    if [[ "$state" != "unquoted" ]]; then
      return 3
    fi
    RAW_TOKENS+=("$raw")
    COOKED_TOKENS+=("$cooked")
  fi

  return 0
}

emit_ask_response() {
  local reason="$1"
  jq -n \
    --arg reason "$reason" \
    '{
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason: $reason
      }
    }'
}

if tokenize_shell_words "$command"; then
  :
else
  if [[ ${#COOKED_TOKENS[@]} -gt 0 && "${COOKED_TOKENS[0]}" == "rm" ]]; then
    emit_ask_response "Complex rm syntax could not be safely rewritten to trash; review carefully."
  fi
  exit 0
fi

[[ ${#COOKED_TOKENS[@]} -gt 0 && "${COOKED_TOKENS[0]}" == "rm" ]] || exit 0

dangerous=false
past_dd=false
paths_raw=()

for ((i=1; i<${#COOKED_TOKENS[@]}; i++)); do
  arg="${COOKED_TOKENS[$i]}"
  raw_arg="${RAW_TOKENS[$i]}"

  if [[ "$past_dd" == "true" ]]; then
    paths_raw+=("$raw_arg")
  elif [[ "$arg" == "--" ]]; then
    past_dd=true
  elif [[ "$arg" == "--recursive" || "$arg" == "--force" ]]; then
    dangerous=true
  elif [[ "$arg" == -* ]]; then
    [[ "$arg" =~ [rf] ]] && dangerous=true
  else
    paths_raw+=("$raw_arg")
  fi
done

[[ "$dangerous" == "true" ]] || exit 0

new_command="trash"
[[ "$past_dd" == "true" ]] && new_command+=" --"
for raw_path in "${paths_raw[@]}"; do
  new_command+=" $raw_path"
done

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
