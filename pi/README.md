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
├── agents/                 # Pi agent metadata assembled with shared agent bodies
│   └── review.frontmatter  # Shared-body review exemplar
├── settings.json           # Agent config (model, theme, skills, packages)
├── install.sh              # Symlinks config, installs packages
├── aliases.fish            # Shell aliases (pi-print, pi-json)
├── extensions/             # Custom TypeScript extensions
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
- **Agents**: `ai/install.sh` assembles shared-body agent outputs into `~/.pi/agent/agents/`
- **Packages**: pi-subagents, pi-interactive-shell, mitsupi

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

Some shared skills (`commit`, `uv`, `web-browser`) collide with mitsupi's bundled copies. Pi prefers mitsupi's versions — this is expected. The shared copies in `ai/skills/` still serve Claude Code, OpenCode, Codex, and Gemini.

## Packages

Third-party packages installed via `pi install npm:<pkg>`:

| Package | Provides |
|---|---|
| `pi-subagents` | Subagent spawning |
| `pi-interactive-shell` | Interactive shell support |
| `mitsupi` | /answer, /review, /todos, /files, /context, uv interceptor |

## Known Issues

### mitsupi v1.1.1 execute signature bug

mitsupi v1.1.1 (latest on npm) ships with wrong `execute()` parameter order in `uv.ts`, `todos.ts`, and `loop.ts`. This causes pi to crash (`TypeError: onUpdate is not a function`) on any bash command. Fixed upstream ([commit](https://github.com/mitsuhiko/agent-stuff/commit/fix-extensions-update-tool-execute-signatures), Feb 2 2026) but not yet published to npm. `install.sh` applies a hotfix after installing mitsupi. Remove the hotfix once mitsupi >1.1.1 is released.
