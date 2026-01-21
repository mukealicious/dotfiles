# Dotfiles Cleanup & Enhancements - Sprint Plan

**PRD:** [prd.md](prd.md)
**Branch:** `feature/dotfiles-cleanup-enhancements`

---

## Overview

Five features across 4 sprints:
1. **Browser automation cleanup** - Remove browserbase plugin (consolidate to none, or research alternative)
2. **Safety hook** - rm → trash interception via PreToolUse hook
3. **Linear MCP verification** - Confirm existing config works
4. **Remotion skills plugin** - Add video creation guidance
5. **Ralph Wiggum script** (stretch) - Batch task execution

---

## Sprint 1: Safety Infrastructure & Browser Cleanup

**Goal:** Destructive rm commands are recoverable via trash; browser plugin cleaned up

### 1.1 Add `trash` to Brewfile
**File:** [Brewfile](../../../Brewfile)
**Change:** Add `brew "trash"` to Utilities section (NOT `trash-cli`)
**Validation:**
```bash
grep 'brew "trash"' Brewfile  # Returns match
brew bundle --file=$ZSH/Brewfile
trash --version  # Works
```

### 1.2 Remove browserbase plugin from settings.json
**File:** `~/.claude/settings.json`
**Change:** Remove `"browser-automation@browser-tools": true` from `enabledPlugins`
**Validation:**
```bash
jq '.enabledPlugins["browser-automation@browser-tools"]' ~/.claude/settings.json
# Returns null
```

### 1.3 Remove browserbase plugin from install.sh
**File:** [claude/install.sh](../../../claude/install.sh)
**Change:** Remove lines:
- Line 87: `claude plugin marketplace add browserbase/agent-browse`
- Line 92: `claude plugin install browser-automation@browser-tools`

**Validation:**
```bash
grep -c browserbase claude/install.sh  # Returns 0
```

### 1.4 Create safety-rm.sh hook script
**File:** `claude/hooks/safety-rm.sh` (new)
**Change:** Create directory and hook script that:
- Reads JSON from stdin via `jq`
- Detects `rm` commands in `tool_input.command`
- Checks `trash` is installed (fail gracefully if not)
- Outputs JSON with `updatedInput.command` replacing `rm` with `trash`
- Strips rm flags (`-rf`, `-f`, etc.) since trash doesn't need them
- Passes through silently (exit 0, no output) for non-rm commands

**Implementation:**
```bash
#!/bin/bash
# safety-rm.sh - Intercept rm commands, redirect to trash
set -e

input=$(cat)
command=$(echo "$input" | jq -r '.tool_input.command // empty')

# Match rm at start or after ; | &&
if [[ "$command" =~ (^|[;\|]|&&)[[:space:]]*rm[[:space:]] ]]; then
  # Check trash is installed
  if ! command -v trash &>/dev/null; then
    jq -n '{
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: "trash CLI not installed - run: brew install trash"
      }
    }'
    exit 0
  fi

  # Transform: strip rm flags, replace with trash
  # rm -rf /path/to/thing → trash /path/to/thing
  modified=$(echo "$command" | sed -E 's/(^|[;\|]|&&)([[:space:]]*)rm[[:space:]]+(-[rRfivI]+[[:space:]]+)*/\1\2trash /g')

  jq -n --arg cmd "$modified" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "allow",
      permissionDecisionReason: "rm redirected to trash for safety",
      updatedInput: { command: $cmd }
    }
  }'
  exit 0
fi

# Not an rm command - pass through silently
exit 0
```

**Validation:**
```bash
chmod +x claude/hooks/safety-rm.sh

# Test rm transformation
echo '{"tool_input":{"command":"rm -rf /tmp/test"}}' | ./claude/hooks/safety-rm.sh | jq -e '.hookSpecificOutput.updatedInput.command == "trash /tmp/test"'

# Test passthrough
echo '{"tool_input":{"command":"ls -la"}}' | ./claude/hooks/safety-rm.sh
# No output, exit 0
```

