function grename -d "Rename 'old' branch to 'new', including in origin remote" -a old new
    if test (count $argv) -ne 2
        echo "Usage: grename old_branch new_branch"
        return 1
    end
    git branch -m $old $new
    git push --set-upstream origin $new
    and git push origin :$old
end
