# Pi coding agent aliases

if set -q OPENAI_OP_REF
    function pi --wraps pi
        set -lx OPENAI_API_KEY (op read "$OPENAI_OP_REF")
        command pi $argv
    end
end

alias pi-print 'pi --print'   # Single-shot mode
alias pi-json 'pi --json'     # JSON output mode
