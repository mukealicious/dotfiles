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

`bin/pi` is the sole launch dispatcher. It keeps a recognized inherited
`PI_CODING_AGENT_DIR`, otherwise recognizes work/personal `--session PATH` and
`--session=PATH` values before using `PI_DEFAULT_PROFILE`. A session from the
other profile fails rather than opening it under the wrong profile. Fish delegates
to this wrapper; `pi-work` and `pi-personal` select their named profile directly.
All three supported launch commands set `GIT_EDITOR=true`,
`GIT_SEQUENCE_EDITOR=true`, and `GIT_MERGE_AUTOEDIT=no` only for Pi's child
process, leaving the interactive shell's Git editor configuration unchanged.

### Profile-boundary evidence

D10 verification is read-only and makes no model calls or cleanup changes:

```bash
~/.dotfiles/bin/pi-profile-check --json > /tmp/pi-profile-boundary.json
```

It runs `pi auth check --no-refresh` for work and personal, checks provider and
profile selection, summarizes profile-owned state and required resources, checks
profile-scoped Herdr integrations, and classifies the deprecated fallback by
category, count, and aggregate size. It never prints credentials or fallback
entry names. A non-zero result is a blocker or manual-review report; inspect the
JSON before issuing the reported manual deletion command. The command never
creates, backs up, migrates, or deletes `~/.pi/agent`.

## Directory Structure

```
pi/
├── agents/                 # Pi agent metadata assembled with shared agent bodies
│   └── review.frontmatter  # Shared-body review exemplar
├── settings.work.json      # Work profile config baseline (OpenAI API key flow)
├── settings.personal.json  # Personal profile config baseline (OpenAI Codex OAuth flow)
├── modes.personal.json     # Personal Mitsupi capability-depth mode baseline
├── install.sh              # Materializes settings/modes, symlinks resources, installs packages
├── patches/                 # Exact-context local patches for pinned Pi packages
├── aliases.fish            # Thin Fish forwarding to bin/pi
├── extensions/             # Custom TypeScript extensions
│   ├── handoff.ts          # Same-process temporary conversation handoff
│   ├── notify.ts           # Non-Herdr OSC notification fallback
│   └── usage-footer.ts      # Token, model, and Codex subscription usage footer
├── intercepted-commands/   # Shell shims for Python tooling
│   ├── pip                # → uv add / uv run --with
│   ├── pip3               # → uv add / uv run --with
│   ├── poetry             # → uv init / uv add / uv sync / uv run
│   ├── python             # → uv run python (blocks -m pip, -m venv)
│   └── python3            # → uv run python (blocks -m pip, -m venv)
└── themes/
    ├── gruvbox-dark.json   # Selected custom color theme
    └── gruvbox-light.json  # Alternate custom color theme
```

## Configuration

Profile settings and personal Mitsupi modes are materialized as writable runtime
files by `install.sh`:

- `pi/settings.work.json` → `~/.pi/work/settings.json`
- `pi/settings.personal.json` → `~/.pi/personal/settings.json`
- `pi/modes.personal.json` → `~/.pi/personal/modes.json`

The tracked files are managed baselines rather than direct symlink targets. Pi writes
interactive model choices and changelog state back to each profile's runtime file;
keeping that file outside Git avoids dirtying the dotfiles worktree whenever a model
changes. Installer runs preserve `lastChangelogVersion` and Pi's generated
`trackingId`. Work also preserves `defaultProvider`, `defaultModel`, and
`defaultThinkingLevel`; personal restores these startup settings from the tracked
baseline so fresh launches start in `default` mode (Astra/medium). Explicit CLI
model/thinking options and resumed sessions still take precedence. Interactive
mode changes remain available; saved startup overrides last until the next install.
Edit the tracked baseline for durable configuration changes.

The tracked personal modes baseline is authoritative and installer runs restore
these capability-depth mappings. Explicit border colors identify modes independently
of their thinking levels:

| Mode | Model | Thinking | Border |
|---|---|---|---|
| `light` | `openai-codex/gpt-5.6-luna` | `max` | blue (`thinkingLow`) |
| `standard` | `openai-codex/gpt-5.6-sol` | `medium` | aqua (`thinkingMedium`) |
| `default` | `openai-codex/gpt-6-astra` | `medium` | purple (`thinkingHigh`) |
| `deep` | `openai-codex/gpt-6-astra` | `high` | red (`thinkingXhigh`) |

Mitsupi can write temporary adjustments through `/mode` because the runtime file
is a regular file rather than a Git symlink. Edit `pi/modes.personal.json` for a
durable change; the next installer run replaces runtime adjustments with the
tracked baseline. Run `/reload` in an existing Pi session after installing or
changing the baseline. Work-profile modes remain unconfigured until a separate
provider/model mapping is approved.

Shared Pi resources are staged and validated under `.ai-runtime/pi/` before they
replace the active generated tree. Both active profiles then link their
`AGENTS.md` files to the generated instruction, while retaining separate real
`agents/` directories. Managed agent files link individually to the generated
agents; custom agents and chains remain in their owning profile.

