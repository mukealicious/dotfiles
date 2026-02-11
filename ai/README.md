# AI Tools Configuration

Manages AI tool configuration, shared skills, and the unified instruction system.

## Architecture

Skills live in three locations based on portability:

| Location | Standard | Works With | When To Use |
|---|---|---|---|
| `ai/skills/` | [Agent Skills Standard](https://agentskills.io) | All agents (Claude, Pi, OpenCode, Codex) | Default — instruction-only or standard scripts |
| `claude/skills/` | Claude Code conventions | Claude Code only | Needs `$SKILL_DIR`, subagents, hooks, or plugins |
| `pi/extensions/` | Pi TypeScript API | Pi only | Needs Pi TUI API, tool wrapping, or lifecycle hooks |

### Shared Skills (`ai/skills/`)

Follow the [Agent Skills Standard](https://agentskills.io):
- YAML frontmatter (`name`, `description`) + Markdown body
- No `$SKILL_DIR` — agent resolves paths from SKILL.md parent directory
- Scripts accessed via shell commands relative to skill location
- Validated with `skills-ref validate <path>`

`ai/install.sh` symlinks shared skills into `~/.claude/skills/` and `~/.config/opencode/skill/`. Pi discovers them via `"skills"` path in `settings.json` — no symlinking needed.

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

1. Does it need `$SKILL_DIR`, Claude subagents, or hooks? → `claude/skills/`
2. Does it need Pi's TypeScript TUI API? → `pi/extensions/`
3. Otherwise → `ai/skills/`

## Skill Inventory

### Shared (`ai/skills/`)

| Skill | Type | Description |
|---|---|---|
| `commit` | Instruction-only | Conventional Commits workflow |
| `favicon-generator` | Scripts | Generate optimized favicons (ImageMagick) |
| `qmd` | Instruction-only | Hybrid markdown search (BM25 + vectors + LLM) |
| `uv` | Instruction + docs | Python uv package manager reference |
| `web-browser` | Scripts | Chrome CDP browser automation (Bun) |

### Claude-Specific (`claude/skills/`)

| Skill | Type | Description |
|---|---|---|
| `build-skill` | Instruction-only | Create effective Claude Code skills |
| `code-review` | Subagents | Parallel code review with multiple agents |
| `dotfiles-dev` | Instruction-only | Guide for working with dotfiles |
| `index-knowledge` | Scripts | Generate hierarchical AGENTS.md knowledge bases |
| `librarian` | Subagents | Multi-repository codebase exploration |
| `opensrc` | Scripts | Clone & generate knowledge base for external repos |
| `session-export` | Scripts | Add AI session summary to GitHub PR |
| `sprint-plan` | Instruction-only | Break projects into sprints with atomic tasks |

### Pi Extensions (`pi/extensions/`)

Custom extensions symlinked by `pi/install.sh`. Third-party extensions installed via packages:

| Package | Source | Provides |
|---|---|---|
| `npm:mitsupi` | Armin Ronacher | /answer, /review, /todos, /files, /context |

## Available AI Tools

### Claude CLI (claude)
- **Provider**: Anthropic
- **Usage**: Primary AI assistant for complex tasks
- **Aliases**: cl, clc, clr, yolo, ask
- **Instruction File**: `~/CLAUDE.md` (symlinked to AGENTS.md)

### Codex CLI (codex)
- **Provider**: OpenAI
- **Instruction File**: `~/.codex/instructions.md` (symlinked to AGENTS.md)

### OpenCode CLI (opencode)
- **Provider**: Groq (fast inference)
- **Instruction File**: `~/.config/opencode/AGENTS.md` (symlinked)

### Gemini CLI (gemini)
- **Provider**: Google
- **Instruction File**: `~/.gemini/GEMINI.md` (symlinked to AGENTS.md)

### Pi Coding Agent (pi)
- **Provider**: Anthropic (via @mariozechner/pi-coding-agent)
- **Config**: `~/.pi/agent/settings.json` (symlinked from `pi/settings.json`)
- **Instruction File**: `~/.pi/agent/AGENTS.md` (symlinked to AGENTS.md)
- **Aliases**: `pi-print` (single-shot), `pi-json` (JSON output)

## Unified Instruction System

All AI tools read from a single master instruction file:
- **Master File**: `~/.AGENTS.md` (symlinked from `ai/AGENTS.md.symlink`)
- Each tool's expected instruction file location is symlinked to this master file

## Setup

Run automatically by `script/install`, or manually:
```bash
~/.dotfiles/ai/install.sh
```
