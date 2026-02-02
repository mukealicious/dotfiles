# Jump to git repository root
function grt -d "cd to repo root"
    cd (git rev-parse --show-toplevel 2>/dev/null; or echo ".")
end
