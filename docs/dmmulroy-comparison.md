# Dotfiles Comparison: mikeywills vs dmmulroy

Research and analysis comparing your Holman-style dotfiles with dmmulroy's Cloudflare developer setup.

---

## Overview

| Aspect | Your Dotfiles | dmmulroy's Dotfiles |
|--------|---------------|---------------------|
| **Style** | Holman topic-based | Stow + topic-hybrid |
| **Shell** | ZSH | Fish |
| **Terminal** | WezTerm + AeroSpace | Ghostty + Tmux |
| **Editor** | VSCode/Cursor | Neovim |
| **Symlinking** | Custom `*.symlink` convention | GNU Stow |
| **AI Tools** | Claude, OpenCode, Gemini, Codex | OpenCode primarily |

---

## 1. Symlinking: Custom vs GNU Stow

### Your Approach (`*.symlink` convention)

**How it works:**
- Files ending in `*.symlink` are found by `script/bootstrap`
- Extension stripped, symlinked to `$HOME`
- Example: `git/gitconfig.symlink` → `~/.gitconfig`

**Current symlinks (11 total):**
```
git/gitconfig.symlink           → ~/.gitconfig
git/gitignore.symlink           → ~/.gitignore
git/gitconfig.local.symlink     → ~/.gitconfig.local
ruby/gemrc.symlink              → ~/.gemrc
ruby/irbrc.symlink              → ~/.irbrc
starship/starship.toml.symlink  → ~/.starship.toml
wezterm/wezterm.lua.symlink     → ~/.wezterm.lua
zsh/zshrc.symlink               → ~/.zshrc
vim/vimrc.symlink               → ~/.vimrc
aerospace/aerospace.toml.symlink → ~/.aerospace.toml
ai/AGENTS.md.symlink            → ~/.AGENTS.md
```

**Bootstrap code (~50 lines):**
```bash
link_file () {
  # handles skip, overwrite, backup options
  ln -s "$1" "$2"
}

install_dotfiles () {
  for src in $(find -H "$DOTFILES_ROOT" -maxdepth 2 -name '*.symlink' -not -path '*.git*')
  do
    dst="$HOME/.$(basename "${src%.*}")"
    link_file "$src" "$dst"
  done
}
```

**Pros:**
- No external dependencies
- Explicit control over what gets linked
- Works with topic-based organization

**Cons:**
- Custom code to maintain
- Awkward for nested `.config/` paths
- Each new tool needs a `*.symlink` file

---

### dmmulroy's Approach (GNU Stow)

**How it works:**
- Single `home/` directory mirrors `~` structure exactly
- One command: `stow -R -v -d ~/.dotfiles -t ~ home`
- Stow creates symlinks for entire directory trees

**Directory structure:**
```
.dotfiles/
└── home/
    ├── .gitconfig
    ├── .gitignore
    └── .config/
        ├── fish/           → ~/.config/fish (whole dir)
        ├── nvim/           → ~/.config/nvim
        ├── tmux/           → ~/.config/tmux
        ├── git/            → ~/.config/git
        └── opencode/       → ~/.config/opencode
```

**Bootstrap code (3 lines):**
```bash
install_dotfiles() {
  stow -R -v -d "$DOTFILES_ROOT" -t "$HOME" home
}
```

**Pros:**
- Industry standard tool
- Handles nested directories naturally
- Conflict detection built-in
- Idempotent (safe to re-run)

**Cons:**
- External dependency (`brew install stow`)
- `home/` directory is separate from topics

---

### Migration Assessment

**Effort:** ~2 hours

**Steps:**
1. Create `home/` directory mirroring `~` structure
2. Move 11 `*.symlink` files to appropriate locations
3. Replace bootstrap symlink logic with single `stow` command
4. Test symlinks work correctly
5. Remove old `*.symlink` files

**Risk:** Low (all changes reversible via git)

**Recommendation:** Migrate - simplifies future additions especially for `.config/` tools

---

## 2. Shell: ZSH vs Fish

### Your ZSH Setup

**Architecture:**
- `zsh/zshrc.symlink` is the entry point
- Loads all `**/*.zsh` files from topics
- Special ordering: `path.zsh` first, `completion.zsh` last
- ~62 lines of boilerplate for loading/ordering

**Topic loading:**
```bash
# Load path files first
for file in ${(M)config_files:#*/path.zsh}; source $file

# Load everything except path and completion
for file in ${${config_files:#*/path.zsh}:#*/completion.zsh}; source $file

# Initialize completions
autoload -Uz compinit
compinit

# Load completion files
for file in ${(M)config_files:#*/completion.zsh}; source $file
```