### 1.5 Configure hook in settings.json
**File:** `~/.claude/settings.json`
**Change:** Add hooks configuration with absolute path:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "/Users/mikeywills/.dotfiles/claude/hooks/safety-rm.sh"
          }
        ]
      }
    ]
  }
}
```

**Note:** Hooks use absolute paths, NOT symlinks. Update path if dotfiles location changes.

**Validation:**
```bash
jq '.hooks.PreToolUse[0].matcher' ~/.claude/settings.json  # Returns "Bash"
jq '.hooks.PreToolUse[0].hooks[0].command' ~/.claude/settings.json  # Returns path
```

### 1.6 End-to-end validation
**Steps:**
1. `brew bundle --file=$ZSH/Brewfile` - Install trash
2. Start fresh Claude session
3. Create test file: `touch /tmp/safety-hook-test`
4. Ask Claude: "delete /tmp/safety-hook-test using rm"
5. Verify: `ls ~/.Trash/safety-hook-test` exists
6. Verify: `/tmp/safety-hook-test` is gone

**Demo:** rm commands intercepted → files in Trash → recoverable

---

## Sprint 2: MCP Integrations

**Goal:** Linear task management verified; Remotion video skills available

### 2.1 Verify Linear MCP authentication
**File:** `~/.claude/settings.json` (already configured)
**Test:** Start Claude session, ask: "list my recent Linear issues"
**Expected outcomes:**
- **Success:** Issues returned → proceed to 2.2
- **Auth prompt:** Browser opens for OAuth → complete auth → retest
- **Error:** Debug config → fix → retest

**Validation:** Can retrieve Linear issues from Claude session

### 2.2 Add Remotion skills via skills.sh CLI
**Action:** Install using the skills.sh CLI (https://skills.sh/)
```bash
npx skills add remotion-dev/skills --global --agent claude-code --skill remotion-best-practices --yes
```
**Result:**
- Installs skill to `~/.agents/skills/remotion-best-practices/`
- Creates symlink at `~/.claude/skills/remotion-best-practices`

**Validation:**
```bash
ls -la ~/.claude/skills/remotion-best-practices  # Symlink exists
```

### 2.3 Add Remotion skills to install.sh
**File:** [claude/install.sh](../../../claude/install.sh)
**Change:** Add after existing skill setup:
```bash
# Install Remotion skills via skills.sh CLI
echo "  Installing Remotion skills..."
npx skills add remotion-dev/skills --global --agent claude-code --skill remotion-best-practices --yes 2>/dev/null || true
```

**Validation:**
```bash
grep remotion claude/install.sh  # Returns match
```

### 2.4 Verify Remotion skill is available
**Command:** Start fresh Claude session
**Validation:** The skill should be available for Remotion video development guidance

### 2.5 Update CLAUDE.md with new capabilities
**File:** [CLAUDE.md](../../../CLAUDE.md)
**Change:** Add to appropriate section:
```markdown
## New Capabilities

- **Safety Hook:** rm commands are intercepted and redirected to trash for recoverability
- **Linear MCP:** Query and manage Linear issues directly (work task management)
- **Remotion Skills:** Video creation guidance and Remotion workflow assistance
```

**Validation:** Documentation exists and is accurate

**Demo:** Query Linear issues; access Remotion video skill via `/skills`

---

## Sprint 3: Ralph Wiggum Automation (Stretch)

**Goal:** Hands-free batch task execution for PRD workflows

### 3.1 Create script skeleton with argument handling
**File:** `bin/ralph-wiggum` (new)
**Change:** Create executable with shebang, usage, and argument parsing:

```bash
#!/bin/bash
# ralph-wiggum - Batch execute /complete-task for a PRD
set -e

# Defaults
MAX_TASKS=10
PRD_NAME=""

usage() {
  cat <<EOF
Usage: ralph-wiggum <prd-name> [--max N]

Execute /complete-task in loop for a PRD until done or max reached.

Arguments:
  prd-name    Name of the PRD (matches .claude/state/<name>/prd.md)
  --max N     Maximum tasks to complete (default: 10)

Example:
  ralph-wiggum dotfiles-cleanup --max 5
EOF
  exit 1
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --max) MAX_TASKS="$2"; shift 2 ;;
    --help|-h) usage ;;
    -*) echo "Unknown option: $1"; usage ;;
    *) PRD_NAME="$1"; shift ;;
  esac
done

# Validate
[[ -z "$PRD_NAME" ]] && { echo "Error: PRD name required"; usage; }

