# Fish shell configuration
# Minimal setup for coding agents

# Disable greeting
set fish_greeting

# Environment
set -gx EDITOR cursor
set -gx PROJECTS ~/Code
set -gx DOTFILES ~/.dotfiles

# PATH - dotfiles bin
fish_add_path ~/.dotfiles/bin

# Local secrets (not in git)
test -f ~/.config/fish/local.fish; and source ~/.config/fish/local.fish

# Simple shortcuts
alias d='cd ~/Desktop'
alias dl='cd ~/Downloads'
alias ..='cd ..'
alias ...='cd ../..'
alias ....='cd ../../..'

# Utilities
alias cls='clear'
alias path='echo $PATH | tr ":" "\n"'
alias now='date +"%Y-%m-%d %H:%M:%S"'
alias pbc='pbcopy'
alias pbp='pbpaste'

# Git
alias gs='git status -sb'
alias gp='git push origin HEAD'
alias gl='git pull --prune'
alias gc='git commit'
alias gco='git checkout'
alias gd='git diff'
alias gb='git branch'
alias gac='git add -A && git commit -m'
