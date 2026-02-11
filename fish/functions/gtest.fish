function gtest -d "Run test command against staged changes only"
    if test (count $argv) -lt 1
        echo "Usage: gtest <command...>"
        echo "Example: gtest npm test"
        return 1
    end

    # Stash working dir, keeping index changes
    git stash push -q --keep-index --include-untracked; or return

    # Run test command against index changes only
    command $argv
    set -l cmdstatus $status

    # Return working dir and index to original state
    git reset -q
    git restore .
    git stash pop -q --index
    or begin
        echo "Warning: stash pop failed. Run 'git stash list' to recover."
        return $cmdstatus
    end

    return $cmdstatus
end
