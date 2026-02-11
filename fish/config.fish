# Fish shell configuration
# Minimal setup for coding agents

# Disable greeting
set fish_greeting

# Environment
set -gx EDITOR code
set -gx PROJECTS ~/Code
set -gx DOTFILES ~/.dotfiles

# PATH
fish_add_path ~/.bun/bin        # bun globals (pi, etc.)
fish_add_path ~/.local/bin      # uv tools
fish_add_path ~/.dotfiles/bin

# Local secrets (not in git)
test -f ~/.config/fish/local.fish; and source ~/.config/fish/local.fish

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
