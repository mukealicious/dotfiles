# Fish shell configuration
# Minimal setup for coding agents

# Disable greeting
set fish_greeting

# Environment
set -gx EDITOR editor
set -gx VISUAL editor
set -gx GIT_EDITOR "editor --wait"
set -gx PROJECTS ~/Code
set -gx DOTFILES ~/.dotfiles

# PATH
fish_add_path --move ~/.dotfiles/bin ~/.bun/bin ~/.local/bin

# Local secrets (not in git)
test -f ~/.config/fish/local.fish; and source ~/.config/fish/local.fish

# mise must activate after base PATH setup so project-pinned runtimes win over
# Homebrew/Bun globals. This prevents native Node ABI drift for tools like qmd.
if command -q mise
    mise activate fish | source
end

# Dotfiles wrappers intentionally sit above runtime package bins. Runtime tools
# such as qmd may be installed under mise-managed Node, while ~/.dotfiles/bin
# owns behavior wrappers like per-project .qmd detection.
fish_add_path --move ~/.dotfiles/bin

# Navigation
alias d 'cd ~/Desktop'
alias dl 'cd ~/Downloads'
alias .. 'cd ..'
alias ... 'cd ../..'
alias .... 'cd ../../..'

# Utilities
alias cls 'clear'
alias path 'echo $PATH | tr ":" "\n"'
alias now 'date +"%Y-%m-%d %H:%M:%S"'
alias pbc 'pbcopy'
alias pbp 'pbpaste'

# Tool aliases loaded from topic directories (*/aliases.fish)
