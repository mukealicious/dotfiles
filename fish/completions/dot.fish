# Completions for dot command
complete -c dot -f

complete -c dot -n '__fish_use_subcommand' -a doctor -d 'Run environment diagnostics'
complete -c dot -n '__fish_use_subcommand' -s e -l edit -d 'Open dotfiles in editor'
complete -c dot -n '__fish_use_subcommand' -s h -l help -d 'Show help'
