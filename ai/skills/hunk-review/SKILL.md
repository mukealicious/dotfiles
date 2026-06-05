---
name: hunk-review
description: Reviews diffs through live Hunk terminal sessions. Use when the user has Hunk open, asks for interactive diff review, wants inline review comments, or mentions hunk diff review.
compatibility: Requires hunk CLI and a live Hunk TUI session for session commands.
metadata:
  watch-sources: |
    modem-dev/hunk/skills/hunk-review/SKILL.md@main
    modem-dev/hunk/docs/agent-workflows.md@main
---

# Hunk Review

Hunk is an interactive terminal diff viewer. The TUI is for the user; do not run interactive `hunk diff`, `hunk show`, or `hunk patch` yourself unless explicitly asked. Use `hunk session ...` commands to inspect and control a live Hunk window.

If no live session exists, ask the user to launch Hunk first, usually `hunk diff --watch` in another terminal/Herdr pane.

## Workflow

```bash
hunk session list
hunk session get --repo .
hunk session review --repo . --json
# Only when raw diff text is needed:
hunk session review --repo . --include-patch --json
```

Then navigate/comment as useful:

```bash
hunk session navigate --repo . --file src/App.tsx --hunk 2
hunk session comment add --repo . --file src/App.tsx --new-line 42 --summary "Explain the issue or decision"
printf '%s\n' '{"comments":[{"filePath":"src/App.tsx","newLine":42,"summary":"Explain the issue or decision"}]}' \
  | hunk session comment apply --repo . --stdin
```

## Guidance

- Start with `review --json`; add `--include-patch` only when structure is not enough.
- Prefer `--repo .` for normal worktree sessions.
- Use `reload` to swap the live window contents when needed: `hunk session reload --repo . -- diff`.
- Navigate before commenting when walking the user through a review.
- Keep comments sparse and useful: intent, structure, risk, or follow-up.
- Use `comment apply` for batches instead of many one-off commands.
- For exact current Hunk CLI guidance, run `hunk skill path` and read that file if available.

## Common fixes

- No active sessions: ask the user to open Hunk, or check `hunk session list`.
- Multiple matching sessions: pass the session id from `hunk session list`.
- File not visible: inspect `hunk session review --repo . --json`, then reload the session if needed.
