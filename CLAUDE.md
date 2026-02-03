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

## Claude Code Capabilities

Claude Code config lives in `claude/` and is symlinked to `~/.claude/`. See `claude/README.md` for full architecture.

**Key files (edit here, not in ~/.claude/):**
- `claude/settings.json` - permissions, hooks, MCP servers
- `claude/skills/` - custom slash commands
- `claude/agents/` - subagents (oracle, librarian, review)
- `claude/hooks/` - PreToolUse hooks

**Safety Hook**: PreToolUse hook intercepts `rm -rf/-r/-f` commands and rewrites to `trash` (macOS built-in). User confirms the modified command.

**MCP Servers**:
- Linear - project management via OAuth (auth on first use)

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
