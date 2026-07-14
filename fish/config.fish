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

# Dotfiles wrappers intentionally sit above runtime package bins. Do not call
# fish_add_path here: it would re-promote every persistent fish_user_paths entry
# (including Homebrew) above mise. Rebuild PATH locally so wrappers win while
# mise remains the runtime/package-manager owner.
set -l dotfiles_bin ~/.dotfiles/bin
set -l runtime_path
for path_entry in $PATH
    if test "$path_entry" != "$dotfiles_bin"
        set -a runtime_path "$path_entry"
    end
end
set -gx PATH "$dotfiles_bin" $runtime_path

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

# OrbStack command-line tools and shell integration
source ~/.orbstack/shell/init2.fish 2>/dev/null || :
