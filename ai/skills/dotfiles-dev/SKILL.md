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

## AI Skill Architecture

Three-layer system serving multiple agents (Claude Code, Pi, OpenCode, Codex):

| Layer | Location | Scope |
|-------|----------|-------|
| Shared skills | `ai/skills/` | All agents — portable, tool-agnostic |
| Claude overlay | `claude/skills/` | Claude Code only |
| Pi extensions | `pi/extensions/` | Pi only |

**Projection**: `ai/install.sh` symlinks shared skills to each agent's runtime directory. Claude overlay skills take precedence over shared when both exist.

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

### Add Shell Alias

Edit or create `~/.dotfiles/[topic]/aliases.fish`:

```fish
alias myalias='command'
```

Run `dot` to symlink to Fish conf.d.

### Add Homebrew Package

Edit `~/.dotfiles/homebrew/Brewfile`:

```ruby
brew "package-name"
cask "app-name"
```

Run `brew bundle` to install.

### Add New Topic

1. Create `~/.dotfiles/[topic]/`
2. Add files using patterns below
3. Run `dot` to install

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
| `install.sh` | Topic installer |

## Key Commands

- `dot` - Update everything (defaults, brew, installers)
- `dot doctor` - Run environment diagnostics
- `dot -e` - Edit dotfiles in editor

## Secrets

Never commit: `~/.localrc`, `~/.gitconfig.local`
