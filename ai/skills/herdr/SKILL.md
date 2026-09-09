---
name: herdr
description: "Operate effectively inside Herdr: name the current conversation, organize work into workspaces/tabs/panes, run observable side processes, and coordinate agents. Use whenever HERDR_ENV=1 or when asked about Herdr."
metadata:
  watch-sources: herdrdev/herdr/skills/herdr/SKILL.md@346411fa21afd297f5ed3b3fa56f9e3fbf7654b7
---

# Herdr

Herdr is the terminal workspace manager surrounding the current agent.

## Startup

Check `HERDR_ENV` before substantive work. When it is `1`, identify the calling
pane and rename its tab once the user's intent is clear:

```bash
herdr pane current --current
herdr tab rename <tab_id-from-response> "π Improve agent ergonomics"
```

- Use caller-relative `--current` or injected `HERDR_*` IDs, not UI focus.
- Prefix Pi tabs with `π`; for another reported agent, use its name unless a
  compact sigil is documented. Omit the prefix when no agent is reported.
- Use 2–5 task/outcome words after the prefix. Avoid repo names, vague labels,
  separators, and transient status (`WIP`, `blocked`, `done`).
- Preserve a useful user-supplied label. Rename again only for a material pivot.
- Tab renaming is low-risk and reversible; no approval needed.

## Identity and ownership

When `HERDR_ENV` is not `1`, there is no caller-relative pane. Do not use
`--current`, infer ownership from UI focus, or inspect Herdr merely because a
socket is available. Out-of-band control requires an explicit user request or
narrowly delegated workflow scope. Discover the target by requested workspace,
repository, labels, or known task-created IDs; operate on explicit live IDs.
Ask if the target remains ambiguous. Do not rename a conversation tab unless
it is explicitly identified as the target.

In either context:

- Do not inspect, type into, move, close, or repurpose unrelated/user-owned panes
  without permission. Visibility is not ownership; never send text to an unrelated
  agent pane.
- Query only the smallest discovery surface needed for the authorized task.
- IDs are opaque; moved panes can acquire new workspace-qualified IDs. Re-read
  live IDs before destructive or cross-pane actions.
- Use `--no-focus` for background tabs, workspaces, and splits; label what you create.
- Never interrupt a live process silently. Close only disposable contexts you
  created, preserving useful output.

## Task-specific operations

Use the current pane for short commands. Keep the workspace project-oriented and
tabs task-oriented. Put interactive companions beside the agent and persistent
servers/watchers in a separate operational tab. Prefer the configured subagent
harness for bounded delegation unless visible terminal work adds value.

Read [references/workflows.md](references/workflows.md) when creating layouts,
opening Hunk (explicit request required), running persistent processes, or
coordinating agents. Read [references/cli.md](references/cli.md) for command
syntax, waits, keys, moves, and workspace operations. Neither is required just
to name the current conversation.

The installed binary is authoritative: use `herdr --help` and relevant group help
when syntax is uncertain. `herdr --skill` (0.8+) prints release-matched upstream
instructions; retain this skill's local operating policy. Do not run bare `herdr`
for discovery: it launches/attaches the TUI. Arguments after `agent start --`
belong to the launched agent, not Herdr. Use returned JSON IDs rather than guesses.
