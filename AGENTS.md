# Dotfiles Repository

Topic-centric dotfiles (Holman-style). Manages macOS dev environment.

## Quick Reference

- `script/bootstrap` - initial setup, symlinks
- `script/install` - run all installers
- `bin/dot` - update everything
- `bin/dot doctor` - check environment health

## Where to Look

| Task | Start here |
|------|-----------|
| Add shell alias/abbr | `[topic]/aliases.fish` |
| Add fish function | `fish/functions/` |
| Add Homebrew package | `Brewfile` |
| New topic/tool | Create `[topic]/` dir, add `install.sh` |
| Custom git command | `bin/git-<name>` (executable) |
| Git config | `git/gitconfig.symlink` |
| Fish shell config | `fish/config.fish`, `fish/conf.d/` |
| Shared AI skill | `ai/skills/[name]/SKILL.md` |
| Codex-only skill | `Codex/skills/[name]/SKILL.md` |
| Agent instructions (shared) | `ai/instructions/base.md` |
| Agent instructions (Codex) | `Codex/instructions/appendix.md` |
| Codex settings/hooks | `Codex/settings.json`, `Codex/hooks/` |
| Subagent definition | `Codex/agents/` (or `ai/agents/` for shared body) |
| Installer ordering | `script/install` (`CORE_INSTALLERS`) |
| Symlink/logging helpers | `lib/symlink.sh`, `lib/log.sh` |
| Environment diagnostics | `bin/dot-doctor` |

## Development

Use the `dotfiles-dev` skill for detailed guidance on:
- Adding topics, skills, configurations
- File patterns and conventions
- Custom git commands

## AI Capability Architecture

Three-layer skill system across multiple AI tools. See `ai/README.md` for full details.

| Layer | Location | Works With |
|---|---|---|
| Shared skills | `ai/skills/` | All agents (Codex, Pi, OpenCode, Codex) |
| Codex-specific | `Codex/skills/` | Codex only |
| Pi extensions | `pi/extensions/` | Pi only |

**Installer ownership**:
- `ai/install.sh` — shared skills, agent instructions, symlinks to all tools
- `Codex/install.sh` — Codex settings, plugins
- `pi/install.sh` — Pi settings, themes, extensions, packages

## Codex Capabilities

Codex config lives in `Codex/` and is symlinked to `~/.Codex/`. See `Codex/README.md` for full architecture.

**Key files (edit here, not in ~/.Codex/):**
- `Codex/settings.json` - permissions, hooks, MCP servers
- `Codex/skills/` - Codex-only overlays (currently empty; shared skills live in `ai/skills/`)
- `Codex/agents/` - subagents; `review` is split-source (`ai/agents/review.body.md` + `Codex/agents/review.frontmatter`), while `oracle` and `librarian` remain combined
- `Codex/hooks/` - PreToolUse and lifecycle hooks

**Subagents** — invoke via natural language (e.g., "use the oracle to review this"):

| Agent | When to invoke | Can write files? |
|-------|----------------|------------------|
| **oracle** (Opus) | Architecture decisions, complex debugging, planning, second opinions. | No (read-only) |
| **librarian** (Sonnet) | Understanding 3rd-party libraries, exploring remote repositories, tracing code flow. | No (read-only) |
| **review** (Sonnet) | Code review after changes. Focused on bugs, security, and structural fit. | No (read-only) |

**Important: subagent routing for implementation work.** Oracle, librarian, and review are **read-only advisors** — they cannot Edit or Write files. For parallelized implementation tasks (writing code, editing files, running builds), use `subagent_type: "general-purpose"` which has full tool access. Never route implementation work to oracle/librarian/review — it will fail.

Oracle and librarian are the primary users of `context7` and `grep_app` MCP tools for documentation lookup and GitHub-wide code search. These are configured at user scope in `~/.Codex.json` (globally available — per-agent MCP scoping is not yet supported by Codex).

**Safety Hook**: PreToolUse hook intercepts `rm -rf/-r/-f` commands and rewrites to `trash` (macOS built-in). User confirms the modified command.

**Notification Hook**: Stop and Notification hooks play a sound and show macOS notification when Codex finishes or needs attention.

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

See `.Codex/rules/shell-scripting.md` for detailed guidance. Summary:

All installer scripts follow these patterns:

- Use `#!/bin/sh` (portable) and `set -e` (fail fast)
- Get script directory: `$(cd "$(dirname "$0")/.." && pwd -P)`
- Safe file iteration: `[ -e "$file" ] || continue`
- Provide `--force` flag for correcting misconfigurations

**Symlink management** (see `lib/symlink.sh` for canonical implementation):
- Always validate symlink targets, don't assume existing symlinks are correct
- Handle: non-existent, correct, broken, misdirected symlinks
- Clean dead symlinks before creating new ones
- Provide actionable fix commands in warnings

## Architecture Principles

### Installer Ownership Model

Keep changes in the narrowest layer that owns them:
- `bin/dot` — top-level user workflow and sequencing needed specifically by `dot`
- `script/install` — installer orchestration: explicit ordering, sorted fallback discovery, skip/forwarding behavior
- `[topic]/install.sh` — idempotent topic-specific setup
- `dot doctor` — diagnostics and fix hints

Default rule: put install logic in `[topic]/install.sh`; only move upward into `script/install` or `bin/dot` when orchestration or UX requires it.

- **Shared libraries**: `lib/log.sh` provides consistent shell UX helpers; `lib/symlink.sh` provides `ensure_symlink` and `check_symlink` — reuse these instead of rewriting logging or symlink logic
- **Single source of truth**: One script owns each config area (e.g., `ai/install.sh` for all AI tool configs)
- **No overlapping ownership**: Avoid multiple scripts managing same directories
- **Deterministic execution**: `script/install` uses explicit `CORE_INSTALLERS` ordering for foundational installers, then sorted discovery for the rest. If a new installer has ordering requirements, update `script/install`.

## Anti-Patterns

- Edit files under `~/.Codex/`, `~/.pi/agent/`, or `~/.config/opencode/` directly — edit source files in this repo, run `dot` to install
- Author shared skills in `.agents/skills/` or `.Codex/skills/` — these are installer-managed runtime outputs
- Add topic-specific logic to `script/install` or `bin/dot` unless orchestration requires it
- Create multiple scripts that manage the same config directory
- Assume existing symlinks point to the correct target — always validate
- Use `find | while` for order-dependent operations
- Skip dead symlink cleanup before creating new ones
- Commit `~/.localrc`, `~/.gitconfig.local`, or any `.env*` files

## Secrets

Never commit: `~/.localrc`, `~/.gitconfig.local`
