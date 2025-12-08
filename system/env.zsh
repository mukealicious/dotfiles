# Environment variables for shell configuration

# Set default editors
export EDITOR='code'
export VISUAL='code'

# Better ls colors
export CLICOLOR=1
export LSCOLORS=ExFxBxDxCxegedabagacad

# History configuration
export HISTFILE=~/.zsh_history
export HISTSIZE=10000
export SAVEHIST=10000

# FZF should use fd by default
export FZF_DEFAULT_COMMAND='fd --type f --hidden --follow --exclude .git'

# Homebrew configuration
export HOMEBREW_NO_ANALYTICS=1
export HOMEBREW_NO_AUTO_UPDATE=1
