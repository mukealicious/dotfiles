# Herdr Workflows

Use these recipes only for task-scoped layouts, persistent processes, or coordination.
The caller identity and ownership safeguards in [SKILL.md](../SKILL.md) still apply.
For command syntax, see [cli.md](cli.md).

## Use the Right Herdr Primitive

| Need | Primitive | Policy |
|---|---|---|
| Project/repository context | Workspace | Keep workspace labels project-oriented. Do not rename for each task. |
| Task/topic and primary conversation | Tab | Keep one primary Pi conversation per tab and give the tab a task-level label. |
| Interactive coding companion | Pane | Split beside the agent, usually 50/50, and label by role, such as `hunk`. |
| Server, logs, or persistent watcher | Tab | Keep runtime processes out of the coding tab; group related processes as labeled panes in one operational tab. |
| Specialized autonomous work | Agent pane or subagent harness | Prefer the configured subagent harness for bounded delegation; use a visible pane only when it supports the current tab's topic. |

Avoid creating layout clutter. Use the current pane for short commands. Create a
sibling pane when a tool is directly complementary to the coding conversation.
Create a separate tab for persistent processes the user may monitor independently.
Treat tabs as topic boundaries: start separate Pi conversations in separate tabs,
and keep side-by-side panes scoped to the same topic.

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

### Agent and pane waits

Use `herdr agent prompt <target> <text> --wait` for ordinary delegated work. The
wait settles on the first observed `idle`, `done`, or `blocked` state; do not
repeat those defaults with `--until`. A prompt sent while an agent is not
working must produce an observed lifecycle change within five seconds or Herdr
returns `agent_prompt_stalled`. This tracks lifecycle state, not a particular
turn, so an already-working turn may satisfy the wait.

Use `--until` only when a specific state matters, and inspect `agent get` and
`agent read` before responding to `blocked`. Standalone `herdr agent wait`
without `--until` uses the same settled-state defaults.

`herdr pane wait-output` searches the selected current terminal snapshot
immediately, including output that already exists, and then polls. Use a
literal `--match` or Rust `--regex`; select `visible`, `recent`, or
`recent-unwrapped` with `--source` when needed.

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

Herdr injects `HERDR_WORKSPACE_ID`, `HERDR_TAB_ID`, and `HERDR_PANE_ID` into a
managed calling pane. Prefer `--current` or those caller IDs over UI focus. Before
local coordination, run `herdr pane list --workspace "$HERDR_WORKSPACE_ID"` and
use IDs from the live response; inspect other workspaces only when the user asks.

For explicitly authorized out-of-band work, query the smallest discovery surface
that can identify the target—for example, `workspace list`, followed by `tab list
--workspace <id>` or `pane list --workspace <id>`—then operate only on explicit
live IDs belonging to that scope. Never substitute the currently focused UI pane
for a missing caller identity.

Herdr 0.8 IDs are opaque stable handles and closed IDs are not reused. A moved
pane can receive a new workspace-qualified ID, so never rely on a guessed ID and
re-read live state before destructive or cross-pane actions.

Use Herdr coordination when it adds visibility or enables genuine concurrency:

- Wait for a server or build with `herdr pane wait-output`.
- Wait for a visible sibling agent with `herdr agent wait`.
- Read completed output with `herdr pane read`.
- Use a labeled new tab for a distinct investigation that should remain available.
- Use a labeled split for interactive companions, REPLs, debuggers, or
  user-visible agents that belong beside the current conversation.

Prefer built-in agent/subagent orchestration when it provides better isolation,
structured outputs, or parallel execution. Herdr panes are complementary: they
are best for terminal-native work the user may want to see or resume.
