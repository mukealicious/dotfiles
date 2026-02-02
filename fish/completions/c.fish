# Tab completion for c function - lists directories in ~/Code
# -x = exclusive (no other completions)
# -a = arguments to complete with
complete -x -c c -a "(command ls ~/Code 2>/dev/null)"
