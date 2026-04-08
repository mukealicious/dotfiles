# pi-cmux

> Vendored local fork of [`sasha-computer/pi-cmux`](https://github.com/sasha-computer/pi-cmux).
> Active in this dotfiles repo via per-profile `settings.json` as `/Users/mikeywills/.dotfiles/pi/packages/pi-cmux`.

A [Pi](https://github.com/mariozechner/pi-coding-agent) package that gives Pi a native bridge to [cmux](https://github.com/manaflow-ai/cmux) over cmux's socket API.

The point is simple: instead of generic terminal notifications and shelling out to the `cmux` CLI, Pi can talk to cmux directly. That enables better notifications, sidebar status, and agent-callable runtime browser/workspace tools.

## Origin / inspiration

The original package idea and upstream implementation came from [`sasha-computer/pi-cmux`](https://github.com/sasha-computer/pi-cmux).

Its core idea is the same one this fork keeps: **Pi should integrate with cmux natively over the socket API**.
That means:

- targeted notifications for the right cmux surface
- sidebar status pills tied to the current workspace
- direct live browser/workspace control from Pi tools
- graceful no-op behavior when Pi is not running inside cmux

So this directory is not a brand-new concept; it is a practical local fork of that upstream package for this dotfiles setup.

## Why keep a local fork here?

This repo vendors the package locally so it can be maintained alongside the rest of the Pi configuration.

That gives a few advantages:

- **Faster iteration** — change code here without reinstalling a git package
- **Repo-local maintenance** — package code lives next to `pi/settings.*.json`, `pi/install.sh`, and related docs
- **Small local patches** — carry repo-specific improvements while upstream evolves
- **Easier debugging** — troubleshoot the exact package Pi is loading in this environment

In this repo, the active package is the local path entry in each profile's `settings.json`, not a separately installed `git:github.com/sasha-computer/pi-cmux` checkout.

## Upstream vs this local fork

| Topic | Upstream / original package | Local fork in this repo |
|---|---|---|
| Source | `git:github.com/sasha-computer/pi-cmux` | `/Users/mikeywills/.dotfiles/pi/packages/pi-cmux` |
| Core idea | Native Pi ↔ cmux integration over the socket API | Same |
| Packaging | Installed as a normal Pi package from git | Vendored directly into dotfiles |
| Local additions | Upstream baseline | `/cmux-debug`, repo-local docs, path-based loading |
| Maintenance style | Separate package lifecycle | Maintained together with this Pi setup |

At the moment this is a **small pragmatic fork**, not a redesign. The goal is to keep the upstream spirit while making local maintenance easier.

## What this local fork does

### 1. Context-aware notifications

When Pi finishes inside cmux, you get a useful notification instead of a generic “Waiting for input”.

Examples:
- file changes were made
- a bash command failed
- the last assistant message summarized the result

Notifications are sent to the current cmux surface when possible.

### 2. Sidebar status pills

The cmux sidebar shows Pi session state at a glance:

- model name
- running vs idle state
- thinking level
- token/context usage

### 3. Shell-state reporting

The package reports shell activity (`running` vs `prompt`) back to cmux so workspace/panel state better reflects what Pi is doing.

### 4. LLM-callable cmux tools

The agent gets three cmux-aware tools:

- `cmux_browser` — live browser/runtime control for localhost and authenticated pages: open, navigate, snapshot, click, fill, eval, screenshot, console/errors, scroll, etc.
- `cmux_workspace` — list/create workspaces, split panes, focus/flash surfaces, send text/keys, close surfaces, identify context
- `cmux_notify` — explicitly notify the user via cmux

Routing notes:
- Use `cmux_browser` for live rendered/runtime work: localhost apps, authenticated pages, visual inspection, DOM/JS debugging, and browser console/error inspection.
- Prefer `parallel_*` tools for public web discovery, reading, and synthesis.
- Prefer `bash` / `curl` for APIs, raw files, and exact transport.
- Inside Pi, prefer `cmux_browser` over shelling out to `agent-browser` when you need live browser interaction.

### 5. Footer status in Pi

When connected, Pi's own UI shows a `cmux` status entry in the footer.

### 6. Debug command

This fork adds `/cmux-debug`, which prints:

- resolved cmux env vars
- connection state before/after connect
- the current `system.identify` payload

That makes it much easier to debug “am I actually inside cmux?” problems.

### 7. Graceful no-op outside cmux

If `CMUX_SOCKET_PATH` is missing or the socket is unreachable, the package quietly does nothing.
No errors, no noise.

## How it works

The package connects to cmux's Unix socket and uses:

- **v2 JSON RPC-style requests** for notifications, browser control, workspace control, and `system.identify`
- **v1 text commands** for sidebar status pills and shell-state reporting

Structured cmux API failures are preserved for tool callers; only transport failures degrade to `null`.
Large browser outputs are compacted before being shown back to the model — runtime snapshots omit raw page HTML in normal output, and screenshot output omits inline PNG base64.

## Architecture

```text
extensions/
  index.ts           Entry point; wires hooks, tools, and lifecycle
  cmux-client.ts     Persistent Unix socket client (v2 JSON + v1 text)
  notifications.ts   Context-aware notification logic
  status.ts          Sidebar status + shell-state reporting
  tools.ts           cmux_browser / cmux_workspace / cmux_notify
  debug.ts           /cmux-debug command and renderer
```

## Development notes

- No build step; Pi loads the TypeScript directly
- This repo loads the package via local path from each profile's `settings.json`
- Use `/reload` inside Pi after changes
- Deterministic browser smoke fixtures live under `fixtures/cmux-browser/`
- For isolated development, you can also run:

```bash
pi -e ./extensions
```

If you want the upstream package instead of this fork, see:

```bash
pi install git:github.com/sasha-computer/pi-cmux
```

## Environment

These env vars are provided by cmux and used by the package:

| Variable | Used for |
|---|---|
| `CMUX_SOCKET_PATH` | cmux socket connection |
| `CMUX_WORKSPACE_ID` | targeting status pills to the current workspace |
| `CMUX_SURFACE_ID` | targeting notifications to the current surface |
| `CMUX_TAB_ID` | fallback workspace identifier |
| `CMUX_PANEL_ID` | fallback surface/panel identifier |
| `PI_CMUX_DISABLE=1` | force-disable the package |
| `PI_CMUX_VERBOSE=1` | verbose socket logging to stderr |

## Notes

- See [TODO.md](TODO.md) for the original implementation plan and historical notes.
- See [cmux-guide.md](cmux-guide.md) for cmux protocol/reference notes used while building this package.

## License

MIT
