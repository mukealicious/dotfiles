# Claude CLI aliases

# Basic claude shortcuts
alias cl='claude'
alias clc='claude --continue'
alias clr='claude --resume'

# YOLO mode - auto-run without confirmation
# yolo: Interactive continue mode with dangerous skip
alias yolo='claude --continue --dangerously-skip-permissions'
# yoloj: Non-interactive continue with JSON output
yoloj() {
    claude --continue --dangerously-skip-permissions --verbose --output-format stream-json --print "$@" | jq
}

# Other useful claude shortcuts
alias clh='claude --help'
alias clv='claude --version'
alias clu='claude update'

# Claude with common flags
alias cld='claude --debug'
alias clm='claude mcp'
alias clcfg='claude config'

# Quick non-interactive sessions
alias ask='claude --print "$@"'