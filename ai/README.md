# AI Tools Configuration

Manages AI tool configuration, shared skills, and harness-aware instruction assembly.

## Architecture

Skill authoring and runtime discovery are separate concerns.

### Authoring directories

Skills live in three source locations based on portability:

| Location | Standard | Works With | When To Use |
|---|---|---|---|
| `ai/skills/` | [Agent Skills Standard](https://agentskills.io) | All agents (Claude, Pi, OpenCode, Codex) | Default — instruction-only or standard scripts |
| `claude/skills/` | Claude Code conventions | Claude Code only | Needs `$SKILL_DIR`, subagents, hooks, or plugins |
| `pi/extensions/` | Pi TypeScript API | Pi only | Needs Pi TUI API, tool wrapping, or lifecycle hooks |

### Runtime projections

Portable skills are authored once in `ai/skills/`. `ai/install.sh` refreshes the runtime-facing directories that consume that source:

- `.ai-runtime/codex/skills/` — repo-local Codex-style projected shared skills
- `.ai-runtime/claude-code/skills/` — repo-local Claude-projected shared skills
- `.ai-runtime/opencode/skills/` — repo-local OpenCode-projected shared skills
- `.ai-runtime/pi/skills/` — repo-local Pi-projected shared skills
- `.agents/skills/` — repo-local Codex-style runtime symlink projection of portable skills
- `.claude/skills/` — repo-local Claude-style runtime symlink projection of portable skills plus Claude-only overlays
- `~/.claude/skills/` — user-level Claude install
- `~/.config/opencode/skill/` — user-level OpenCode install
- Pi discovers `.ai-runtime/pi/skills/` via per-profile `settings.json`

Do not author shared skills in `.agents/skills/` or `.claude/skills/`; they are installer-managed runtime outputs.
Do not author projected files under `.ai-runtime/`; they are rebuilt by `ai/install.sh`.

### Upstream Provenance and Review

This repo keeps upstream context close to the local artifact, then uses an optional batch review when needed:

`provenance -> optional review -> manual adopt`

- `metadata.watch-sources` links frontmatter-friendly files to upstream inspiration or pinned source refs
- `VENDORED_FROM.md` links vendored directories and packages to their upstream source
- `ai/watchlist.toml` defines which GitHub repos and paths are worth checking as a batch
- `bin/ai-watch` collects read-only upstream facts and links them to local artifacts
- `ai/skills/upstream-review/` interprets direct provenance or watchlist reports and ranks whether upstream changes are worth adopting or adapting

The review system is intentionally manual: no auto-install, no auto-sync, no background polling.

### Retained upstream sources

Some shared skills are intentionally adapted from reviewed upstream snapshots.
The finite D6 source/SHA/disposition record is
[`specs/pi-profile-and-skill-simplification-D6-retained-skill-audit.md`](../specs/pi-profile-and-skill-simplification-D6-retained-skill-audit.md).
This document and the metadata beside each skill are provenance records, not an
auto-sync mechanism.

| Upstream | Local scope | Ownership |
|---|---|---|
| `dmmulroy/.dotfiles@f9f7aa1a3638d6bfb6fa0b94fd110185534a2895` | `grilling`, `domain-modeling`, `tdd`, `implement`, `bro` | Grilling, domain docs, TDD, manual implementation, and plain-language restatement |
| `mattpocock/skills@9c9f36ccd3995266cd675468af71639c8dde1ec5` | `codebase-design`, thin `grill-me`, thin `grill-with-docs` | Deep-module/interface vocabulary and manual entry-point provenance |
| `rjs/shaping-skills@d8b65d7733c71e9bf436f0c2e4da60e5214a96d9` | `framing-doc`, `kickoff-doc`, `breadboarding` | Framing, shaped kickoff territory, and breadboarding |
| `pbakaus/impeccable@39bec7c08c8cb5d694221e2c2e4386140dde8759` | `impeccable` | Product UI/UX and visual interaction design |
| `plannotator/effective-html`, `ThariqS/html-effectiveness` | `visual-deliverables` | Self-contained HTML/SVG explainers and curated examples |
| Pinned maintenance/research influences | `post-mortem`, `production-readiness`, `tufte-data-viz`, `herdr`, `hunk-review` | Retrospectives, production risk, quantitative visualization, Herdr, and Hunk |

Rules for retained upstreams:

- keep the shared source in `ai/skills/` as close to the reviewed source as practical;
- use `metadata.watch-sources` and `VENDORED_FROM.md` for exact provenance, with `ai/watchlist.toml` for optional manual drift review;
- resolve provider-specific placeholders during projection, not by editing the source to one harness;
- adopt only an explicitly reviewed snapshot or local owner-boundary adaptation; never auto-sync current upstream.

#### Adding upstream provenance or a watched source

If the source maps to one local file, add `metadata.watch-sources` to that file's
frontmatter. If it maps to a vendored directory, add or update that directory's
`VENDORED_FROM.md`. If it belongs in batch review, add one narrow `[[sources]]`
entry to `ai/watchlist.toml` and verify it with `bin/ai-watch --source <id>`.

The same rule applies to assembled agent runtime files under `~/.claude/agents/`
and managed links in each Pi profile: edit split source files in the repo, not
installed outputs.

### Shared Instructions

Instructions now use the same shared-vs-adapter split as the skill system:

- `ai/instructions/base.md` is the shared source of truth for portable guidance.
- `claude/instructions/appendix.md`, `pi/instructions/appendix.md`, and `opencode/instructions/appendix.md` add only harness-specific behavior.
- `ai/install.sh` assembles the final installed files each harness expects.

Current install targets:

| Installed file | Composition |
|---|---|
| `~/.claude/CLAUDE.md` | `ai/instructions/base.md` + `claude/instructions/appendix.md` |
| `.ai-runtime/pi/AGENTS.md` | `ai/instructions/base.md` + `pi/instructions/appendix.md` |
| `~/.pi/work/AGENTS.md` | symlink → `.ai-runtime/pi/AGENTS.md` |
| `~/.pi/personal/AGENTS.md` | symlink → `.ai-runtime/pi/AGENTS.md` |
| `~/.config/opencode/AGENTS.md` | `ai/instructions/base.md` + `opencode/instructions/appendix.md` |
| `~/.codex/instructions.md` | `ai/instructions/base.md` |
| `~/.gemini/GEMINI.md` | `ai/instructions/base.md` |
| `~/.AGENTS.md` | `ai/instructions/base.md` compatibility output |

Composition rule: keep the shared base strong, keep appendices short and additive, and keep provider or model specifics out of the shared file.

### Shared Agents

Harness-native agents are optional. The primary cross-harness portability story in this repo is shared instructions plus shared skills.

When a harness genuinely benefits from named agents with specific metadata, use the shared-core pattern validated by the low-risk `review` exemplar:

- `ai/agents/*.body.md` holds the neutral role/task body.
- `claude/agents/*.frontmatter` and `pi/agents/*.frontmatter` hold harness-specific metadata.
- `ai/install.sh` assembles the runtime agent files each harness expects.

Agent Assembly Status:

| Capability | Shared source | Harness metadata | Installed outputs |
|---|---|---|---|
| `review` | `ai/agents/review.body.md` | `claude/agents/review.frontmatter`, `pi/agents/review.frontmatter` | `~/.claude/agents/review.md`, `.ai-runtime/pi/agents/review.md`, and managed links in each Pi profile |

`oracle` and `librarian` remain legacy combined Claude agent files for now. The repo is intentionally hybrid, and more agent migrations are optional rather than the default direction.

### Shared Skills (`ai/skills/`)

Follow the [Agent Skills Standard](https://agentskills.io):
- YAML frontmatter (`name`, `description`) + Markdown body
- No `$SKILL_DIR` — agent resolves paths from SKILL.md parent directory
- Scripts accessed via shell commands relative to skill location
- Validated with `skills-ref validate <path>`
- Authored once in `ai/skills/`, then projected into runtime directories as needed

`ai/install.sh` projects shared `ai/skills/` sources into provider-aware runtime outputs under `.ai-runtime/`, refreshes `.agents/skills/` and `.claude/skills/` inside the repo from those projections, installs the resulting skill sources into `~/.claude/skills/` and `~/.config/opencode/skill/`, and points Pi at `.ai-runtime/pi/skills/` via the `"skills"` path in `settings.json`.

### Claude-Specific Skills (`claude/skills/`)

May use Claude Code extensions beyond the standard:
- `$SKILL_DIR` variable for script paths
- Claude subagent delegation
- PreToolUse/PostToolUse hooks
- Plugin dependencies

### Pi Extensions (`pi/extensions/`)

TypeScript extensions using Pi's TUI API:
- Tool wrapping (intercept/modify tool calls)
- Desktop notifications
- Custom UI integration

### Dependencies in Shared Skills

**Strategy: zero install-time dependencies; prefer built-in runtimes.**

Skills with scripts should use Node/Bun built-in APIs (WebSocket, fs, path, child_process, etc.) or shell commands. No per-skill `package.json` or install step unless explicitly documented.

- **Node and Bun** are already toolchain prerequisites
- Bun provides built-in WebSocket, HTTP server, file I/O — covers most local tooling needs
- Vendored upstream skills may use `node` scripts when that is how upstream ships them
- If a skill truly needs npm packages, add an explicit install step to `ai/install.sh` for that skill dir

### Decision Framework

**Start in `ai/skills/`** unless you need a harness-specific feature:

1. Does it need Claude-only runtime behavior such as `$SKILL_DIR`, subagents, hooks, or plugins? → `claude/skills/`
2. Does it need Pi's TypeScript TUI API? → `pi/extensions/`
3. Otherwise → `ai/skills/`

### Shared vs Adapter Rule

Keep the skill in `ai/skills/` when the core workflow works without harness-native primitives. Add a harness-specific overlay only when it contributes small, optional runtime glue rather than a second copy of the core instructions.

If the shared skill stands on its own, keep one owner instead of preserving
near-duplicate wrappers. `grilling` owns reusable questioning; `grill-me` and
`grill-with-docs` are thin manual entry points. `codebase-design` owns structural
and interface language; TDD consults it only when interface shape is genuinely
uncertain.

## Skill Inventory

### Retained shared skills

| Skill | Owner / purpose |
|---|---|
| `agent-context` | Repo-local `AGENTS.md` guidance |
| `breadboarding` | Workflow places, affordances, stores, and wiring |
| `bro` | Manual plain-language restatement |
| `build-skill` | `SKILL.md` authoring and validation |
| `code-review` | Proportional advisory review and final-pass cleanup |
| `codebase-design` | Deep modules, interfaces, seams, locality, and testability |
| `domain-modeling` | Domain terminology, `CONTEXT.md`, and qualifying ADRs |
| `dotfiles-dev` | Dotfiles implementation conventions |
| `framing-doc` / `kickoff-doc` | Evidence-grounded framing and shaped kickoff territory |
| `flares` | Cloudflare-native mini-apps and thin AI-client guidance |
| `grill-me` / `grill-with-docs` | Thin manual entries into grilling and domain modeling |
| `grilling` | Dependency-aware design-tree questioning |
| `herdr` | Herdr pane/workspace/agent coordination |
| `hunk-review` | Hunk diff and comment workflow |
| `implement` | Manual current-session implementation |
| `librarian` / `opensrc` | External code discovery and source-backed investigation |
| `moja-glava` | Durable private knowledge checkpoints |
| `post-mortem` | Session lessons and agent-context improvements |
| `production-readiness` | Service, data, deployment, and reliability risk |
| `qmd` / `surf-browser` | Local Markdown search and authenticated browsing |
| `tdd` | Red/green vertical slices and public-behavior tests |
| `tufte-data-viz` | Quantitative visualization judgment |
| `upstream-review` | Manual provenance and adoption decisions |
| `visual-deliverables` | Self-contained HTML/SVG explainers |

`framing-doc` and `kickoff-doc` remain distinct: framing captures the evidence
grounded “why” before shaping; kickoff records builder-facing shaped territory
after shaping.

### One-owner capability boundaries

- **Visual:** `impeccable` owns product UI/UX; `tufte-data-viz` owns quantitative
  graphics; `visual-deliverables` owns self-contained HTML/SVG explainers;
  Mermaid owns text-native diagrams; `tldraw-offline` owns the editable local canvas.
- **Research:** `researcher` gathers delegated evidence; `qmd` searches local
  Markdown; `opensrc` acquires snapshots; `librarian` analyzes external code;
  `summarize` ingests documents; `surf-browser` operates authenticated browsing.
- **Maintenance:** `upstream-review` decides adoption; `post-mortem` identifies
  lessons; `agent-context` owns `AGENTS.md`; `build-skill` owns `SKILL.md`;
  `dotfiles-dev` owns repository conventions; `hunk-review` owns Hunk annotations.

### Claude-Specific (`claude/skills/`)

Currently empty. Shared skills are projected here at runtime by `ai/install.sh`. Use this directory only for skills that require Claude-native features (hooks, `$SKILL_DIR`, subagent delegation).

### Pi Extensions (`pi/extensions/`)

Custom extensions symlinked by `pi/install.sh`. Third-party extensions installed via packages:

| Extension | Type | Description |
|---|---|---|
| `notify.ts` | Lifecycle hook | Desktop notification via OSC 777 on agent completion (WezTerm) |

| Package | Source | Provides |
|---|---|---|
| `npm:mitsupi@1.6.0` | Armin Ronacher | Curated `/answer`, `/context`, `/files`, `/multi-edit`, `/prompt-editor`, `/todos`, `/uv`, `/whimsical`, manual `/btw` and `/review`, plus the nine allowlisted skills; prompts/themes disabled |

### Intercepted Commands (`pi/intercepted-commands/`)

Shell shims that intercept common Python tooling and redirect to uv equivalents. Used by mitsupi's `uv.ts` extension. Also available for non-Pi agents.

| Command | Behavior |
|---|---|
| `pip`, `pip3` | Blocked — suggests `uv add` or `uv run --with` |
| `poetry` | Blocked — suggests `uv init`, `uv add`, `uv sync`, `uv run` |
| `python`, `python3` | Redirects to `uv run python` (blocks `-m pip` and `-m venv`) |

## Available AI Tools

### Claude CLI (claude)
- **Provider**: Anthropic
- **Usage**: Anthropic-native coding assistant when Claude-specific hooks, subagents, or MCP workflows are the best fit
- **Aliases**: cl, clc, clr, yolo, ask
- **Instruction File**: `~/.claude/CLAUDE.md` (assembled from shared base + Claude appendix)
- **Project Skills**: `.claude/skills/` (installer-managed runtime projection)
- **Global Skills**: `~/.claude/skills/`

### Codex CLI (codex)
- **Provider**: OpenAI
- **Usage**: OpenAI-native coding assistant with projected shared skills and model-neutral repo guidance
- **Instruction File**: `~/.codex/instructions.md` (assembled from shared base)
- **Project Skills**: `.agents/skills/` (installer-managed runtime projection)

### OpenCode CLI (opencode)
- **Provider**: OpenAI
- **API Key**: `OPENAI_API_KEY` in `~/.config/fish/local.fish`
- **Config**: `~/.config/opencode/.opencode.json`
- **TUI Config**: `~/.config/opencode/tui.json` (symlinked from `opencode/tui.json`)
- **Custom Themes**: `~/.config/opencode/themes/` (managed from `opencode/themes/`)
- **Instruction File**: `~/.config/opencode/AGENTS.md` (assembled from shared base + OpenCode appendix)

### Gemini CLI (gemini)
- **Provider**: Google
- **Instruction File**: `~/.gemini/GEMINI.md` (assembled from shared base)

### Pi Coding Agent (pi)
- **Provider**: Anthropic (via @earendil-works/pi-coding-agent)
- **Profiles**: `pi-work` and `pi-personal` — `pi` dispatches based on `PI_DEFAULT_PROFILE`
- **Config**: tracked `pi/settings.{work,personal}.json` baselines are materialized into writable profile settings so Pi can persist model changes without dirtying Git
- **Instruction File**: `.ai-runtime/pi/AGENTS.md` (assembled), linked into both profiles
- **Agents**: `.ai-runtime/pi/agents/` (assembled), linked file-by-file into each real profile-local `agents/` directory; custom agents and chains remain profile-local
- **Aliases**: `pi-work-print`, `pi-personal-print`

## Instruction Composition

`ai/install.sh` now materializes harness-specific instruction files instead of symlinking every tool to one shared prompt.

- Shared guidance lives in `ai/instructions/base.md`.
- Harness-specific policy lives in a tiny appendix only when a harness genuinely needs it.
- Codex and Gemini currently use the shared base without an extra appendix.
- `~/.AGENTS.md` remains as a base-only compatibility output, not the source of truth.

## Setup

Run automatically by `script/install`, or manually:
```bash
~/.dotfiles/ai/install.sh
```
