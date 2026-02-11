function uuid -d "Generate a UUID"
    if command -v uuidgen &>/dev/null
        uuidgen | tr '[:upper:]' '[:lower:]'
    else if command -v python3 &>/dev/null
        python3 -c "import uuid; print(uuid.uuid4())"
    else if command -v node &>/dev/null
        node -e "console.log(require('crypto').randomUUID())"
    else
        echo "Error: No UUID generator available"
        return 1
    end
end
