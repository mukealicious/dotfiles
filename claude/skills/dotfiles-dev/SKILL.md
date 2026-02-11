---
name: dotfiles-dev
description: Guide for working with the dotfiles system at ~/.dotfiles. Use when adding new topics/tools, creating shell aliases, adding Homebrew packages to Brewfile, creating custom git commands, adding Claude skills, modifying ZSH configuration, or understanding the topic-based (Holman-style) dotfiles architecture.
---

# Dotfiles Development

Topic-based dotfiles at `~/.dotfiles`. Each directory = one topic (tool/app).

## Structure

```
~/.dotfiles/
├── bin/          # Scripts, custom git commands
├── claude/       # Claude skills (skills/)
├── git/          # Git config
├── fish/         # Fish shell config, functions
├── homebrew/     # Brewfile
├── script/       # bootstrap, install
└── [topic]/      # Tool-specific config
```

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

### Add Claude Skill

1. Create `~/.dotfiles/claude/skills/[name]/SKILL.md`
2. Add frontmatter with `name` and `description`
3. Run `dot` to symlink

Use `skill-creator` skill for detailed guidance.

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
- `dot -e` - Edit dotfiles in editor

## Secrets

Never commit: `~/.localrc`, `~/.gitconfig.local`