echo "PRD: $PRD_NAME, Max tasks: $MAX_TASKS"
```

**Validation:**
```bash
chmod +x bin/ralph-wiggum
ralph-wiggum --help  # Shows usage
ralph-wiggum test --max 5  # Prints "PRD: test, Max tasks: 5"
```

### 3.2 Add PRD validation and path resolution
**File:** `bin/ralph-wiggum`
**Change:** Add PRD existence check:

```bash
# Find PRD file
PRD_PATH="$HOME/.claude/state/$PRD_NAME/prd.md"
if [[ ! -f "$PRD_PATH" ]]; then
  # Try alternate location
  PRD_PATH="$HOME/.dotfiles/.claude/state/$PRD_NAME/prd.md"
fi

if [[ ! -f "$PRD_PATH" ]]; then
  echo "Error: PRD not found at ~/.claude/state/$PRD_NAME/prd.md"
  echo "Available PRDs:"
  find ~/.claude/state ~/.dotfiles/.claude/state -name "prd.md" 2>/dev/null | \
    sed 's|.*/state/||; s|/prd.md||' | sort -u
  exit 1
fi

echo "Found PRD: $PRD_PATH"
```

**Validation:**
```bash
ralph-wiggum nonexistent-prd  # Shows error + available PRDs
ralph-wiggum dotfiles-cleanup  # Finds PRD successfully
```

### 3.3 Implement single task execution
**File:** `bin/ralph-wiggum`
**Change:** Add function to execute one task:

```bash
execute_task() {
  local iteration=$1
  echo ""
  echo "════════════════════════════════════════"
  echo "  Task $iteration of $MAX_TASKS"
  echo "════════════════════════════════════════"

  # Execute claude with complete-task
  local output
  if ! output=$(claude -p "/complete-task $PRD_NAME" 2>&1); then
    echo "Claude exited with error"
    return 1
  fi

  echo "$output"

  # Check for completion signals
  if echo "$output" | grep -qi "no incomplete tasks\|all tasks.*complete\|nothing.*to.*do"; then
    echo "All tasks complete!"
    return 2  # Special exit for completion
  fi

  return 0
}
```

**Validation:** Function defined, can be called manually

### 3.4 Implement execution loop with limits
**File:** `bin/ralph-wiggum`
**Change:** Add main loop:

```bash
# Track state
COMPLETED=0
START_TIME=$(date +%s)

# Main loop
for ((i=1; i<=MAX_TASKS; i++)); do
  execute_task $i
  status=$?

  if [[ $status -eq 2 ]]; then
    # All complete
    break
  elif [[ $status -ne 0 ]]; then
    echo "Task failed, stopping"
    break
  fi

  ((COMPLETED++))

  # Brief pause between tasks
  sleep 2
done

# Summary
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
echo ""
echo "════════════════════════════════════════"
echo "  Summary"
echo "════════════════════════════════════════"
echo "  Tasks completed: $COMPLETED"
echo "  Time elapsed: ${DURATION}s"
echo "════════════════════════════════════════"
```

**Validation:**
```bash
# Test with --max 1 to verify single iteration
ralph-wiggum dotfiles-cleanup --max 1
```

### 3.5 Add interrupt handling
**File:** `bin/ralph-wiggum`
**Change:** Add trap for clean exit on Ctrl+C:

```bash
# Near top of script, after set -e
cleanup() {
  echo ""
  echo "Interrupted! Completed $COMPLETED tasks."
  exit 130
}
trap cleanup INT TERM
```

**Validation:** Ctrl+C during execution shows summary and exits cleanly

### 3.6 Test on sample PRD
**Action:** Create minimal test PRD or use existing dotfiles-cleanup PRD
```bash
ralph-wiggum dotfiles-cleanup --max 2
```

**Validation:**
- Script starts, finds PRD
- Executes 1-2 tasks
- Shows summary
- Can interrupt cleanly

**Demo:** Run on real PRD, watch tasks execute hands-free

---

## Sprint 4: Polish & Ship

**Goal:** Clean, tested, documented PR

### 4.1 Run full dot validation
**Command:** `bin/dot`
**Validation:** No errors, all installers complete successfully

### 4.2 Verify no regressions checklist
**Execute each:**
```bash
# Shell starts clean
zsh -i -c 'exit'  # No errors

