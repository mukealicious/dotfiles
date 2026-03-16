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

- `.agents/skills/` — repo-local Codex-style runtime projection of portable skills
- `.claude/skills/` — repo-local Claude-style runtime projection of portable skills plus Claude-only overlays
- `~/.claude/skills/` — user-level Claude install
- `~/.config/opencode/skill/` — user-level OpenCode install
- Pi discovers `ai/skills/` directly via `pi/settings.json`

Do not author shared skills in `.agents/skills/` or `.claude/skills/`; they are installer-managed runtime outputs.

The same rule now applies to assembled agent runtime files under `~/.claude/agents/` and `~/.pi/agent/agents/`: edit the split source files in the repo, not the installed outputs.

### Shared Instructions

Instructions now use the same shared-vs-adapter split as the skill system:

- `ai/instructions/base.md` is the shared source of truth for portable guidance.
- `claude/instructions/appendix.md`, `pi/instructions/appendix.md`, and `opencode/instructions/appendix.md` add only harness-specific behavior.
- `ai/install.sh` assembles the final installed files each harness expects.

Current install targets:

| Installed file | Composition |
|---|---|
| `~/.claude/CLAUDE.md` | `ai/instructions/base.md` + `claude/instructions/appendix.md` |
| `~/.pi/agent/AGENTS.md` | `ai/instructions/base.md` + `pi/instructions/appendix.md` |
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
| `review` | `ai/agents/review.body.md` | `claude/agents/review.frontmatter`, `pi/agents/review.frontmatter` | `~/.claude/agents/review.md`, `~/.pi/agent/agents/review.md` |

`oracle` and `librarian` remain legacy combined Claude agent files for now. The repo is intentionally hybrid, and more agent migrations are optional rather than the default direction.

### Shared Skills (`ai/skills/`)

Follow the [Agent Skills Standard](https://agentskills.io):
- YAML frontmatter (`name`, `description`) + Markdown body
- No `$SKILL_DIR` — agent resolves paths from SKILL.md parent directory
- Scripts accessed via shell commands relative to skill location
- Validated with `skills-ref validate <path>`
- Authored once in `ai/skills/`, then projected into runtime directories as needed

`ai/install.sh` refreshes `.agents/skills/` and `.claude/skills/` inside the repo, installs the resulting skill sources into `~/.claude/skills/` and `~/.config/opencode/skill/`, and leaves Pi to discover shared skills directly via the `"skills"` path in `settings.json`.

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

**Strategy: Bun-native, zero external dependencies.**

Skills with scripts must use only Bun built-in APIs (WebSocket, fs, path, child_process, etc.) or shell commands. No `package.json` or `npm install` required.

- **Bun** is already a toolchain prerequisite (installed via Homebrew)
- Bun provides built-in WebSocket, HTTP server, file I/O — covers most needs
- Scripts use `#!/usr/bin/env bun` shebang for direct execution
- If a skill truly needs npm packages, add `bun install` to `ai/install.sh` for that skill dir

### Decision Framework

**Start in `ai/skills/`** unless you need a harness-specific feature:

1. Does it need Claude-only runtime behavior such as `$SKILL_DIR`, subagents, hooks, or plugins? → `claude/skills/`
2. Does it need Pi's TypeScript TUI API? → `pi/extensions/`
3. Otherwise → `ai/skills/`

### Shared vs Adapter Rule

Keep the skill in `ai/skills/` when the core workflow works without harness-native primitives. Add a harness-specific overlay only when it contributes small, optional runtime glue rather than a second copy of the core instructions.

If the shared skill stands on its own, delete the wrapper instead of keeping two near-duplicate skills. `sprint-plan` is the canonical example: the shared skill keeps the clarification, sprint shaping, atomic-task, validation, and markdown output rules, while the old Claude-only slash-command, subagent-review, and task-conversion steps were removed instead of preserved as permanent wrapper logic.

## Skill Inventory

### Shared (`ai/skills/`)

| Skill | Type | Description |
|---|---|---|
| `build-skill` | Instruction-only | Create effective skills for AI coding agents |
| `code-review` | Instruction-only | Parallel code review with architecture validation |
| `dotfiles-dev` | Instruction-only | Guide for working with dotfiles |
| `favicon-generator` | Scripts | Generate optimized favicons (ImageMagick) |
| `feedback-loop` | Instruction-only | Self-validate work through deterministic feedback loops |
| `librarian` | Instruction-only | Multi-repository codebase exploration |
| `opensrc` | Instruction-only | Fetch source context for external packages and repositories |
| `qmd` | Instruction-only | Hybrid markdown search (BM25 + vectors + LLM) |
| `spec-planner` | Instruction-only | Dialogue-driven spec development with iterative refinement |
| `sprint-plan` | Instruction-only | Break projects into demoable sprints with atomic, testable tasks |
| `workspace-snapshot` | Instruction-only | Quick workspace orientation before editing |

### Claude-Specific (`claude/skills/`)

Currently empty. Shared skills are projected here at runtime by `ai/install.sh`. Use this directory only for skills that require Claude-native features (hooks, `$SKILL_DIR`, subagent delegation).

### Pi Extensions (`pi/extensions/`)

Custom extensions symlinked by `pi/install.sh`. Third-party extensions installed via packages:

| Extension | Type | Description |
|---|---|---|
| `notify.ts` | Lifecycle hook | Desktop notification via OSC 777 on agent completion (WezTerm) |

| Package | Source | Provides |
|---|---|---|
| `npm:mitsupi` | Armin Ronacher | /answer, /review, /todos, /files, /context, uv interceptor |

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
- **Usage**: Primary AI assistant for complex tasks
- **Aliases**: cl, clc, clr, yolo, ask
- **Instruction File**: `~/.claude/CLAUDE.md` (assembled from shared base + Claude appendix)
- **Project Skills**: `.claude/skills/` (installer-managed runtime projection)
- **Global Skills**: `~/.claude/skills/`

### Codex CLI (codex)
- **Provider**: OpenAI
- **Instruction File**: `~/.codex/instructions.md` (assembled from shared base)
- **Project Skills**: `.agents/skills/` (installer-managed runtime projection)

### OpenCode CLI (opencode)
- **Provider**: OpenAI
- **API Key**: `OPENAI_API_KEY` in `~/.config/fish/local.fish`
- **Config**: `~/.config/opencode/.opencode.json`
- **Instruction File**: `~/.config/opencode/AGENTS.md` (assembled from shared base + OpenCode appendix)

### Gemini CLI (gemini)
- **Provider**: Google
- **Instruction File**: `~/.gemini/GEMINI.md` (assembled from shared base)

### Pi Coding Agent (pi)
- **Provider**: Anthropic (via @mariozechner/pi-coding-agent)
- **Config**: `~/.pi/agent/settings.json` (symlinked from `pi/settings.json`)
- **Instruction File**: `~/.pi/agent/AGENTS.md` (assembled from shared base + Pi appendix)
- **Aliases**: `pi-print` (single-shot), `pi-json` (JSON output)

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
