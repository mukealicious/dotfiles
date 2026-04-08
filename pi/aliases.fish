# Pi coding agent aliases

function pi --wraps pi
    switch "$PI_DEFAULT_PROFILE"
        case personal
            command pi-personal $argv
        case '*'
            command pi-work $argv
    end
end

# Explicit auth-mode entry points.
# Set PI_DEFAULT_PROFILE=personal or work in ~/.config/fish/local.fish.
# - pi: dispatches to the machine's default profile
# - pi-work: work mode via API key injection
# - pi-personal: personal mode via OAuth/login-capable raw pi binary
alias pi-work-print 'pi-work --print'
alias pi-personal-print 'pi-personal --print'