# Skills intact
ls -la ~/.claude/skills/  # All expected skills

# Hooks configured
jq '.hooks' ~/.claude/settings.json  # Shows PreToolUse config

# Safety hook works
# (Already tested in Sprint 1)

# Linear MCP works
# (Already tested in Sprint 2)
```

### 4.3 Clean up any dead code
**Check:**
```bash
# No stray TODOs related to this work
grep -r "TODO.*browser\|TODO.*trash\|TODO.*linear\|TODO.*remotion" claude/

# No commented browserbase references
grep -r "browserbase" claude/  # Should be empty
```

**Validation:** No unexpected matches

### 4.4 Create PR with comprehensive description
**Command:** `gh pr create`
**Content template:**
```markdown
## Summary
- Removed browserbase browser-automation plugin (consolidating browser tools)
- Added safety hook: rm commands → trash for recoverability
- Verified Linear MCP integration
- Added Remotion skills plugin
- (Stretch) Added ralph-wiggum batch task executor

## Changes
- `Brewfile`: Added `trash` package
- `claude/install.sh`: Removed browserbase, added Remotion
- `claude/hooks/safety-rm.sh`: New PreToolUse hook
- `~/.claude/settings.json`: Hook config, removed browserbase plugin
- `bin/ralph-wiggum`: New batch task script
- `CLAUDE.md`: Documented new capabilities

## Testing
1. `bin/dot` - Full install passes
2. In Claude: `rm /tmp/test` → file goes to Trash
3. In Claude: "list Linear issues" → returns issues
4. `/skills` shows Remotion
5. `ralph-wiggum --help` shows usage

## Breaking Changes
- `browser-automation@browser-tools` plugin removed
```

**Validation:** PR created with all sections filled

---

## Critical Files Summary

| File | Change | Sprint |
|------|--------|--------|
| [Brewfile](../../../Brewfile) | Add `trash` | 1 |
| [claude/install.sh](../../../claude/install.sh) | Remove browserbase, add Remotion | 1, 2 |
| `claude/hooks/safety-rm.sh` | **New** - rm→trash hook | 1 |
| `~/.claude/settings.json` | Hook config, remove browserbase | 1 |
| `bin/ralph-wiggum` | **New** - batch task runner | 3 |
| [CLAUDE.md](../../../CLAUDE.md) | Document new capabilities | 2 |

---

## Verification Checklists

### Sprint 1 Complete When:
- [ ] `trash --version` works
- [ ] `browserbase` not in install.sh or settings.json
- [ ] Hook intercepts `rm` → `trash`
- [ ] End-to-end: file lands in Trash

### Sprint 2 Complete When:
- [ ] Linear issues queryable from Claude
- [ ] Remotion skill in `/skills` output
- [ ] CLAUDE.md updated

### Sprint 3 Complete When:
- [ ] `ralph-wiggum --help` works
- [ ] Script validates PRD exists
- [ ] Loop executes and respects --max
- [ ] Ctrl+C exits cleanly with summary

### Sprint 4 Complete When:
- [ ] `bin/dot` no errors
- [ ] All regression checks pass
- [ ] PR created

---

## Open Questions

| Question | Status | Resolution |
|----------|--------|------------|
| Vercel AI Browser MCP config? | **Resolved** | Vercel agent-browser is CLI+Skill, not MCP. Removing browserbase plugin entirely. |
| `trash` flag compatibility? | **Resolved** | Strip rm flags; trash handles paths only |
| Linear MCP auth method? | **Resolved** | OAuth via browser on first use |
| Remotion marketplace name? | **Resolved** | Use `npx skills add remotion-dev/skills --global --agent claude-code` (skills.sh CLI). Installs to `~/.agents/skills/` and symlinks to `~/.claude/skills/`. |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Hook path hardcoded | Document in CLAUDE.md; use $HOME expansion if possible |
| jq not installed | jq is in Brewfile; hook could check and warn |
| skills.sh CLI changes | Pin to specific version if needed; npx caches locally |
| Ralph Wiggum loops forever | Hard --max limit (default 10); completion detection |
| rm in complex pipes not caught | Regex handles `; \| &&`; document edge cases |
