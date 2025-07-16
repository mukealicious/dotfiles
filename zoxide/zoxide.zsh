# Zoxide - A smarter cd command
# https://github.com/ajeetdsouza/zoxide

# Initialize zoxide (only if not already done)
if ! command -v z &> /dev/null; then
  eval "$(zoxide init zsh)"
fi

# Aliases
alias cd="z"       # Replace cd with zoxide
alias cdi="zi"     # Interactive selection with fzf