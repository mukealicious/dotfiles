if set -q OPENAI_OP_REF
    function opencode --wraps opencode
        set -lx OPENAI_API_KEY (op read "$OPENAI_OP_REF")
        command opencode $argv
    end
end
