# Undo a WIP commit
function gunwip -d "Undo WIP commit"
    git log -n 1 --pretty=%B | grep -q "\-\-wip\-\-"; and git reset HEAD~1
end
