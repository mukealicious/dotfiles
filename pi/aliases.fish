# Pi coding agent aliases. bin/pi owns the managed runtime launch.
function pi --wraps pi
    command "$DOTFILES/bin/pi" $argv
end

alias pi-print 'pi --print'
