# Pi Coding Agent

Configuration for [Pi](https://github.com/mariozechner/pi-coding-agent), Armin Ronacher's terminal AI coding agent.

## Setup

Run automatically by `script/install`, or manually:
```bash
~/.dotfiles/pi/install.sh
```

Requires `pi` to be installed first (`bun install -g @mariozechner/pi-coding-agent`).

The researcher agent also depends on `parallel-cli` for `pi-parallel`. In this dotfiles setup it is installed via `curl -fsSL https://parallel.ai/install.sh | bash` into `~/.local/bin`; authentication is still manual:
```bash
parallel-cli login
```

Run `dot doctor` to verify agents, symlinks, and skill projections are correctly installed.

## Directory Structure

```
pi/
├── agents/                 # Pi agent metadata assembled with shared agent bodies
│   └── review.frontmatter  # Shared-body review exemplar
├── settings.json           # Agent config (model, theme, skills, packages)
├── install.sh              # Symlinks config, installs packages
├── aliases.fish            # Shell aliases (pi-print, pi-json)
├── extensions/             # Custom TypeScript extensions
│   └── notify.ts          # Desktop notification on agent completion
├── packages/               # Vendored local Pi packages
│   └── pi-cmux/            # Local fork of the cmux integration
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
- **Skills**: Discovers Pi-projected shared skills from `~/.dotfiles/.ai-runtime/pi/skills/` (no user-level symlinking needed — Pi supports path-based discovery)
- **Agents**: `ai/install.sh` assembles shared-body agent outputs into `~/.pi/agent/agents/`
- **Packages**: local `pi-cmux` fork plus pi-subagents, pi-parallel, pi-interactive-shell, mitsupi

## Extensions

Extensions are TypeScript files using Pi's `ExtensionAPI`. Symlinked to `~/.pi/agent/extensions/` by `install.sh`.

### notify.ts — Desktop Notifications

Sends OSC 777 escape sequence on `agent_end` event. Shows a desktop notification with the last assistant message summary when Pi finishes a turn.

**Supported terminals**: WezTerm, Ghostty, iTerm2

### Provided by mitsupi

The `npm:mitsupi` package provides additional extensions including `uv.ts` (Python tooling interceptor), `answer.ts`, `review.ts`, `todos.ts`, `files.ts`, and more. These are installed automatically via `pi install npm:mitsupi`.

## Intercepted Commands

Shell shims in `pi/intercepted-commands/` that print helpful error messages redirecting to uv. Used by mitsupi's `uv.ts` extension which prepends intercepted-commands to PATH within Pi's bash tool.

**Note**: mitsupi bundles its own intercepted-commands, so these local shims serve as fallbacks and are available for non-Pi agents.

## Skill Collisions

Some shared skills (`commit`, `uv`, `web-browser`) intentionally collide with mitsupi's bundled copies. Pi prefers mitsupi's versions for those names.

Two other mitsupi collisions (`frontend-design`, `librarian`) are intentionally filtered out in `pi/settings.json` so Pi loads this repo's projected Pi-specific variants from `.ai-runtime/pi/skills/` instead.

## Packages

Local package loaded from settings:

- `pi/packages/pi-cmux` — vendored local fork of `github.com/sasha-computer/pi-cmux`

Third-party packages installed via `pi install`:

| Package | Provides |
|---|---|
| `pi-subagents` | Subagent spawning |
| `pi-parallel` | Parallel web research tools (depends on standalone `parallel-cli`) |
| `pi-interactive-shell` | Interactive shell support |
| `mitsupi` | /answer, /review, /todos, /files, /context, uv interceptor |
