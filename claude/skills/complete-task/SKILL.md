---
name: complete-task
description: Complete the next incomplete task from a PRD. Use to execute tasks created by /prd-task. Invoke with /complete-task <prd-name>.
---

# Complete Task

Complete one task from a PRD. Implements the next task with `passes: false`, runs feedback loops, and commits.

## Usage

```
/complete-task <prd-name>
```

Where `<prd-name>` matches `.claude/state/<prd-name>/prd.json`

## File Locations

Search for state directory starting at cwd, walking up:

```bash
find_state() {
  local prd="$1"
  local dir="$PWD"
  while [[ "$dir" != "/" ]]; do
    if [[ -f "$dir/.claude/state/$prd/prd.json" ]]; then
      echo "$dir/.claude/state/$prd"
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  return 1
}
```

State directory structure:
```
.claude/state/<prd-name>/
├── prd.json       # Task list with passes field
└── progress.txt   # Cross-iteration memory
```

## Process

### 1. Get Bearings

- Read `progress.txt` - **CHECK 'Codebase Patterns' SECTION FIRST**
- Read `prd.json` - find next task with `passes: false`
- Check recent history: `git log --oneline -10`

**Task Priority** (highest to lowest):
1. Architecture/core abstractions
2. Integration points
3. Spikes/unknowns
4. Standard features
5. Polish/cleanup

### 2. Initialize Progress (if needed)

If `progress.txt` doesn't exist:

```markdown
# Progress Log
PRD: <prdName>
Started: <YYYY-MM-DD>

## Codebase Patterns
<!-- Consolidate reusable patterns here -->

---
<!-- Task logs below - APPEND ONLY -->
```

### 3. Branch Setup

Extract `prdName` from PRD, then:
```bash
git checkout -b <prdName>  # or checkout if exists
```

### 4. Implement Task

Work on the single task until verification steps pass.

### 5. Feedback Loops (REQUIRED)

Before committing, run ALL applicable:
- Type checking
- Tests
- Linting
- Formatting

**Do NOT commit if any fail.** Fix issues first.

### 6. Update PRD

Set the task's `passes` field to `true` in `prd.json`.

### 7. Update Progress

Append to `progress.txt`:

```markdown
## Task - [task.id]
- What was implemented
- Files changed
- **Learnings:** patterns, gotchas
```

If you discover a **reusable pattern**, also add to `## Codebase Patterns` at the TOP.

### 8. Commit

```bash
git add -A && git commit -m 'feat(<scope>): <description>'
```

## Completion

If all tasks have `passes: true`:

```
<tasks>COMPLETE</tasks>

All tasks in PRD <prd-name> have been completed.
```

## Philosophy

This codebase will outlive you. Every shortcut becomes someone else's burden. Patterns you establish will be copied. Corners you cut will be cut again.

Fight entropy. Leave the codebase better than you found it.
