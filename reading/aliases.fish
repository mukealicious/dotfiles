# RSVP reading aliases

alias rsvp-fast 'rsvp -w 450'
alias rsvp-slow 'rsvp -w 200'

# Read a URL via RSVP (fetches, converts HTML to plain text, reads)
function rsvp-url
    if test (count $argv) -lt 1
        echo "Usage: rsvp-url <url> [rsvp-flags]"
        return 1
    end
    set -l url $argv[1]
    set -e argv[1]
    curl -sL "$url" | pandoc -f html -t plain --wrap=none | rsvp -p $argv
end

# Lue Reader TTS aliases
alias read-aloud 'lue'
alias read-fast 'lue --speed 2'
