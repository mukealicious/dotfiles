# Pi coding agent aliases

if set -q OPENAI_OP_REF
    function pi --wraps pi
        set -l openai_api_key (op read "$OPENAI_OP_REF")

        if test $status -ne 0
            printf "pi: failed to load OPENAI_API_KEY from 1Password via OPENAI_OP_REF\n" >&2
            return 1
        end

        if test -z "$openai_api_key"
            printf "pi: OPENAI_OP_REF returned an empty secret\n" >&2
            return 1
        end

        set -lx OPENAI_API_KEY "$openai_api_key"
        command pi $argv
    end
end

alias pi-print 'pi --print'   # Single-shot mode
alias pi-json 'pi --json'     # JSON output mode
