# Dotfiles Repository

Topic-centric dotfiles (Holman-style). Manages macOS dev environment.

## Quick Reference

- `script/bootstrap` - initial setup, symlinks
- `script/install` - run all installers
- `bin/dot` - update everything

## Development

Use the `dotfiles-dev` skill for detailed guidance on:
- Adding topics, skills, configurations
- File patterns and conventions
- Custom git commands

## AI Agent Architecture

Three-layer skill system across multiple AI tools. See `ai/README.md` for full details.

| Layer | Location | Works With |
|---|---|---|
| Shared skills | `ai/skills/` | All agents (Claude, Pi, OpenCode, Codex) |
| Claude-specific | `claude/skills/` | Claude Code only |
| Pi extensions | `pi/extensions/` | Pi only |

**Installer ownership**:
- `ai/install.sh` — shared skills, agent instructions, symlinks to all tools
- `claude/install.sh` — Claude Code settings, plugins
- `pi/install.sh` — Pi settings, themes, extensions, packages

## Claude Code Capabilities

Claude Code config lives in `claude/` and is symlinked to `~/.claude/`. See `claude/README.md` for full architecture.

**Key files (edit here, not in ~/.claude/):**
- `claude/settings.json` - permissions, hooks, MCP servers
- `claude/skills/` - custom slash commands
- `claude/agents/` - subagents (oracle, librarian, review)
- `claude/hooks/` - PreToolUse and lifecycle hooks

**Subagents** — invoke via natural language (e.g., "use the oracle to review this"):

| Agent | When to invoke | Can write files? |
|-------|----------------|------------------|
| **oracle** (Opus) | Architecture decisions, complex debugging, planning, second opinions. | No (read-only) |
| **librarian** (Sonnet) | Understanding 3rd-party libraries, exploring remote repositories, tracing code flow. | No (read-only) |
| **review** (Sonnet) | Code review after changes. Focused on bugs, security, and structural fit. | No (read-only) |

**Important: subagent routing for implementation work.** Oracle, librarian, and review are **read-only advisors** — they cannot Edit or Write files. For parallelized implementation tasks (writing code, editing files, running builds), use `subagent_type: "general-purpose"` which has full tool access. Never route implementation work to oracle/librarian/review — it will fail.

Oracle and librarian are the primary users of `context7` and `grep_app` MCP tools for documentation lookup and GitHub-wide code search. These are configured at user scope in `~/.claude.json` (globally available — per-agent MCP scoping is not yet supported by Claude Code).

**Safety Hook**: PreToolUse hook intercepts `rm -rf/-r/-f` commands and rewrites to `trash` (macOS built-in). User confirms the modified command.

**Notification Hook**: Stop and Notification hooks play a sound and show macOS notification when Claude Code finishes or needs attention.

**MCP Servers**:
- Linear - project management via OAuth (auth on first use)
- context7 - library documentation lookup (user scope, globally available)
- grep_app - GitHub-wide code search (user scope, globally available)

## Pi Coding Agent

Pi config lives in `pi/` and is symlinked to `~/.pi/agent/`. See `pi/README.md`.

Key features:
- Discovers shared skills via `settings.json` path config
- `notify.ts` extension sends desktop notifications (OSC 777)
- mitsupi package provides uv interceptor, /answer, /review, /todos, /files

## Shell Scripting Conventions

See `.claude/rules/shell-scripting.md` for detailed guidance. Summary:

All installer scripts follow these patterns:

- Use `#!/bin/sh` (portable) and `set -e` (fail fast)
- Get script directory: `$(cd "$(dirname "$0")/.." && pwd -P)`
- Safe file iteration: `[ -e "$file" ] || continue`
- Provide `--force` flag for correcting misconfigurations

**Symlink management** (see `ai/install.sh` for canonical implementation):
- Always validate symlink targets, don't assume existing symlinks are correct
- Handle: non-existent, correct, broken, misdirected symlinks
- Clean dead symlinks before creating new ones
- Provide actionable fix commands in warnings

## Architecture Principles

- **Single source of truth**: One script owns each config area (e.g., `ai/install.sh` for all AI tool configs)
- **No overlapping ownership**: Avoid multiple scripts managing same directories
- **Deterministic execution**: Explicit ordering over `find | while` when order matters

## Secrets

Never commit: `~/.localrc`, `~/.gitconfig.local`
