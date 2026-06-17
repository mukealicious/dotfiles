# Pi coding agent aliases

function pi --wraps pi
    set -l profile "$PI_DEFAULT_PROFILE"
    set -l expect_session_path 0

    # Herdr restores panes with commands like `pi --session ~/.pi/personal/...`.
    # Route those back to the profile that owns the session before using the
    # machine default.
    for arg in $argv
        if test "$expect_session_path" -eq 1
            if string match -q "$HOME/.pi/personal/*" -- "$arg"
                set profile personal
                break
            else if string match -q "$HOME/.pi/work/*" -- "$arg"
                set profile work
                break
            end
            set expect_session_path 0
            continue
        end

        switch "$arg"
            case --session
                set expect_session_path 1
            case '--session=*'
                set -l session_path (string replace -- '--session=' '' "$arg")
                if string match -q "$HOME/.pi/personal/*" -- "$session_path"
                    set profile personal
                    break
                else if string match -q "$HOME/.pi/work/*" -- "$session_path"
                    set profile work
                    break
                end
        end
    end

    switch "$profile"
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
