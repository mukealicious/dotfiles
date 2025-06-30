# My Dotfiles

Personal macOS development environment configuration based on [Holman's dotfiles](https://github.com/holman/dotfiles) philosophy.

## Quick Setup (New Machine)

```sh
git clone https://github.com/mikeywills/dotfiles.git ~/.dotfiles
cd ~/.dotfiles
script/bootstrap  # Sets up symlinks and git config
script/install    # Runs all installers (Homebrew, etc.)
bin/dot           # Install packages from Brewfile and set macOS defaults
```

## What's Included

- **Shell**: ZSH with Starship prompt, syntax highlighting, and autosuggestions
- **Package Managers**: Homebrew (with Brewfile), Bun, Yarn
- **Version Managers**: pyenv (Python), asdf (Node.js)
- **Modern CLI Tools**: fzf, zoxide, eza, bat, ripgrep, fd
- **Database**: PostgreSQL 11
- **Editor**: VS Code (default), Vim config
- **Git**: Custom aliases and commands
- **Automation**: GitHub Actions for Claude PR assistant

## Philosophy

Topic-centric organization - each directory represents a specific area (git, zsh, docker, etc.) rather than having monolithic config files.

## How It Works

### File Conventions

- **bin/**: Scripts added to `$PATH`
- **topic/\*.zsh**: Automatically loaded shell configuration
- **topic/path.zsh**: PATH modifications (loaded first)
- **topic/completion.zsh**: Shell completions (loaded last)
- **topic/install.sh**: Topic-specific installers
- **topic/\*.symlink**: Files symlinked to `$HOME` (e.g., `gitconfig.symlink` → `~/.gitconfig`)

### Key Commands

```sh
bin/dot        # Update macOS defaults, Homebrew, and run installers
bin/dot -e     # Open dotfiles in VS Code
brew bundle    # Install/update packages from Brewfile
```

### Secrets Management

- Private environment variables go in `~/.localrc` (not tracked)
- Git user config goes in `~/.gitconfig.local` (not tracked)

## Modern Shell Features

### Key Bindings
- **Ctrl+R**: Fuzzy search command history (fzf)
- **Ctrl+T**: Fuzzy find files (fzf)
- **Alt+C**: Fuzzy find directories (fzf)
- **Ctrl+Space**: Accept autosuggestion

### Smart Commands
- `z <partial-path>`: Jump to directory (zoxide)
- `ls`: Modern listing with icons (eza)
- `cat`: Syntax highlighted viewing (bat)
- `grep`: Ultra-fast search (ripgrep)

## Adding New Topics

1. Create a directory for your topic (e.g., `rust/`)
2. Add configuration files following the conventions above
3. Run `script/bootstrap` if you added symlinks
4. Run `script/install` if you added an installer

## Maintenance

```sh
# Keep everything updated
bin/dot

# After making changes to symlinks
script/bootstrap

# Check what's installed
brew list
brew list --cask
```

## AI Integration

- **CLAUDE.md**: Provides context for Claude Code when working in this repository
- **GitHub Actions**: Claude PR assistant (triggered by @claude mentions)

## Performance

Shell startup time optimized with:
- Lazy loading for pyenv/python commands
- Fast Starship prompt (10-50ms vs 100ms+ custom prompt)
- Minimal plugin loading

## Credits

Originally inspired by [Holman's dotfiles](https://github.com/holman/dotfiles) and [Ryan Bates' dotfiles](https://github.com/ryanb/dotfiles).