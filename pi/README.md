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

To choose the default Pi profile per machine, copy the pattern from `fish/local.fish.example`
into `~/.config/fish/local.fish` and set:

```fish
set -gx PI_DEFAULT_PROFILE work
# or
set -gx PI_DEFAULT_PROFILE personal
```

## Directory Structure

```
pi/
├── agents/                 # Pi agent metadata assembled with shared agent bodies
│   └── review.frontmatter  # Shared-body review exemplar
├── settings.work.json      # Work profile config (OpenAI API key flow)
├── settings.personal.json  # Personal profile config (OpenAI Codex OAuth flow)
├── install.sh              # Symlinks config, installs packages
├── aliases.fish            # Shell aliases / profile dispatch
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

Profile settings are symlinked by `install.sh`:

- `pi/settings.work.json` → `~/.pi/work/settings.json`
- `pi/settings.personal.json` → `~/.pi/personal/settings.json`
- `pi/settings.work.json` → `~/.pi/agent/settings.json` (shared backing store / compatibility root)

Shared global Pi runtime resources are projected once, then shared into both active
profiles:

- `~/.pi/agent/AGENTS.md` → canonical assembled Pi instructions
- `~/.pi/work/AGENTS.md` → symlink to shared Pi instructions
- `~/.pi/personal/AGENTS.md` → symlink to shared Pi instructions
- `~/.pi/agent/agents/` → canonical assembled/symlinked Pi agent defs
- `~/.pi/work/agents` → symlink to shared Pi agents
- `~/.pi/personal/agents` → symlink to shared Pi agents

Current defaults:

- **Work profile**: OpenAI `gpt-5.4` via API key
- **Personal profile**: OpenAI Codex `gpt-5.4` via OAuth subscription
- **Theme**: Gruvbox Light
- **Skills**: Discovers Pi-projected shared skills from `~/.dotfiles/.ai-runtime/pi/skills/` (no user-level symlinking needed — Pi supports path-based discovery)
- **Instructions**: `ai/install.sh` assembles one shared Pi instruction file, then symlinks it into both profiles
- **Agents**: `ai/install.sh` assembles one shared Pi agent dir, then symlinks it into both profiles
- **Packages**: pi-parallel and mitsupi

In normal use there is no standalone user-facing top-level Pi profile: `pi` dispatches to
either `pi-work` or `pi-personal`. The `~/.pi/agent/` tree is kept as the shared backing
store for global Pi instructions/agents and for compatibility with raw `~/.bun/bin/pi`
usage.

## Extensions

Extensions are TypeScript files using Pi's `ExtensionAPI`. Symlinked into each active
profile's `extensions/` directory by `install.sh`.

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

Two other mitsupi collisions (`frontend-design`, `librarian`) are intentionally filtered out in both profile settings files so Pi loads this repo's projected Pi-specific variants from `.ai-runtime/pi/skills/` instead.

## Packages

Third-party packages installed via `pi install`:

| Package | Provides |
|---|---|
| `pi-parallel` | Parallel web research tools (depends on standalone `parallel-cli`) |
| `mitsupi` | /answer, /review, /todos, /files, /context, uv interceptor |
