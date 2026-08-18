# Herdr CLI Reference

Commands communicate with the running Herdr session over its local socket.
Successful management commands generally print JSON; `pane read` prints text.
The installed binary is the syntax authority. `herdr --skill` prints its bundled,
release-matched upstream skill on Herdr 0.8 and later.

## Discover Live IDs

```bash
printf '%s\n' "$HERDR_WORKSPACE_ID" "$HERDR_TAB_ID" "$HERDR_PANE_ID"
herdr pane current --current
herdr pane list --workspace "$HERDR_WORKSPACE_ID"
herdr tab list --workspace "$HERDR_WORKSPACE_ID"
herdr tab get <tab_id>
herdr pane get <pane_id>
herdr workspace list # only when cross-workspace discovery is needed
```

`--current` resolves the calling agent's pane only when `HERDR_ENV=1`; an
out-of-band process has no caller-relative pane. An omitted target may resolve
the user interface's focused pane instead, so never use omission as a fallback.
For explicitly authorized out-of-band control, begin with `herdr workspace list`,
narrow by the requested repository/workspace, then list tabs or panes only in
that workspace and use explicit IDs throughout. Herdr 0.8 IDs are opaque stable
handles and closed IDs are not reused. Moving a pane across workspaces can assign
it a new workspace-qualified ID. Always discover rather than guess IDs and
refresh state before destructive actions.

## Out-of-Band Discovery

Use this only when the user or an explicit workflow has authorized Herdr control
from a process where `HERDR_ENV` is not `1`:

```bash
herdr workspace list
herdr tab list --workspace <requested_workspace_id>
herdr pane list --workspace <requested_workspace_id>
herdr tab get <explicit_tab_id>
herdr pane get <explicit_pane_id>
```

Match the workspace by the requested repository/CWD or a user-provided identity.
Match tabs and panes by labels, CWD, known packet/session metadata, or IDs returned
when the workflow created them. If multiple targets remain plausible, stop and
ask. Do not use `--current`, UI focus, or unrelated panes as discovery shortcuts.

## Tabs

```bash
herdr tab create --workspace <workspace_id> --label "API investigation" --no-focus
herdr tab rename <tab_id> "Fix checkout retries"
herdr tab focus <tab_id>
herdr tab close <tab_id>
```

`tab create` returns the new tab and root pane in JSON. Prefer `--no-focus` when
creating background work.

## Panes

```bash
herdr pane split --current --direction right --ratio 0.4 --no-focus
herdr pane split <pane_id> --direction down --no-focus
herdr pane rename <pane_id> "tests"
herdr pane rename <pane_id> --clear
herdr pane run <pane_id> "pnpm test"
herdr pane close <pane_id>
```

`pane split` returns the new pane at `result.pane.pane_id`.

Inspect layout and process state:

```bash
herdr pane layout --current
herdr pane process-info --current
herdr pane neighbor --current --direction right
herdr pane edges --current
```

Move or reorganize panes:

```bash
herdr pane move <pane_id> --tab <tab_id> --split right --no-focus
herdr pane move <pane_id> --new-tab --label "Logs" --no-focus
herdr pane move <pane_id> --new-workspace --label "project" --tab-label "Task" --no-focus
herdr pane swap --source-pane <pane_id> --target-pane <pane_id>
herdr pane zoom --current --toggle
```

## Agents

`agent start` launches a recognized interactive agent in an existing pane that is
at its shell prompt. It does not create layout:

```bash
herdr agent start reviewer --kind codex --pane <pane_id>
herdr agent start researcher --kind pi --pane <pane_id> -- --skill librarian
```

Arguments after `--` are passed to the target agent. The Pi `--skill` in the
second example is therefore not Herdr's top-level `herdr --skill` printing flag.

Prompt and wait through the agent surface when Herdr should track lifecycle state:

```bash
herdr agent prompt reviewer "Review the current diff." --wait --timeout 120000
herdr agent wait reviewer --until blocked --timeout 120000
herdr agent get reviewer
herdr agent read reviewer --source recent-unwrapped --lines 120
```

`agent prompt --wait` settles on the first observed `idle`, `done`, or `blocked`
state. Without `--until`, `agent wait` uses the same settled-state defaults;
use `--until` only for a state-specific workflow. A prompt sent from a
non-working state must produce an observed lifecycle change within five seconds,
or Herdr returns `agent_prompt_stalled`. The wait tracks lifecycle state rather
than an individual turn, so an already-working turn may satisfy it.

Agent targets are unique live names or pane IDs. For an existing profile wrapper,
restored session, or command requiring explicit environment variables, `pane run`
may remain the correct launch primitive; verify the resulting agent through
`agent get` or `agent wait`.

## Read and Wait

`pane wait-output` searches the selected current terminal snapshot immediately,
including output that already exists, and then polls for a match. It does not
require the matching text to be emitted after the command starts.

Read existing output:

```bash
herdr pane read <pane_id> --source visible --lines 30
herdr pane read <pane_id> --source recent --lines 50
herdr pane read <pane_id> --source recent-unwrapped --lines 50
```

- `visible`: current viewport.
- `recent`: recent scrollback as rendered.
- `recent-unwrapped`: joins terminal soft wraps and matches what output waiting sees.
- Add `--format ansi` or `--ansi` when rendered TUI output matters.

Wait for matching output (existing or future):

```bash
herdr pane wait-output <pane_id> --match "ready on port 3000" --timeout 30000
herdr pane wait-output <pane_id> --regex "server.*ready" --timeout 30000
```

The selected snapshot defaults to `recent`; use `--source visible`,
`--source recent-unwrapped`, or `--lines N` when the output surface needs to be
narrowed. `--match` is a literal substring and `--regex` uses Rust regular
expressions.

Wait for an agent's public status:

```bash
herdr agent wait <pane_id> --until done --timeout 120000
```

Public statuses are `idle`, `working`, `blocked`, `done`, and `unknown`. `done`
means the agent finished but the user has not yet viewed its pane.

## Send Input

```bash
herdr pane send-text <pane_id> "text without Enter"
herdr pane send-keys <pane_id> Enter
herdr pane run <pane_id> "command with Enter"
```

Only send input to a pane created for the task or explicitly designated by the
user. `pane run` and send commands print nothing on success.

## Workspaces

```bash
herdr workspace create --cwd /path/to/project --label "project" --no-focus
herdr workspace rename <workspace_id> "project"
herdr workspace focus <workspace_id>
herdr workspace close <workspace_id>
```

Workspaces are project contexts. Keep their labels stable rather than changing
them for conversation topics.

## Common Recipe: Observable Server

```bash
# 1. Get the caller's live pane and tab IDs.
herdr pane current --current

# 2. Split and capture result.pane.pane_id from the JSON response.
herdr pane split --current --direction right --no-focus

# 3. Label and launch.
herdr pane rename <new_pane_id> "dev server"
herdr pane run <new_pane_id> "pnpm dev"

# 4. Verify readiness and inspect concise output.
herdr pane wait-output <new_pane_id> --match "ready" --timeout 30000
herdr pane read <new_pane_id> --source recent-unwrapped --lines 30
```
