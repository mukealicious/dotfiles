function timer -d "Countdown timer with notification"
    if test (count $argv) -lt 1
        echo "Usage: timer <duration>"
        echo "Examples: 5s, 10m, 1h, 90 (seconds)"
        return 1
    end

    set -l duration $argv[1]
    set -l seconds 0

    if string match -qr '^[0-9]+s$' $duration
        set seconds (string replace 's' '' $duration)
    else if string match -qr '^[0-9]+m$' $duration
        set seconds (math (string replace 'm' '' $duration) '*' 60)
    else if string match -qr '^[0-9]+h$' $duration
        set seconds (math (string replace 'h' '' $duration) '*' 3600)
    else if string match -qr '^[0-9]+$' $duration
        set seconds $duration
    else
        echo "Error: Invalid duration. Use 5s, 10m, 1h, or a number."
        return 1
    end

    echo "Timer started for $duration ($seconds seconds)..."
    sleep $seconds
    echo "Time's up!"

    if command -v afplay &>/dev/null
        afplay /System/Library/Sounds/Glass.aiff &>/dev/null &
    end

    if command -v osascript &>/dev/null
        osascript -e "display notification \"Timer finished ($duration)\" with title \"Timer\"" 2>/dev/null
    end
end
