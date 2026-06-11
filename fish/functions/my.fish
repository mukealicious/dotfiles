# Search custom aliases, fish functions, and bin commands
function my
    set -l query $argv

    begin
        # Aliases from fish
        alias | while read -l line
            echo "alias: $line"
        end

        # Functions from dotfiles fish/functions
        for fn in ~/.dotfiles/fish/functions/*.fish
            set -l name (basename $fn .fish)
            set -l desc (grep -m1 '^function .* -d ' $fn 2>/dev/null | sed -E 's/.* -d "([^"]+)".*/\1/')
            if test -n "$desc"
                echo "func: $name - $desc"
            else
                echo "func: $name"
            end
        end

        # Commands in dotfiles bin
        for cmd in ~/.dotfiles/bin/*
            set -l name (basename $cmd)
            set -l desc (head -5 $cmd 2>/dev/null | grep -m1 "^#[^!]" | sed 's/^# *//')
            if test -n "$desc"
                echo "bin: $name - $desc"
            else
                echo "bin: $name"
            end
        end
    end | fzf --query="$query" --preview-window=hidden
end
