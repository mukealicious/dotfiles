function fcode -d "Fuzzy find file and open in editor"
    set -l cmd fd -H -t f --strip-cwd-prefix

    if not command -v fd &>/dev/null
        set cmd find . -type f
    end

    set -l file
    if test (count $argv) -eq 0
        $cmd | fzf --header "Open File" --preview "head -50 {}" | read file
    else
        set -l query (string join " " $argv)
        $cmd | fzf --header "Open File" --preview "head -50 {}" -q "$query" | read file
    end

    if test -n "$file"
        $EDITOR "$file"
    end
end
