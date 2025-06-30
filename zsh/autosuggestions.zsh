# Fish-like autosuggestions for ZSH
# Suggests commands as you type based on history and completions

# Source the plugin installed via Homebrew
if [[ -f "/opt/homebrew/share/zsh-autosuggestions/zsh-autosuggestions.zsh" ]]; then
  source /opt/homebrew/share/zsh-autosuggestions/zsh-autosuggestions.zsh
elif [[ -f "/usr/local/share/zsh-autosuggestions/zsh-autosuggestions.zsh" ]]; then
  source /usr/local/share/zsh-autosuggestions/zsh-autosuggestions.zsh
fi

# Use Ctrl+Space to accept the current suggestion
bindkey '^ ' autosuggest-accept

# Customize suggestion color (default is hard to see)
ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE='fg=244'