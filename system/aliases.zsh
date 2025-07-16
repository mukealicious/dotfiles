# Modern CLI replacements

# eza - modern ls replacement
if command -v eza > /dev/null; then
  alias ls='eza --icons --group-directories-first'
  alias ll='eza --icons --group-directories-first -la'
  alias l='eza --icons --group-directories-first -l'
  alias la='eza --icons --group-directories-first -a'
  alias tree='eza --tree --icons'
fi

# bat - better cat with syntax highlighting
if command -v bat > /dev/null; then
  alias cat='bat --style=plain'
  alias catn='bat --style=numbers'
  export MANPAGER="sh -c 'col -bx | bat -l man -p'"
fi

# ripgrep - ultra-fast grep
if command -v rg > /dev/null; then
  alias grep='rg'
fi

# fd - simple, fast find
if command -v fd > /dev/null; then
  alias find='fd'
fi

# Other useful aliases
alias reload!='. ~/.zshrc'
alias cls='clear'
alias path='echo -e ${PATH//:/\\n}'
alias now='date +"%Y-%m-%d %H:%M:%S"'

# Quick directory navigation
alias ..='cd ..'
alias ...='cd ../..'
alias ....='cd ../../..'
alias .....='cd ../../../..'


# Safety nets
alias rm='rm -i'
alias cp='cp -i'
alias mv='mv -i'