**Plugins/features:**
- zsh-autosuggestions (plugin)
- zsh-syntax-highlighting (plugin)
- Starship prompt
- Custom functions in `functions/`

---

### dmmulroy's Fish Setup

**Architecture:**
- `config.fish` is minimal (17 lines)
- `conf.d/*.fish` auto-sourced (no manual loading)
- `functions/*.fish` lazy-loaded on first call
- Zero boilerplate for loading

**conf.d structure (16 files):**
```
conf.d/
├── aliases.fish      # Shell aliases
├── paths.fish        # PATH modifications
├── git.fish          # Git abbreviation init
├── brew.fish         # Homebrew setup
├── starship.fish     # starship init fish | source
├── zoxide.fish       # zoxide init fish | source
├── fzf.fish          # FZF configuration
├── fnm.fish          # Node version manager
├── bun.fish          # Bun runtime
└── ... (more)
```

**Key feature: Abbreviations (180+ git shortcuts)**
```fish
abbr -a -g g git           # Type 'g', see it expand to 'git'
abbr -a -g ga 'git add'
abbr -a -g gst 'git status'
abbr -a -g gc 'git commit -v'
abbr -a -g gp 'git push'
abbr -a -g fomo 'git fetch origin main && git rebase origin/main'
```

Unlike aliases, abbreviations **expand visibly** before you press enter - you see what command will run.

---

### Comparison

| Feature | ZSH | Fish |
|---------|-----|------|
| **Syntax highlighting** | Plugin needed | Built-in |
| **Auto-suggestions** | Plugin needed | Built-in |
| **Abbreviations** | Plugin needed | Built-in, superior |
| **Auto-sourcing** | Manual loops | conf.d/ automatic |
| **Lazy functions** | Manual setup | Implicit |
| **Script ecosystem** | Massive (45 years) | Smaller |
| **POSIX compatible** | Mostly | No |
| **Array indexing** | 0-indexed | 1-indexed |

**Migration effort:** 15-20 hours full, 5-10 hours hybrid

**Hybrid approach:** Keep ZSH for scripts, use Fish interactively. They coexist.

---

### Fish Files to Port

From dmmulroy's setup, key files:

**conf.d/git.fish** - Creates 180+ abbreviations:
- Location: `/Users/mikeywills/Code/dmmulroy/.dotfiles/home/.config/fish/conf.d/git.fish`
- Uses `__git.create_abbr` helper function
- Covers: add, branch, checkout, commit, diff, fetch, log, merge, pull, push, rebase, reset, stash, status, etc.

**functions/__git.*.fish** - Helper functions:
- `__git.default_branch` - Detects main vs master
- `__git.create_abbr` - Creates abbreviations programmatically

**functions/gwip.fish** - WIP commit workflow:
```fish
function gwip -d "git commit a work-in-progress branch"
  git add -A
  git rm (git ls-files --deleted) 2> /dev/null
  git commit -m "--wip--" --no-verify
end
```

---

## 3. Terminal Multiplexing: WezTerm vs Tmux

### Your Setup (WezTerm + AeroSpace)

- WezTerm: GPU-accelerated terminal emulator
- AeroSpace: i3-like tiling window manager
- No session persistence
- Single terminal context per window

---

### dmmulroy's Setup (Tmux)

**Config location:** `/Users/mikeywills/Code/dmmulroy/.dotfiles/home/.config/tmux/tmux.conf`

**Key settings:**
```tmux
# Prefix key (not default C-b)
unbind C-b
set -g prefix 'C-;'

# Extended keys for proper modifiers
set -s extended-keys on
set -g allow-passthrough on

# Large scrollback
set -g history-limit 50000

# Mouse support
set -g mouse on

# Escape time (for vim)
set -s escape-time 0
```

**Plugins (via TPM):**
```tmux
set -g @plugin 'tmux-plugins/tpm'
set -g @plugin 'christoomey/vim-tmux-navigator'  # Seamless vim/tmux panes
set -g @plugin 'tmux-plugins/tmux-resurrect'     # Save/restore sessions
set -g @plugin 'tmux-plugins/tmux-continuum'     # Auto-save every 10 min
set -g @plugin 'catppuccin/tmux'                 # Theme
```

**Resurrect settings:**
```tmux
set -g @resurrect-strategy-nvim 'session'
set -g @resurrect-capture-pane-contents 'on'
set -g @continuum-restore 'on'
set -g @continuum-boot 'on'
set -g @continuum-save-interval '10'
```

---

### Why Tmux for AI Agents?

**Session persistence:**
- Claude Code sessions survive terminal closes, SSH drops, reboots
- Pick up conversations next day
- Long-running builds continue in background

**Parallel workflows:**
- Multiple Claude Code instances in separate tmux windows
- Git worktrees + tmux for isolated branch development
- Test pane visible while coding

