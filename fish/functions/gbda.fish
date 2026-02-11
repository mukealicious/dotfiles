function gbda -d "Delete all branches merged in current HEAD, including squashed"
    # Delete normally merged branches
    git branch --merged | \
        command grep -vE '^\*|^\+|^\s*(master|main|develop)\s*$' | \
        command xargs -n 1 git branch -d 2>/dev/null

    # Delete squash-merged branches
    set -l default_branch (__git.default_branch)
    git for-each-ref refs/heads/ "--format=%(refname:short)" | \
        while read branch
            string match -qr '^(master|main|develop)$' $branch; and continue
            set -l merge_base (git merge-base $default_branch $branch 2>/dev/null)
            or continue
            if string match -q -- '-*' (git cherry $default_branch (git commit-tree (git rev-parse $branch\^{tree}) -p $merge_base -m _) 2>/dev/null)
                git branch -D $branch
            end
        end
end
