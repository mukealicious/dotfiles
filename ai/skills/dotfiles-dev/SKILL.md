---
name: dotfiles-dev
description: "Dotfiles development in ~/.dotfiles. Use for topic installers, Fish, CLI ownership, Git commands, or shared AI configuration."
references:
  - references/file-patterns.md
  - references/git-commands.md
---

# Dotfiles Development

Read `~/.dotfiles/AGENTS.md` first unless already loaded; it owns repository
constraints, source locations, and installer/toolchain boundaries.

## Supporting Docs

| Branch | Read before editing |
|---|---|
| Shell scripts, symlinks, aliases, or a new topic | [references/file-patterns.md](references/file-patterns.md) |
| Custom Git commands | [references/git-commands.md](references/git-commands.md) |
| AI instructions, skills, projections, or agent assembly | `~/.dotfiles/ai/README.md` |
| Pi configuration or extensions | `~/.dotfiles/pi/README.md` |
| Claude settings, hooks, or MCP | `~/.dotfiles/claude/README.md` |

## Add a Topic

1. Create `~/.dotfiles/[topic]/` and add the source files for that tool.
2. Follow the file patterns above. Add an installer only for topic-specific setup.
3. Change orchestration only for the dependencies described in `AGENTS.md`.
4. Validate the changed behavior, then apply it with the topic's installer.
   Use `script/symlink` for new `*.symlink` files or `fish/install.sh` for aliases
   and keybindings. Confirm the expected links; reserve `dot` for a full update.

## AI Authoring

Author portable skills in `~/Code/mu-stack/skills/<name>/`. Dotfiles keeps only
`apple-reminders` and `dotfiles-dev` in `ai/skills/`; use `claude/skills/<name>/`
only for Claude-native runtime features. Read the AI README before changing
integration or projections. Apply dotfiles-owned changes with `ai/install.sh`;
use mu-stack’s documented installer for its Claude/Codex links. Documentation-only
edits need no installer run. For upstream comparisons and adoption decisions,
read `~/Code/mu-stack/maintenance/upstream-review.md`. For dotfiles watchlist
commands and inventory scope, also read `~/.dotfiles/ai/maintenance/upstream-review.md`.

The manual `writing-for-agents` skill is available when the user requests
agent-document authoring guidance.
