---
name: dotfiles-dev
description: Guide for working with the dotfiles system. Use when adding new topics, tools, or skills to dotfiles, understanding dotfiles architecture, or modifying shell/git configuration.
---

# Dotfiles Development

Topic-based dotfiles (Holman-style) at `~/.dotfiles`.

## Structure

```
~/.dotfiles/
├── ai/           # AI agent instructions
├── bin/          # Custom scripts, git commands
├── claude/       # Claude skills
├── git/          # Git config
├── zsh/          # Shell config
├── homebrew/     # Brewfile
├── script/       # bootstrap, install
└── [topic]/      # Other tools
```

## File Patterns

- `*.symlink` → symlinked to `~/` (with dot prefix)
- `*.zsh` → auto-sourced by ZSH
- `path.zsh` → PATH mods (loaded first)
- `completion.zsh` → completions (loaded last)
- `install.sh` → topic installer (run by `dot`)

## Adding a Topic

1. Create `~/.dotfiles/[topic]/`
2. Add `*.symlink` for home dir configs
3. Add `*.zsh` for shell config
4. Add `install.sh` if needed
5. Run `dot` to install

## Adding a Skill

Use the `skill-creator` skill for detailed guidance.

Quick steps:
1. Create `~/.dotfiles/claude/skills/[name]/`
2. Add `SKILL.md` with name/description frontmatter
3. Run `dot` to symlink

## Custom Git Commands

Located in `~/.dotfiles/bin/`:

- `git-up` - smart pull with stash/rebase
- `git-wtf` - branch status overview
- `git-undo` - undo recent operations
- `git-promote` - promote to tracking branch
- `git-delete-local-merged` - cleanup merged branches
- `git-unpushed` - show unpushed commits

## Environment

- PATH includes: `~/.dotfiles/bin`, `./bin`, `~/.local/bin`
- pyenv lazy-loaded (triggers on python/pip)