Tracked baseline defaults:

- **Work profile**: OpenAI `gpt-5.5` via API key
- **Personal profile**: OpenAI Codex `gpt-6-astra` at medium thinking via OAuth subscription
- **Personal modes**: Luna/max, Sol/medium, Astra/medium, and Astra/high under
  `light`, `standard`, `default`, and `deep`
- **Themes**: Gruvbox Dark (selected) and Gruvbox Light (available)
- **Skills**: Discovers Pi-projected shared skills from `~/.dotfiles/.ai-runtime/pi/skills/` plus tldraw offline's app-managed skill at `~/skills/tldraw-offline` when installed; missing external skill paths are harmless
- **Instructions**: `ai/install.sh` stages `.ai-runtime/pi/AGENTS.md`, validates it, then links it into both profiles
- **Agents**: `ai/install.sh` stages `.ai-runtime/pi/agents/`, validates it, then links managed files into each profile-local agent directory
- **Packages**: vendored pi-exa, pi-parallel, vendored pi-openai-fast, vendored pi-subagents, and mitsupi

In normal use there is no standalone user-facing top-level Pi profile: `pi` dispatches to
either `pi-work` or `pi-personal`. The deprecated `~/.pi/agent/` fallback is not managed
or read by local installers; exact legacy resource links are migrated during the cutover,
while the directory itself is left untouched for manual deletion after later verification.

### Subagent model routing

Subagents resolve bare model IDs through the active parent profile: `pi-personal`
children use `openai-codex` with the personal OAuth subscription, while `pi-work`
children use `openai` with the work API key.

| Role | Model | Thinking |
|---|---|---|
| `scout` | GPT-5.6 Luna | high |
| `researcher` | GPT-5.6 Terra | high |
| `worker` | GPT-5.6 Luna | max |
| `review` | GPT-5.6 Sol | xhigh |

The package retains only builtin scout, researcher, and worker. The generated shared
`review` agent is canonical. Scout and review are read-only leaves; researcher is a
web/evidence leaf; worker is the only default delegated checkout writer. Profile
settings do not override these role defaults.

### Workflow boundaries

- Use Pi `/tree` to inspect history, recover context, or deliberately revisit an alternative branch. It is not a required step between handoffs.
- Use `pi-subagents` for bounded independent reconnaissance, research, implementation,
  or review work; the parent keeps decisions, integration, and validation.
- Use a Herdr worktree for concurrent filesystem isolation and Hunk review; it is
  not another delegation or lifecycle owner.
- Use `/fork` or `/clone` for a separate session when history or provider state
  should diverge.
- Use `/skill:code-review` for proportional advisory review and Hunk for user-facing
  annotations. Mitsupi `/review` remains an optional manual tree-isolated experiment,
  not an automatic sequel.
- Use `/handoff` for temporary same-process continuation context: it writes the
  handoff outside the checkout, summarizes the active branch through internal tree
  navigation, and automatically continues without selecting a new profile or
  spawning a child. Repeat `/handoff` directly at later phase boundaries; prior
  summaries are included in the next summary, not guaranteed to remain verbatim.
- `/skill:grilling`, `/skill:grill-me`, `/skill:grill-with-docs`, `/skill:tdd`,
  `/skill:implement`, and `/skill:bro` are composable workflows. `implement` and
  `bro` are manual-only; implementation stays in the current session, does not
  auto-delegate, and does not commit without a separate request.

## Extensions

Extensions are TypeScript files using Pi's `ExtensionAPI`. Symlinked into each active
profile's `extensions/` directory by `install.sh`.

### handoff.ts — Conversation Handoffs

Registers `/handoff [focus]`. The command invokes the manual-only shared handoff
skill, waits for its agent turn, preserves the source JSONL branch, navigates back
to the first user message with `summarize: true`, and continues automatically from
the temporary handoff. Repeating `/handoff` summarizes the active branch, including
its earlier summaries; they need not remain verbatim. No manual `/tree` navigation
is needed between phases.

A compact widget above the editor shows document writing, summarization/tree
switching, and continuation startup with elapsed time. Stages advance only on
observed lifecycle boundaries; Pi exposes summarization and switching as one
operation. The widget survives tree redraw and clears when a receipt is recorded.

`handoff source` and `handoff resume ← <source ID>` labels make both branches easy
to find in `/tree` (including its labeled-only filter). Existing source labels are
preserved. A persistent, expandable receipt records source/resume IDs, timestamps,
outcome, and recovery details without adding anything to model context. Progress
checkpoints also survive reload; an unfinished transaction is reported as
interrupted, never automatically retried.

**“Continuation started” is not document acceptance or completed work.** It requires
the continuation prompt's observed agent start, not merely submission. The command
does not independently verify the artifact path or its acceptance; find the path
in the source turn or branch summary. `/handoff history` is deferred.

Cancellation, errors, or runtime shutdown retain source history and temporary
files, with the last observed stage in the receipt. Startup has a 30-second timeout;
document writing and summarization use Pi's existing cancellation behavior. The
command clears only the prompt restored by navigation and restores a preexisting
draft if that prompt replaced it, without overwriting newly typed text.

