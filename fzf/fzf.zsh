# FZF - Fuzzy Finder Configuration
# https://github.com/junegunn/fzf

# Setup fzf (performance optimized)
if [[ ! "$PATH" == */opt/homebrew/opt/fzf/bin* ]]; then
  export PATH="${PATH:+${PATH}:}/opt/homebrew/opt/fzf/bin"
fi

# Only load if fzf is available and not already loaded
if command -v fzf &> /dev/null && [[ -z "$FZF_COMPLETION_LOADED" ]]; then
  # Auto-completion
  [[ $- == *i* ]] && source "/opt/homebrew/opt/fzf/shell/completion.zsh" 2> /dev/null
  
  # Key bindings
  # CTRL-R - Search command history
  # CTRL-T - Search files
  # ALT-C  - Search directories
  source "/opt/homebrew/opt/fzf/shell/key-bindings.zsh"
  
  export FZF_COMPLETION_LOADED=1
fi

# Better defaults
export FZF_DEFAULT_OPTS='
  --height 40%
  --layout=reverse
  --border
  --inline-info
  --color=dark
  --color=fg:-1,bg:-1,hl:#5fff87,fg+:-1,bg+:-1,hl+:#ffaf5f
  --color=info:#af87ff,prompt:#5fff87,pointer:#ff87d7,marker:#ff87d7,spinner:#ff87d7
'

# Use fd instead of find for better performance
if command -v fd > /dev/null; then
  export FZF_DEFAULT_COMMAND='fd --type f --hidden --follow --exclude .git'
  export FZF_CTRL_T_COMMAND="$FZF_DEFAULT_COMMAND"
  export FZF_ALT_C_COMMAND='fd --type d --hidden --follow --exclude .git'
fi

# Preview files with bat
export FZF_CTRL_T_OPTS="
  --preview 'bat -n --color=always --style=numbers {}'
  --bind 'ctrl-/:change-preview-window(down|hidden|)'"

# Preview directories with eza
export FZF_ALT_C_OPTS="
  --preview 'eza --tree --level=2 --color=always {}'"