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
dot          # Update symlinks, macOS defaults, Homebrew, installers
dot doctor   # Check environment health
dot -e       # Open dotfiles in editor
```

## What's Included

| Category | Tools |
|----------|-------|
| **Shell** | Fish with fzf |
| **Terminal** | WezTerm, Herdr |
| **Runtimes** | mise (Node.js, pnpm, Bun), uv (Python) |
| **Packages** | Homebrew (Brewfile) |
| **AI Coding** | Claude Code, OpenCode, Gemini CLI, Codex, Pi |
| **Window Mgmt** | AeroSpace (i3-like tiling), Ice (menu bar) |
| **Database** | PostgreSQL 17, Redis |
| **CLI Tools** | fzf, eza, bat, ripgrep, fd, jq, httpie, ast-grep, zoxide, shellcheck, just, ni, Flue CLI, Portless, agent-browser, surf-cli, RemCTL |

## Architecture

### Topics

Each directory is a self-contained "topic" managing one tool or concern:

| Topic | Purpose |
|-------|---------|
| `fish/` | Fish shell config, functions, completions |
| `git/` | Git config, aliases, custom commands |
| `claude/` | Claude Code settings, skills, agents, hooks |
| `ai/` | Shared AI instructions, skills, and agent assembly |
| `homebrew/` | Homebrew installer (packages are declared in the root `Brewfile`) |
| `macos/` | macOS system preferences |
| `herdr/` | Herdr agent multiplexer notes |
| `wezterm/` | WezTerm terminal config |
| `aerospace/` | Window manager config |
| `fzf/` | Fuzzy finder keybindings |
| `bun/` | Bun-specific configuration and opt-in command aliases |
| `pnpm/` | Default JavaScript package-manager policy and aliases |
| `mise/` | Canonical JS toolchain versions, lockfile, and native Node CLIs such as QMD |
| `pi/` | Pi coding agent config, extensions |
| `agent-browser/` | Headless browser automation for AI agents |
| `surf/` | Surf browser lanes using dedicated Brave Beta/Edge agent control |
| `remctl/` | Pinned RemCTL install and Apple Reminders agent runtime |
| `ripgrep/` | Ripgrep config and environment setup |
| `python/` | Python tools via uv |
| `ruby/` | Ruby config (gemrc, irbrc) |

### Ownership and Installer Boundaries

Read [AGENTS.md](AGENTS.md#ownership-model) before changing installers, wrappers,
or diagnostics; it owns repository constraints and toolchain boundaries.
Read [Dotfiles File Patterns](ai/skills/dotfiles-dev/references/file-patterns.md)
before changing shell scripts or symlink behavior. Keep setup in its topic owner,
orchestration in `script/install`, and diagnostics read-only.

### JavaScript Toolchain Policy

- `mise.toml` declares compatible release lines; `mise.lock` pins exact top-level versions and backend-supported artifact checksums. Isolated npm CLI dependencies remain registry-resolved behind the seven-day release policy.
- Node 24 LTS is the default runtime. pnpm 11 is the default package manager for new or unmarked projects. `pnpm/config.yaml` enforces a strict seven-day release airlock and rejects trust downgrades. Bun remains installed for repositories that explicitly target it.
- Existing repositories follow their `packageManager`/`devEngines.packageManager` declaration and committed lockfile. Never generate a second lockfile to standardize an existing project.
- `ni`/`nr` provide package-manager-neutral commands: they honor an existing lockfile and fall back to pnpm via `~/.nirc`. Dotfiles wrappers run them with the pinned global Node while preserving project-local package managers.
- Yarn is a narrow Corepack exception: the `yarn` wrapper reads a repository's Yarn pin and falls back to Yarn Classic for an unmarked v1 lockfile. Corepack does not own pnpm.
- Homebrew may install Node as a transitive formula dependency, but mise-managed Node must win on `PATH`.

For a new pnpm project:

```sh
mise use node@24 pnpm@11
mise lock
pnpm init --init-package-manager
```

Review and commit `mise.toml`, `mise.lock`, `package.json`, and `pnpm-lock.yaml`. The normal `dot` workflow upgrades mise tools within these declared release lines, refreshes both macOS platform entries in `mise.lock`, and prompts you to review and commit the lockfile. Moving to a new major release line remains an explicit edit to `mise/config.toml`.

### Custom Commands

Scripts in `bin/` added to PATH include:

- `dot` — Update everything
- `dot doctor` — Check environment health
- `ai-watch` — Generate upstream watchlist/review reports
- `e` — Launch editor
- `coffee` — Friendly caffeinate wrapper (prevent sleep)
- `git-*` — Custom git commands; read the [command guide](ai/skills/dotfiles-dev/references/git-commands.md) before adding or changing one

## AI Integration

Shared instructions, skills, and agent sources live in `ai/`; harness-specific
configuration lives in its topic. Runtime files are assembled/projected by
`ai/install.sh`, not authored in installed directories.

- **Instructions, skills, agents, and provenance:** read
  [ai/README.md](ai/README.md) before changing ownership or assembly, or to choose
  a task-specific skill.
- **Claude settings, hooks, MCP, and read-only advisors:** read
  [claude/README.md](claude/README.md).
- **Pi settings, MCP, extensions, delegation, or legacy migration:** read
  [pi/README.md](pi/README.md). Pi uses one subscription-backed environment at
  `~/.pi/agent`; old work/personal wrappers are retired.

Claude's safety hook adds confirmation for guarded `rm` commands; it is not a
deletion guarantee. Shared safety rules remain in `ai/instructions/base.md`.

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

Reading/media helper dependencies are tracked in Homebrew:
- `ffmpeg` — audio/video processing used by TTS/media workflows
- `yt-dlp` — downloader used by media-capable reading helpers and agent workflows

`dot doctor` warns when these support CLIs are missing.

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

Use the [dotfiles-dev topic workflow](ai/skills/dotfiles-dev/SKILL.md#add-a-topic).
Apply local changes with the owning installer or `script/symlink` rather than
running the full updater.

### Example: Adding Aliases

Create `newtopic/aliases.fish`:

```fish
alias foo='echo bar'
```

Run `fish/install.sh` to refresh the topic alias links. Start a new Fish shell
or source the linked file to load the alias in the current shell.

## Secrets Management

Never committed:

- `~/.localrc` — Private environment variables, API keys
- `~/.gitconfig.local` — Private git config (included automatically)
- `.env*` — Project-local credentials and environment state

## Prerequisites

- macOS (Darwin)
- Git (usually preinstalled)
- Internet connection (for Homebrew)

Bootstrap runs installer orchestration. Pi runtime dependency preparation and
sign-in have explicit steps in [Pi setup](pi/README.md#setup).

## Maintenance

```sh
dot                    # Full update of managed tools and configuration
dot doctor             # Check environment health
script/bootstrap       # Re-run symlinks (interactive)
script/install         # Re-run all installers (explicit core order + sorted fallback)
script/install --force # Re-run installers and fix managed symlinks where supported
brew bundle cleanup    # Remove unlisted packages
```

## Credits

Based on [Holman's dotfiles](https://github.com/holman/dotfiles). MIT License.
