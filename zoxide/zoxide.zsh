# Zoxide - A smarter cd command
# https://github.com/ajeetdsouza/zoxide

# Always initialize zoxide - the guard was causing issues with coding agents
# where the alias existed but __zoxide_z function wasn't defined
eval "$(zoxide init zsh)"

# Aliases
alias cd="z"       # Replace cd with zoxide
alias cdi="zi"     # Interactive selection with fzf