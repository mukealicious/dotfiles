# Pi Coding Agent

Configuration for [Pi](https://github.com/mariozechner/pi-coding-agent), Armin Ronacher's terminal AI coding agent.

## Setup

Run automatically by `script/install`, or manually:
```bash
~/.dotfiles/pi/install.sh
```

Requires `pi` to be installed first (`bun install -g @mariozechner/pi-coding-agent`).

## Directory Structure

```
pi/
├── settings.json           # Agent config (model, theme, skills, packages)
├── install.sh              # Symlinks config, installs packages
├── aliases.fish            # Shell aliases (pi-print, pi-json)
├── extensions/             # Custom TypeScript extensions
│   ├── uv.ts              # Intercepts pip/python → uv
│   └── notify.ts          # Desktop notification on agent completion
├── intercepted-commands/   # Shell shims for Python tooling
│   ├── pip                # → uv add / uv run --with
│   ├── pip3               # → uv add / uv run --with
│   ├── poetry             # → uv init / uv add / uv sync / uv run
│   ├── python             # → uv run python (blocks -m pip, -m venv)
│   └── python3            # → uv run python (blocks -m pip, -m venv)
└── themes/
    └── gruvbox-light.json  # Custom color theme
```

## Configuration

`settings.json` is symlinked to `~/.pi/agent/settings.json`:

- **Model**: Claude Opus 4.6 via Anthropic
- **Theme**: Gruvbox Light
- **Skills**: Discovers shared skills from `~/.dotfiles/ai/skills/` (no symlinking needed — Pi supports path-based discovery)
- **Packages**: pi-subagents, pi-interactive-shell, mitsupi

## Extensions

Extensions are TypeScript files using Pi's `ExtensionAPI`. Symlinked to `~/.pi/agent/extensions/` by `install.sh`.

### uv.ts — Python Tooling Interceptor

Wraps Pi's bash tool to prepend `intercepted-commands/` to PATH. Any `pip`, `python`, or `poetry` command the agent runs gets intercepted:

- `pip install X` → error with `uv add X` suggestion
- `python script.py` → `uv run python script.py`
- `python -m pip` / `python -m venv` → blocked with uv alternatives

### notify.ts — Desktop Notifications

Sends OSC 777 escape sequence on `agent_end` event. Shows a desktop notification with the last assistant message summary when Pi finishes a turn.

**Supported terminals**: WezTerm, Ghostty, iTerm2

## Intercepted Commands

Shell shims in `pi/intercepted-commands/` that print helpful error messages redirecting to uv. These are NOT on PATH by default — the `uv.ts` extension prepends the directory to PATH within Pi's bash tool.

## Packages

Third-party packages installed via `pi install npm:<pkg>`:

| Package | Provides |
|---|---|
| `pi-subagents` | Subagent spawning |
| `pi-interactive-shell` | Interactive shell support |
| `mitsupi` | /answer, /review, /todos, /files, /context |
