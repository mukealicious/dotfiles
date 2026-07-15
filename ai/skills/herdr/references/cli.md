# Herdr CLI Reference

Commands communicate with the running Herdr session over its local socket.
Successful management commands generally print JSON; `pane read` prints text.

## Discover Live IDs

```bash
herdr pane current --current
herdr pane list
herdr workspace list
herdr tab list --workspace <workspace_id>
herdr tab get <tab_id>
herdr pane get <pane_id>
```

The focused pane returned by `pane current` is the calling agent's pane. Workspace,
tab, and pane IDs are live identifiers and may compact after contexts are closed.
Always discover rather than guess them.

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

## Read and Wait

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

Wait for future output:

```bash
herdr wait output <pane_id> --match "ready on port 3000" --timeout 30000
herdr wait output <pane_id> --match "server.*ready" --regex --timeout 30000
```

Wait for an agent's public status:

```bash
herdr wait agent-status <pane_id> --status done --timeout 120000
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
herdr wait output <new_pane_id> --match "ready" --timeout 30000
herdr pane read <new_pane_id> --source recent-unwrapped --lines 30
```
