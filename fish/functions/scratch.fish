# Open a temporary file in editor
function scratch -d "Open temp file in editor"
    $EDITOR (mktemp)
end
