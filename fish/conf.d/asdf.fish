# asdf version manager - always available for coding agents
if test -f /opt/homebrew/opt/asdf/libexec/asdf.fish
    source /opt/homebrew/opt/asdf/libexec/asdf.fish
else if test -f /usr/local/opt/asdf/libexec/asdf.fish
    source /usr/local/opt/asdf/libexec/asdf.fish
end
