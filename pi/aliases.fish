# Pi coding agent aliases

# Keep Fish as a thin shell integration layer. bin/pi owns profile selection
# so Fish and non-Fish launches share identical precedence and conflict checks.
function pi --wraps pi
    command "$DOTFILES/bin/pi" $argv
end

# Explicit auth-mode entry points.
# Set PI_DEFAULT_PROFILE=personal or work in ~/.config/fish/local.fish.
# - pi: dispatches through bin/pi
# - pi-work: work mode via API key injection
# - pi-personal: personal mode via OAuth/login-capable Pi binary
alias pi-work-print 'pi-work --print'
alias pi-personal-print 'pi-personal --print'
