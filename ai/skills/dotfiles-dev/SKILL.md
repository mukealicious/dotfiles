---
name: dotfiles-dev
description: Guide for working with the dotfiles system at ~/.dotfiles. Use when adding new topics/tools, creating shell aliases, adding Homebrew packages to Brewfile, creating custom git commands, adding AI skills, modifying Fish shell configuration, or understanding the topic-based (Holman-style) dotfiles architecture.
references:
  - references/file-patterns.md
  - references/git-commands.md
---

# Dotfiles Development

Topic-based dotfiles at `~/.dotfiles`. Each directory = one topic (tool/app).

## Structure

```
~/.dotfiles/
├── ai/           # Shared AI skills, agents, instructions (all tools)
├── bin/          # Scripts, custom git commands
├── claude/       # Claude Code config (settings, hooks)
├── pi/           # Pi config (extensions, themes)
├── git/          # Git config
├── fish/         # Fish shell config, functions
├── homebrew/     # Brewfile
├── lib/          # Shared shell libraries (symlink.sh)
├── script/       # bootstrap, install
└── [topic]/      # Tool-specific config
```

> For skill architecture, ownership model, key commands, secrets, and common shell/Homebrew tasks, see `CLAUDE.md` and `ai/instructions/base.md`.

### Add a Shared Skill

1. Create `~/.dotfiles/ai/skills/[name]/SKILL.md`
2. Add frontmatter with `name` and `description`
3. Run `dot` to project to all agents

Use `build-skill` skill for detailed guidance on format and progressive disclosure.

### Add a Claude-Only Skill

1. Create `~/.dotfiles/claude/skills/[name]/SKILL.md`
2. Run `dot` to project it into Claude runtime directories

Only do this when the skill uses Claude-specific features such as hooks, `$SKILL_DIR`, plugins, or subagent delegation. Prefer shared skills.

## Common Tasks

### Add New Topic

1. Create `~/.dotfiles/[topic]/`
2. Add files using patterns below
3. Run `dot` to install
4. If the topic adds `install.sh` and must run before other installers, update `script/install`'s `CORE_INSTALLERS`; otherwise it is auto-discovered in sorted fallback order
5. If `dot` handles part of that topic directly, keep `bin/dot` and any `script/install --skip` usage in sync

### Add Custom Git Command

See [references/git-commands.md](references/git-commands.md) for templates and existing commands.

Quick: Create executable `~/.dotfiles/bin/git-<name>`, use as `git <name>`.

## File Patterns

See [references/file-patterns.md](references/file-patterns.md) for complete reference.

| Pattern | Behavior |
|---------|----------|
| `*.symlink` | Symlinked to `~/.<name>` |
| `aliases.fish` | Auto-discovered and symlinked to Fish conf.d |
| `keybindings.fish` | Auto-discovered and symlinked to Fish conf.d |
| `install.sh` | Topic installer, run by `script/install` in deterministic order |
