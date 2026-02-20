# Dotfiles

Personal macOS development environment. Topic-centric organization based on [Holman's dotfiles](https://github.com/holman/dotfiles).

## Quick Start

```sh
git clone https://github.com/mukealicious/dotfiles.git ~/.dotfiles
cd ~/.dotfiles
script/bootstrap   # Interactive symlink setup + initial install
```

After bootstrap, use `dot` for daily updates:

```sh
dot       # Update symlinks, macOS defaults, Homebrew, installers
dot -e    # Open dotfiles in editor
```

## What's Included

| Category | Tools |
|----------|-------|
| **Shell** | Fish with fzf |
| **Terminal** | WezTerm, tmux |
| **Runtimes** | asdf (Node.js), uv (Python), Bun |
| **Packages** | Homebrew (Brewfile) |
| **AI Coding** | Claude Code, OpenCode, Gemini CLI, Codex, Pi |
| **Window Mgmt** | AeroSpace (i3-like tiling), Ice (menu bar) |
| **Database** | PostgreSQL 17, Redis |
| **CLI Tools** | fzf, eza, bat, ripgrep, fd, jq, httpie, ast-grep, zoxide, shellcheck, just, agent-browser |

## Architecture

### Topics

Each directory is a self-contained "topic" managing one tool or concern:

| Topic | Purpose |
|-------|---------|
| `fish/` | Fish shell config, functions, completions |
| `git/` | Git config, aliases, custom commands |
| `claude/` | Claude Code settings, skills, agents, hooks |
| `ai/` | Unified AI instructions (shared across tools) |
| `homebrew/` | Brewfile and installer |
| `macos/` | macOS system preferences |
| `tmux/` | Tmux configuration |
| `wezterm/` | WezTerm terminal config |
| `aerospace/` | Window manager config |
| `fzf/` | Fuzzy finder keybindings |
| `bun/` | Bun global packages |
| `pi/` | Pi coding agent config, extensions |
| `agent-browser/` | Headless browser automation for AI agents |
| `ripgrep/` | Ripgrep config and environment setup |
| `python/` | Python tools via uv |
| `ruby/` | Ruby config (gemrc, irbrc) |

### File Conventions

| Pattern | Behavior |
|---------|----------|
| `*.symlink` | Symlinked to `~/.<name>` (e.g., `gitconfig.symlink` → `~/.gitconfig`) |
| `install.sh` | Topic-specific installer, run by `script/install` |
| `aliases.fish` | Auto-discovered and symlinked to Fish conf.d |
| `keybindings.fish` | Auto-discovered and symlinked to Fish conf.d |

### Custom Commands

21 scripts in `bin/` added to PATH:

- `dot` — Update everything
- `e` — Launch editor
- `coffee` — Friendly caffeinate wrapper (prevent sleep)
- `git-*` — 14 custom git commands (amend, nuke, undo, etc.)

## AI Integration

This repo has deep integration with AI coding agents.

### Unified Instruction System

Single master file (`~/.AGENTS.md`) symlinked to all AI tools:

```
~/.AGENTS.md (canonical)
├── ~/CLAUDE.md              → symlink
├── ~/.config/opencode/      → symlink
├── ~/.gemini/GEMINI.md      → symlink
├── ~/.codex/instructions.md → symlink
└── ~/.pi/agent/AGENTS.md    → symlink
```

Edit once, applies everywhere.

### Safety Hook

PreToolUse hook intercepts destructive `rm` commands and rewrites to macOS `trash`:

```sh
rm -rf ./build  →  trash ./build
```

User confirms the modified command. No accidental deletions.

### Notification Hook

Stop and Notification hooks play a sound and show a macOS notification when Claude Code finishes a task or needs attention.

### Claude Subagents

Specialized AI advisors with distinct capabilities:

| Agent | Model | Purpose |
|-------|-------|---------|
| `oracle` | Opus | Architecture decisions, complex debugging |
| `librarian` | Sonnet | Multi-repo exploration, library internals |
| `review` | Sonnet | Code review (bugs, security, structure) |

### Claude Skills

Custom slash commands:

| Command | Purpose |
|---------|---------|
| `/code-review` | Parallel review with 3 agents |
| `/index-knowledge` | Generate AGENTS.md for codebase |
| `/session-export` | Export AI session to PR description |
| `/opensrc` | Clone repo + generate knowledge base |
| `/sprint-plan` | Break projects into atomic tasks |
| `/build-skill` | Create Claude skills |
| `/dotfiles-dev` | Guidance for this dotfiles system |
| `/qmd` | Hybrid markdown search (BM25 + vectors) |
| `/favicon-generator` | Generate favicons from PNG/SVG |

Plus plugins: `document-skills` (PDF/XLSX/DOCX/PPTX), `playground` (interactive HTML).

See [claude/README.md](claude/README.md) for full documentation.

## Shell Features

### Key Bindings

- **Ctrl+R** — Fuzzy search command history (fzf)
- **Ctrl+T** — Fuzzy find files (fzf)
- **Alt+C** — Fuzzy find directories (fzf)

### Fish Functions

- `c <project>` — Jump to project directory
- `my <query>` — Search aliases and bin commands
- `scratch` — Open scratch file
- `tempd` — Create and cd to temp directory
- `gwip` / `gunwip` — Work-in-progress commits
- `fcode [query]` — Fuzzy find file and open in editor
- `gbda` — Delete all branches merged in HEAD (including squashed)
- `grename <old> <new>` — Rename branch locally and on origin
- `gtest <cmd>` — Run test command against staged changes only
- `httpstatus <code>` — HTTP status code lookup
- `timer <duration>` — Countdown timer with notification
- `uuid` / `ulid` — Generate unique identifiers
- `rsvp <file>` — RSVP speed-read a file (`-c` for clipboard, `-w WPM` for speed)
- `read-aloud <file>` — Read file aloud via Lue TTS
- `read-fast <file>` — Read file at 2x speed via Lue TTS

### Git Aliases

```sh
gs     # git status
gp     # git push
gl     # git pull
gc     # git commit
gd     # git diff
glog   # git log --oneline --graph
gbage  # list branches sorted by last commit date
```

### Git Config Extras

- `git fomo` — Fetch and rebase default branch with autostash
- `rerere` enabled — Remembers conflict resolutions
- `fetch.prune` — Auto-remove deleted remote branches
- `rebase.updateRefs` — Updates stacked branch refs on rebase
- `core.fsmonitor` — Faster git status via filesystem monitor
- `branch.sort = -committerdate` — Branches sorted by recent activity

## Adding New Topics

1. Create directory: `mkdir ~/.dotfiles/newtopic/`
2. Add files following conventions:
   - `config.symlink` → symlinked to `~/.config`
   - `install.sh` → run during `script/install`
   - `aliases.fish` → auto-loaded by Fish
3. Run `dot` to apply

### Example: Adding Aliases

Create `newtopic/aliases.fish`:

```fish
alias foo='echo bar'
```

Run `dot`. The alias is automatically symlinked and available.

## Secrets Management

Never committed:

- `~/.localrc` — Private environment variables, API keys
- `~/.gitconfig.local` — Private git config (included automatically)

## Prerequisites

- macOS (Darwin)
- Git (usually preinstalled)
- Internet connection (for Homebrew)

Everything else is installed by bootstrap.

## Maintenance

```sh
dot                    # Daily update (safe to run anytime)
script/bootstrap       # Re-run symlinks (interactive)
script/install         # Re-run all installers
brew bundle cleanup    # Remove unlisted packages
```

## Credits

Based on [Holman's dotfiles](https://github.com/holman/dotfiles). MIT License.
