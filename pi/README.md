# Pi Coding Agent

Configuration for [Pi](https://github.com/earendil-works/pi), Armin Ronacher's terminal AI coding agent.

## Setup

Run automatically by `script/install`, or manually:
```bash
~/.dotfiles/pi/install.sh
```

Pi itself is intentionally not managed as an `npm:` tool in `mise.toml`; use Pi's own updater so new releases are not delayed by the global release airlock:

```bash
pi update
```

For a first-time install, Pi moved to `earendil-works/pi`; use the current package under the `@earendil-works` npm scope:

```bash
mise exec -C ~/.dotfiles -- bun install -g @earendil-works/pi-coding-agent --minimum-release-age=0
```

Official migration path for old installs is `pi update`; run it again if it first updates only to the final old-scope handoff release.

Web search tools are routed by cost and depth:

- Local `pi-parallel` provides `web_search`, `web_fetch`, `deep_research`, and `batch_enrich`. `web_search` defaults to Parallel Turbo for ordinary discovery and quick lookups, with Basic and Advanced available explicitly. In this dotfiles setup `parallel-cli` is installed via `curl -fsSL https://parallel.ai/install.sh | bash` into `~/.local/bin`; authentication is still manual:
  ```bash
  parallel-cli login
  ```
- `pi-exa` provides `exa_search` for semantic discovery, obscure technical/code material, broader multilingual search, and fallback verification. Set `EXA_API_KEY` privately (do not commit it), then run `/exa-setup` in Pi:
  ```fish
  set -Ux EXA_API_KEY "..."
  ```

Run `dot doctor` to verify agents, symlinks, and skill projections are correctly installed.

For local editor/typecheck support of custom Pi extensions, install transient dev dependencies without committing a lockfile:

```bash
npm --prefix pi install --package-lock=false --ignore-scripts
npm --prefix pi run typecheck
```

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
├── settings.work.json      # Work profile config baseline (OpenAI API key flow)
├── settings.personal.json  # Personal profile config baseline (OpenAI Codex OAuth flow)
├── install.sh              # Materializes settings, symlinks resources, installs packages
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

Profile settings are materialized as writable runtime files by `install.sh`:

- `pi/settings.work.json` → `~/.pi/work/settings.json`
- `pi/settings.personal.json` → `~/.pi/personal/settings.json`
- `pi/settings.work.json` → `~/.pi/agent/settings.json` (shared backing store / compatibility root)

The tracked files are managed baselines rather than direct symlink targets. Pi writes
interactive model choices and changelog state back to each profile's runtime file;
keeping that file outside Git avoids dirtying the dotfiles worktree whenever a model
changes. Installer runs refresh repo-managed settings while preserving
`defaultProvider`, `defaultModel`, `defaultThinkingLevel`, `lastChangelogVersion`, and
Pi's generated `trackingId`. Edit the tracked baseline for durable non-runtime
configuration; use Pi normally for per-profile model changes.

Shared global Pi runtime resources are projected once, then shared into both active
profiles:

- `~/.pi/agent/AGENTS.md` → canonical assembled Pi instructions
- `~/.pi/work/AGENTS.md` → symlink to shared Pi instructions
- `~/.pi/personal/AGENTS.md` → symlink to shared Pi instructions
- `~/.pi/agent/agents/` → canonical assembled/symlinked Pi agent defs
- `~/.pi/work/agents` → symlink to shared Pi agents
- `~/.pi/personal/agents` → symlink to shared Pi agents

Tracked baseline defaults:

- **Work profile**: OpenAI `gpt-5.5` via API key
- **Personal profile**: OpenAI Codex `gpt-5.5` via OAuth subscription
- **Theme**: Gruvbox Light
- **Skills**: Discovers Pi-projected shared skills from `~/.dotfiles/.ai-runtime/pi/skills/` plus tldraw offline's app-managed skill at `~/skills/tldraw-offline` when installed; missing external skill paths are harmless
- **Instructions**: `ai/install.sh` assembles one shared Pi instruction file, then symlinks it into both profiles
- **Agents**: `ai/install.sh` assembles one shared Pi agent dir, then symlinks it into both profiles
- **Packages**: vendored pi-exa, pi-parallel, vendored pi-openai-fast, vendored pi-subagents, and mitsupi

In normal use there is no standalone user-facing top-level Pi profile: `pi` dispatches to
either `pi-work` or `pi-personal`. The `~/.pi/agent/` tree is kept as the shared backing
store for global Pi instructions/agents and for compatibility with raw `~/.bun/bin/pi`
usage.

### Subagent model routing

Subagents follow the active parent profile: `pi-personal` children use `openai-codex`
with the personal OAuth subscription, while `pi-work` children use `openai` with the
work API key. Both profiles apply the same cost-aware GPT-5.6 builtin overrides:

| Agent | Model | Thinking |
|---|---|---|
| `scout` | GPT-5.6 Luna | high |
| `context-builder` | GPT-5.6 Terra | high |
| `worker` | GPT-5.6 Terra | high |
| `planner` | GPT-5.6 Terra | max |
| `reviewer` | GPT-5.6 Terra | max |
| `oracle` | GPT-5.6 Terra | max |

The user-scoped `researcher` definition shadows the builtin and therefore declares the provider-neutral `gpt-5.6-terra` tier with high thinking directly in `pi/agents/researcher.md`; pi-subagents resolves it against the active profile provider. `delegate` continues to inherit its parent model. GPT-5.6 Sol remains an opt-in interactive profile choice rather than a tracked baseline; selecting it in Pi persists it in the writable runtime settings. Ultra remains an opt-in multi-agent mode rather than a Pi thinking level.

## Extensions

Extensions are TypeScript files using Pi's `ExtensionAPI`. Symlinked into each active
profile's `extensions/` directory by `install.sh`.

### notify.ts — Desktop Notifications

Sends OSC 777 escape sequence on `agent_end` event. Shows a desktop notification with the last assistant message summary when Pi finishes a turn. It skips OSC notifications inside Herdr because Herdr tracks agent state and notifications there.

For Herdr-native Pi state reporting, install Herdr's official integration per active profile after `herdr` is available:

```bash
PI_CODING_AGENT_DIR="$HOME/.pi/work" herdr integration install pi
PI_CODING_AGENT_DIR="$HOME/.pi/personal" herdr integration install pi
```

**Supported terminals**: WezTerm, Ghostty, iTerm2

### Provided by mitsupi

The `npm:mitsupi` package provides additional extensions including `uv.ts` (Python tooling interceptor), `answer.ts`, `review.ts`, `todos.ts`, `files.ts`, and more. These are installed automatically via `pi install npm:mitsupi`.

## Intercepted Commands

Shell shims in `pi/intercepted-commands/` that print helpful error messages redirecting to uv. Used by mitsupi's `uv.ts` extension which prepends intercepted-commands to PATH within Pi's bash tool.

**Note**: mitsupi bundles its own intercepted-commands, so these local shims serve as fallbacks and are available for non-Pi agents.

## Skill Collisions

Some shared skills (`commit`, `uv`, `web-browser`) intentionally collide with mitsupi's bundled copies. Pi prefers mitsupi's versions for those names.

Two other mitsupi collisions are intentionally filtered out in both profile settings files: `librarian` so Pi loads this repo's projected Pi-specific variant, and `frontend-design` so the older bundled design skill does not compete with the canonical `/impeccable` 3.x workflow.

## Packages

Pi packages loaded by this setup:

| Package | Provides |
|---|---|
| `pi/packages/pi-exa` | Local Exa search tool (`exa_search`; depends on private `EXA_API_KEY`) |
| `pi/packages/pi-parallel` | Local vendored Parallel tools (`web_search`, `web_fetch`, `deep_research`, `batch_enrich`; Turbo is the default search mode; depends on standalone `parallel-cli`) |
| `pi/packages/pi-openai-fast` | Local vendored `/fast` toggle that sets OpenAI `service_tier=priority` on configured GPT-5.4, GPT-5.5, and GPT-5.6 Luna/Terra/Sol models |
| `pi/packages/pi-subagents` | Local vendored subagent delegation tools, builtin child agents, chains, and parallel runs |
| `mitsupi` | /answer, /review, /todos, /files, /context, uv interceptor |
