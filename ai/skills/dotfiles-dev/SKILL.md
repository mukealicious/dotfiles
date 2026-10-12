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

Author shared skills in `ai/skills/<name>/`; use `claude/skills/<name>/` only for
Claude-native runtime features. The AI README owns frontmatter, assembly, and
projection guidance. Refresh runtime outputs with `ai/install.sh` when installation
is part of the task; documentation-only edits need no installer run.

The manual `writing-for-agents` skill is available when the user requests
agent-document authoring guidance.
