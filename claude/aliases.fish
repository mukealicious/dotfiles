# Claude CLI aliases

alias cl 'claude'
alias clc 'claude --continue'
alias clr 'claude --resume'
alias yolo 'claude --continue --dangerously-skip-permissions'

alias clh 'claude --help'
alias clv 'claude --version'
alias clu 'claude update'
alias cld 'claude --debug'
alias clm 'claude mcp'
alias clcfg 'claude config'

function ask
    claude --print $argv
end