The handoff stays in the current Pi/Herdr process, so its active profile, working
directory, pane identity, and Git state carry through naturally. Specs and other
durable project records remain separate from temporary handoffs and Moja Glava
checkpoints.

### notify.ts — Desktop Notifications

Sends OSC 777 escape sequence on `agent_end` event. Shows a desktop notification with the last assistant message summary when Pi finishes a turn. It skips OSC notifications inside Herdr because Herdr tracks agent state and notifications there.

For Herdr-native Pi state reporting, install Herdr's official integration per active profile after `herdr` is available:

```bash
PI_CODING_AGENT_DIR="$HOME/.pi/work" herdr integration install pi
PI_CODING_AGENT_DIR="$HOME/.pi/personal" herdr integration install pi
```

**Supported terminals**: WezTerm, Ghostty, iTerm2

### usage-footer.ts — Usage Footer

Adds model/provider, token-total, context-window, and cost information to Pi's
footer. When the active model uses `openai-codex`, it also fetches the ChatGPT
five-hour and weekly subscription windows; other providers do not trigger that
request. `/usage` shows the same subscription details on demand.

### Provided by Mitsupi

Both profile settings pin `npm:mitsupi@1.6.0` and use positive resource
allowlists. The enabled extensions are `answer.ts`, `context.ts`, `files.ts`,
`multi-edit.ts`, `prompt-editor.ts`, `todos.ts`, `uv.ts`, `whimsical.ts`,
`btw.ts`, and `review.ts`; the enabled skills are `apple-mail`, `commit`,
`github`, `google-workspace`, `mermaid`, `pi-share`, `sentry`, `summarize`,
and `uv`. Mitsupi prompts and themes are disabled. The package remains fully
installed so retained resources can use internal files, but filtered resources
such as `notify.ts`, `control.ts`, `session-breakdown.ts`, and `loop.ts` are not
Pi-visible. `/btw` and `/review` are manual trials; `/loop` is unavailable.
Start `/review` from an empty tree branch with automatic fixing disabled, then
return through `/end-review` with a summary or an explicit fix prompt. `/btw`
is for non-mutating tangents; its in-memory child is not separately visible to
Herdr, so the pane may appear idle and no separate completion toast is expected.

`pi/install.sh` applies the tracked prompt-editor and files-shortcut patches
only after both profile copies pass the exact version/context preflight. The
prompt-editor patch adds Pi's native `max` thinking level to Mitsupi's mode
editor, adapts its model picker and theme lifetime to the current Pi runtime
contract, keeps mode-border colors stable across later renders, and keeps a
fresh profile's required `default` mode from creating a latency-named `fast`
mode. The files-shortcut patch removes Mitsupi's `Ctrl+Shift+F` Finder reveal
binding so Pi retains its built-in transcript search; `/files` and the other
Mitsupi file shortcuts remain available. The installer materializes the tracked
`pi/modes.personal.json` mapping into the personal profile; `/mode` remains the
manual selector and `/fast` remains the independent `pi-openai-fast`
service-tier toggle.

The filtered Mitsupi surface includes `control.ts`, `go-to-bed.ts`, `loop.ts`,
`notify.ts`, `session-breakdown.ts`, `split-fork.ts`, the `anachb`,
`frontend-design`, `ghidra`, `librarian`, `native-web-search`, `oebb-scotty`,
`openscad`, `tmux`, `update-changelog`, and `web-browser` skills, and the
`nightowl` theme. Local `pi/extensions/notify.ts` is the sole non-Herdr OSC
fallback and suppresses itself when `HERDR_ENV=1`.

## Intercepted Commands

Shell shims in `pi/intercepted-commands/` that print helpful error messages redirecting to uv. Used by mitsupi's `uv.ts` extension which prepends intercepted-commands to PATH within Pi's bash tool.

**Note**: mitsupi bundles its own intercepted-commands, so these local shims serve as fallbacks and are available for non-Pi agents.

## Packages

Pi packages loaded by this setup:

| Package | Provides |
|---|---|
| `pi/packages/pi-exa` | Local Exa search tool (`exa_search`; depends on private `EXA_API_KEY`) |
| `pi/packages/pi-parallel` | Local vendored Parallel tools (`web_search`, `web_fetch`, `deep_research`, `batch_enrich`; Turbo is the default search mode; depends on standalone `parallel-cli`) |
| `pi/packages/pi-openai-fast` | Local vendored `/fast` toggle that sets OpenAI `service_tier=priority` on configured GPT-5.4, GPT-5.5, GPT-5.6 Luna/Terra/Sol, and Codex GPT-6 Astra models |
| `pi/packages/pi-subagents` | Local vendored subagent delegation tools, builtin child agents, chains, and parallel runs |
| `mitsupi@1.6.0` | Curated `/answer`, `/context`, `/files`, `/multi-edit`, `/prompt-editor`, `/todos`, `/uv`, `/whimsical`, manual `/btw` and `/review`, plus the nine allowlisted skills |