**Emerging tools (2026):**
- `claude-squad` - Manages multiple AI agents in tmux sessions
- `workmux` - Git worktrees + tmux automation
- `tmux-resurrect` + `continuum` - Auto-save/restore sessions

---

### WezTerm + Tmux: They Work Together

- WezTerm = terminal emulator (GPU, fonts, colors)
- Tmux = multiplexer (sessions, panes, persistence)
- Run tmux inside WezTerm for both benefits
- AeroSpace still manages windows; tmux manages sessions within

**Setup:** Just install tmux, configure it, start using it inside WezTerm.

---

## 4. `dot` CLI Comparison

### Your `dot` Command (63 lines)

**Location:** `/Users/mikeywills/.dotfiles/bin/dot`

**Options:**
- `dot` - Full update (defaults, brew, bundle, installers)
- `dot -e` - Edit dotfiles in editor
- `dot -h` - Help

**What it does:**
```bash
$ZSH/macos/set-defaults.sh
$ZSH/homebrew/install.sh
brew update
brew upgrade
brew bundle --file="$ZSH/Brewfile"
$ZSH/script/install
```

---

### dmmulroy's `dot` Command (2,482 lines)

**Location:** `/Users/mikeywills/Code/dmmulroy/.dotfiles/dot`

**Commands:**
```
dot init                    # Full setup (brew, stow, bun, ssh, font, fish)
dot update                  # Pull + brew upgrade + restow
dot doctor                  # 8+ health diagnostics
dot stow                    # Resymlink only
dot package list [bundle]   # List packages
dot package add X [cask]    # Add + install immediately
dot package remove X        # Remove from bundle
dot package update [X]      # Update packages
dot gen-ssh-key [email]     # Generate domain-specific SSH keys
dot completions             # Generate Fish completions
dot summary                 # AI commit summarization
dot benchmark-shell         # Fish startup profiling
```

**Health checks (`dot doctor`):**
- Homebrew health (`brew doctor`)
- Expected symlinks exist
- Required tools installed
- Shell is Fish
- Stow configured correctly
- TPM installed
- Fonts available

**Failure handling:**
- Failed packages logged to `packages/failed_packages_TIMESTAMP.txt`
- `dot retry-failed` attempts reinstall
- Installation continues despite individual failures

---

### What to Adopt

**Recommended additions:**
1. `dot doctor` - Health diagnostics
2. `dot stow` - Re-run stow (after migration)

**Not needed:**
- Package management commands (Brewfile works)
- SSH key generation (manual is fine)
- AI summarization (nice but complex)

---

## 5. AI Configuration Comparison

### Your Setup

**Unified instructions:** `ai/AGENTS.md.symlink` → `~/.AGENTS.md`

Symlinked to multiple tools:
- `~/CLAUDE.md` (Claude Code)
- `~/.config/opencode/AGENTS.md` (OpenCode)
- `~/.gemini/GEMINI.md` (Gemini)
- `~/.codex/instructions.md` (Codex)

**Content:**
```markdown
# AI Agent Instructions

## Communication
- Extremely concise, sacrifice grammar
- Plans: list unresolved questions at end

## System
- macOS, ZSH, VSCode, WezTerm, AeroSpace
- Tools: fd, rg, bat, eza, fzf, zoxide, git, gh, docker, jq, op

## Secrets
Never commit: ~/.localrc, ~/.gitconfig.local
```

**Strength:** Single source of truth across all AI tools

---

### dmmulroy's Setup

**OpenCode-centric:** `/Users/mikeywills/Code/dmmulroy/.dotfiles/home/.config/opencode/`

**Structure:**
```
opencode/
├── opencode.json           # Config (MCP, permissions, theme)
├── AGENTS.md               # Instructions
├── agent/                  # Subagents
│   ├── oracle.md          # Code review, architecture (extended thinking)
│   ├── librarian.md       # Multi-repo exploration
│   └── review.md          # Code review
├── command/                # Custom slash commands
│   ├── complete-next-task.md
│   ├── code-review.md
│   └── opensrc.md
├── skill/                  # Agent skills
│   ├── librarian/
│   ├── frontend-design/
│   └── ~10 others
└── tool/                   # TypeScript tools
    └── ast-grep.ts
```

**Permission system (opencode.json):**
```json
{
  "permission": {
    "read": {
      "*": "allow",
      "*.env": "deny",
      "*.env.*": "deny",
      "*.envrc": "deny",
      "secrets/*": "deny"
    }
  }
}
```

