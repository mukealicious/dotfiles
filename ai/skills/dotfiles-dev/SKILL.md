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

## Ownership Model

Keep install logic in the narrowest owning layer:

| Layer | Owns | Put changes here when | Avoid |
|-------|------|------------------------|-------|
| `bin/dot` | Top-level `dot` workflow | The step is part of the user-facing update flow or later `dot` steps depend on it immediately | Topic-specific setup details |
| `script/install` | Installer orchestration | You are changing installer ordering, discovery, skips, or argument forwarding | Tool-specific install logic |
| `[topic]/install.sh` | Topic setup | The change only affects one tool/topic and can be rerun safely | Cross-topic orchestration |
| `dot doctor` | Diagnostics | You need a health check or fix hint | Doing installation work |

Rules of thumb:
- Prefer `[topic]/install.sh` first.
- Only add to `script/install`'s `CORE_INSTALLERS` when ordering matters.
- Only change `bin/dot` when the top-level `dot` experience or sequencing must change.
- If `bin/dot` directly handles a topic, keep any `script/install --skip` usage aligned.
- When adding install behavior, consider whether `dot doctor` should gain a corresponding check.

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

## Key Commands

- `dot` - Update everything (defaults, brew, installers)
- `dot doctor` - Run environment diagnostics
- `dot -e` - Edit dotfiles in editor

## Secrets

Never commit: `~/.localrc`, `~/.gitconfig.local`
