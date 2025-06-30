# Fish-like syntax highlighting for ZSH
# Must be loaded after all custom widgets

# Source the plugin installed via Homebrew
if [[ -f "/opt/homebrew/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh" ]]; then
  source /opt/homebrew/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh
elif [[ -f "/usr/local/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh" ]]; then
  source /usr/local/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh
fi

# Customize colors (optional)
# ZSH_HIGHLIGHT_STYLES[command]='fg=green,bold'
# ZSH_HIGHLIGHT_STYLES[alias]='fg=green,bold'
# ZSH_HIGHLIGHT_STYLES[builtin]='fg=green,bold'