**MCP servers:**
```json
{
  "mcp": {
    "context7": {"type": "remote", "url": "https://mcp.context7.com/mcp", "enabled": true},
    "grep_app": {"type": "remote", "url": "https://mcp.grep.app", "enabled": true},
    "opensrc": {"type": "local", "command": ["npx", "-y", "opensrc-mcp"], "enabled": true}
  }
}
```

**Subagent pattern:**
- Oracle: Extended thinking (31999 token budget) for architecture
- Librarian: Multi-repo exploration with GitHub links
- Different models per agent (Opus 4.5, Sonnet 4.5)

---

### What to Adopt

**File access restrictions (add to AGENTS.md):**
```markdown
## File Access Restrictions
Never read or modify:
- `~/.localrc`, `~/.gitconfig.local`, `~/.gitconfig.work`
- `**/secrets/**`, `**/*.env`, `**/.envrc`, `**/credentials*`
```

**Subagent patterns:** Worth researching for Claude Code custom agents

---

## 6. Git Configuration Comparison

### Your Setup

**Location:** `/Users/mikeywills/.dotfiles/git/gitconfig.symlink`

```gitconfig
[include]
    path = ~/.gitconfig.local
[alias]
    co = checkout
    count = !git shortlog -sn
[core]
    excludesfile = ~/.gitignore
    editor = cursor
[pull]
    rebase = true
[init]
    defaultBranch = main
```

---

### dmmulroy's Setup

**Location:** `/Users/mikeywills/Code/dmmulroy/.dotfiles/home/.config/git/config`

```gitconfig
[user]
    email = dillon.mulroy@gmail.com
    name = Dillon Mulroy
    signingKey = ~/.ssh/key.pub

[commit]
    gpgSign = true

[gpg]
    format = "ssh"              # SSH signing (not GPG)

[core]
    editor = "nvim"
    fsmonitor = true            # Faster git status
    untrackedCache = true

[fetch]
    prune = true                # Clean stale remotes
    writeCommitGraph = true     # Faster log operations

[rerere]
    enabled = true              # Remember conflict resolutions

[branch]
    sort = "-committerdate"     # Recent branches first

[alias]
    fomo = "!fish -c 'git fetch origin $(__git.default_branch) && git rebase origin/$(__git.default_branch) --autostash'"

[includeIf "gitdir:~/Code/work/"]
    path = ~/.config/git/work_config   # Work-specific identity
```

---

### Recommended Additions

```gitconfig
[core]
    fsmonitor = true
    untrackedCache = true

[fetch]
    prune = true
    writeCommitGraph = true

[rerere]
    enabled = true

[branch]
    sort = -committerdate

[merge]
    conflictstyle = zdiff3

[diff]
    algorithm = histogram
```

---

## 7. Key Files Reference

### dmmulroy's Dotfiles

| File | Purpose |
|------|---------|
| `/Users/mikeywills/Code/dmmulroy/.dotfiles/dot` | Main CLI (2,482 lines) |
| `.../home/.config/fish/config.fish` | Fish entry point |
| `.../home/.config/fish/conf.d/git.fish` | Git abbreviations |
| `.../home/.config/fish/functions/` | Fish functions |
| `.../home/.config/tmux/tmux.conf` | Tmux configuration |
| `.../home/.config/git/config` | Git configuration |
| `.../home/.config/opencode/opencode.json` | AI tool config |
| `.../home/.config/opencode/AGENTS.md` | AI instructions |
| `.../packages/bundle` | Brewfile |
| `.../docs/architecture.md` | Documentation |

### Your Dotfiles

| File | Purpose |
|------|---------|
| `/Users/mikeywills/.dotfiles/bin/dot` | Main CLI (63 lines) |
| `.../zsh/zshrc.symlink` | ZSH entry point |
| `.../git/gitconfig.symlink` | Git configuration |
| `.../ai/AGENTS.md.symlink` | AI instructions |
| `.../script/bootstrap` | Symlink setup |
| `.../script/install` | Run installers |
| `.../Brewfile` | Homebrew packages |

---

## Decision Summary

| Decision | Recommendation | Effort | Priority |
|----------|---------------|--------|----------|
| GNU Stow | Migrate | 2 hr | High |
| Tmux | Add | 1-2 hr | High |
| Fish | Experiment (hybrid) | 2-3 hr initial | Medium |
| `dot` CLI | Add doctor/stow | 1 hr | Medium |
| AI restrictions | Update AGENTS.md | 30 min | Low |
| Git config | Add performance settings | 30 min | Low |

---

## Next Steps

Pick one decision at a time:

1. **Start with Stow** - Foundation for everything else
2. **Add Tmux** - Session persistence for AI workflows
3. **Try Fish** - Better interactive experience (keep ZSH as backup)
4. **Enhance `dot`** - Add doctor command for debugging
