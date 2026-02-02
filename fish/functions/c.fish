# Jump to project directory
# Usage: c myproject -> ~/Code/myproject
function c --description "Jump to project in ~/Code"
    cd "$PROJECTS/$argv[1]"
end
