# Jump to a new temporary directory
function tempd -d "cd to new temp dir"
    cd (mktemp -d)
end
