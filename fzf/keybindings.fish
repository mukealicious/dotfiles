# fzf key bindings for Fish
# Ctrl+R - fuzzy history search
# Ctrl+T - fuzzy file picker
# Alt+C  - fuzzy cd into subdirectory

if test -f /opt/homebrew/opt/fzf/shell/key-bindings.fish
    source /opt/homebrew/opt/fzf/shell/key-bindings.fish
else if test -f /usr/local/opt/fzf/shell/key-bindings.fish
    source /usr/local/opt/fzf/shell/key-bindings.fish
end
