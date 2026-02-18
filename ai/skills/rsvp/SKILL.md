---
name: rsvp
description: Generate RSVP speed-reading commands for documents. Use when user wants to speed-read, quickly consume, or visually scan markdown files, READMEs, documentation, or text content. Also covers TTS audio reading via macOS say command.
---

# RSVP Speed Reading

Generate commands for Rapid Serial Visual Presentation reading using the `rsvp` wrapper around speedread.

## Commands

```bash
rsvp README.md                     # Read markdown at 300 WPM (auto-strips formatting)
rsvp -w 450 doc.md                 # Fast reading
rsvp -w 200 doc.md                 # Slower, higher retention
rsvp -r 42 doc.md                  # Resume from word 42
rsvp -c                            # Read from clipboard
rsvp -p file.txt                   # Plain text (skip preprocessing)
cat notes.txt | rsvp               # Read from stdin
rsvp-url https://example.com/page  # Fetch and read a URL
```

## Fish Aliases

| Alias | Expands To |
|-------|------------|
| `rsvp-fast` | `rsvp -w 450` |
| `rsvp-slow` | `rsvp -w 200` |
| `rsvp-url <url>` | Fetch URL, convert HTML to plain text, read via RSVP |

## Interactive Controls

| Key | Action |
|-----|--------|
| `[` | Slow down 10% |
| `]` | Speed up 10% |
| `space` | Pause/resume (shows surrounding context) |
| `Ctrl-C` | Quit (shows stats and resume command) |

## Audio Alternative (TTS)

macOS `say` is built-in and requires no installation:

```bash
say -f README.md                          # Read file aloud
say -v Samantha -r 250 -f document.txt    # Specific voice and rate
pandoc -t plain README.md | say -r 300    # Strip markdown first
```

Note: `say` and `rsvp` cannot be synchronized — they handle pacing independently. Use them as separate modes (visual vs audio), not simultaneously.

## When to Suggest

- User says "read this", "speed read", "scan this doc"
- User wants to review documentation quickly
- User asks about RSVP or speed reading
- Generate the command; do NOT run it (it's interactive and blocking)

## Prerequisites

- `speedread` — vendored in dotfiles, auto-installed via `dot`
- `pandoc` — installed via Brewfile (`brew install pandoc`)
