---
name: herdr
description: "Operate effectively inside Herdr: name the current conversation, organize work into workspaces/tabs/panes, run observable side processes, and coordinate agents. Use whenever HERDR_ENV=1 or when asked about Herdr."
---

# Herdr

Herdr is the terminal workspace manager surrounding the current agent. Use it as
part of the working environment, not only when the user explicitly mentions it.

## Guardrail

Before using this skill, check `HERDR_ENV`:

```bash
test "${HERDR_ENV:-}" = 1
```

If it is not `1`, do not inspect or control Herdr. Explain that the current pane
is not Herdr-managed if the requested task requires Herdr.

Do not inspect, type into, move, or close unrelated panes merely because they are
visible. Treat them as user-owned contexts unless the user asks you to coordinate
with them or you created them for the current task.

## Start Every Conversation Well

Once the user's intent is clear, rename the current tab to the conversation topic:

```bash
herdr pane current --current
herdr tab rename <tab_id-from-response> "<agent-from-response> · Improve agent ergonomics"
```

Choose a stable, scannable label:

- Prefix agent tabs with the agent name reported by Herdr, such as
  `pi · Fix checkout retries`; omit the prefix when no agent is reported.
- Use 2–5 words describing the task or intended outcome after the prefix.
- Prefer `pi · Fix checkout retries` over vague labels such as `pi · Working`.
- Do not repeat the repository name; the workspace already provides project context.
- Do not put transient status such as `WIP`, `blocked`, or `done` in the label;
  Herdr already displays agent status.
- Rename again only if the conversation materially pivots.
- Preserve a useful user-supplied label unless the new topic clearly supersedes it.

Tab renaming is low-risk and reversible. Do it without asking.

## Use the Right Herdr Primitive

| Need | Primitive | Policy |
|---|---|---|
| Project/repository context | Workspace | Keep workspace labels project-oriented. Do not rename for each task. |
| Independent conversation or subcontext | Tab | Give every created tab a task-level label. |
| Interactive coding companion | Pane | Split beside the agent, usually 50/50, and label by role, such as `hunk`. |
| Server, logs, or persistent watcher | Tab | Keep runtime processes out of the coding tab; group related processes as labeled panes in one operational tab. |
| Specialized autonomous work | Agent pane or subagent harness | Prefer the configured subagent harness for bounded delegation; use a visible pane when the user benefits from watching or interacting with it. |

Avoid creating layout clutter. Use the current pane for short commands. Create a
sibling pane when a tool is directly complementary to the coding conversation.
Create a separate tab for persistent processes the user may monitor independently.

## Common Layout Recipes

### Coding with Hunk

When the user asks to open Hunk beside the agent, keep the agent on the left and
create an evenly sized Hunk pane on the right. Do not duplicate an existing Hunk
pane or session.

```bash
herdr pane current --current
herdr pane rename <current-pane-id> "<agent-from-response>"
herdr pane split --current --direction right --ratio 0.5 --no-focus
herdr pane rename <new-pane-id> "hunk"
herdr pane run <new-pane-id> "hunk diff --watch"
```

Running Hunk's interactive TUI still requires an explicit user request. Keep
focus on the agent so the user can choose when to enter the Hunk pane.

### Servers, Logs, and Watchers

Create a background tab instead of splitting the coding tab:

```bash
herdr pane current --current
herdr tab create --workspace <workspace-id-from-response> --label "dev server" --no-focus
herdr pane rename <new-tab-root-pane-id> "server"
herdr pane run <new-tab-root-pane-id> "pnpm dev"
```

If several persistent processes belong together, split that operational tab and
label panes by role, such as `server`, `logs`, or `worker`. Keep unrelated
processes in separate tabs.

### Short Commands

Run short tests, builds, and one-off commands in the agent pane unless interaction,
concurrency, or persistent visibility makes a separate pane or tab useful.

For visible commands and persistent processes:

1. Use repository-native commands.
2. Keep focus on the conversation with `--no-focus`.
3. Wait for a meaningful readiness/completion signal when one exists.
4. Read only enough recent output to verify the result.
5. Report failures; do not turn them into success-shaped fallbacks.
6. Do not close the pane or tab automatically if preserving its output is useful.
   Close only disposable contexts you created, and never interrupt a live process
   silently.

## Coordination Workflow

Before coordinating, run `herdr pane list` and use IDs from the live response.
IDs can compact after tabs, panes, or workspaces close, so never rely on a stale or
guessed ID.

Use Herdr coordination when it adds visibility or enables genuine concurrency:

- Wait for a server or build with `herdr wait output`.
- Wait for a visible sibling agent with `herdr wait agent-status`.
- Read completed output with `herdr pane read`.
- Use a labeled new tab for a distinct investigation that should remain available.
- Use a labeled split for interactive companions, REPLs, debuggers, or
  user-visible agents that belong beside the current conversation.

Prefer built-in agent/subagent orchestration when it provides better isolation,
structured outputs, or parallel execution. Herdr panes are complementary: they
are best for terminal-native work the user may want to see or resume.

## Safety and Hygiene

- Use `--no-focus` for background tabs, workspaces, and splits.
- Label every tab or pane you create.
- Never close or repurpose user-owned contexts without permission.
- Never send text to an unrelated agent pane.
- Re-read live IDs immediately before destructive actions.
- Keep the workspace as the project boundary and tabs as task boundaries.

## Command Reference

Read [references/cli.md](./references/cli.md) when managing layouts, waiting on
output or agents, sending keys, moving panes, or creating workspaces.
