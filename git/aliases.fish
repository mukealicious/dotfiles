# Git aliases

alias gs 'git status -sb'
alias gp 'git push origin HEAD'
alias gl 'git pull --prune'
alias gc 'git commit'
alias gca 'git commit -a'
alias gco 'git checkout'
alias gd 'git diff'
alias gb 'git branch'
alias gac 'git add -A && git commit -m'
alias gcb 'git copy-branch-name'
alias ge 'git-edit-new'
alias glog "git log --graph --pretty=format:'%Cred%h%Creset %an: %s - %Creset %C(yellow)%d%Creset %Cgreen(%cr)%Creset' --abbrev-commit --date=relative"
alias gbage 'git for-each-ref --sort=committerdate refs/heads/ --format="%(HEAD) %(color:yellow)%(refname:short)%(color:reset) - %(color:red)%(objectname:short)%(color:reset) - %(contents:subject) - %(authorname) (%(color:green)%(committerdate:relative)%(color:reset))"'
