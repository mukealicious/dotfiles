---
name: rsvp
description: Generate RSVP speed-reading commands for documents. Use when user wants to speed-read, quickly consume, or visually scan markdown files, READMEs, documentation, or text content. Also covers TTS audio reading via Lue Reader.
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

## Audio Alternative (TTS via Lue Reader)

[Lue](https://github.com/superstarryeyes/lue) is a terminal eBook reader with TTS (Edge TTS by default, Kokoro for offline). Supports EPUB, PDF, TXT, DOCX, HTML, RTF, and Markdown.

```bash
lue path/to/book.epub                     # Read with TTS
lue README.md                             # Read markdown aloud
lue --speed 1.5 doc.epub                  # 1.5x playback speed
lue --voice "en-US-AriaNeural" book.epub  # Specific voice
lue --tts kokoro book.epub                # Offline TTS (requires extra setup)
lue --keys vim book.epub                  # Vim keybindings
lue --guide                               # Interactive navigation tutorial
lue                                       # Resume last book
```

### Lue Keyboard Controls

| Key | Action |
|-----|--------|
| `p` | Pause/resume TTS |
| `a` | Toggle auto-scroll |
| `h`/`l` | Previous/next paragraph |
| `j`/`k` | Previous/next sentence |
| `,`/`.` | Decrease/increase speed |
| `s`/`w` | Toggle sentence/word highlighting |
| `q` | Quit (auto-saves progress) |

### Fish Aliases

| Alias | Expands To |
|-------|------------|
| `read-aloud <file>` | `lue <file>` (TTS at default speed) |
| `read-fast <file>` | `lue --speed 2 <file>` (2x TTS speed) |

Note: `lue` and `rsvp` are separate modes (audio vs visual). Use them independently, not simultaneously.

## When to Suggest

- User says "read this", "speed read", "scan this doc"
- User wants to review documentation quickly
- User asks about RSVP or speed reading
- User wants to listen to a document (TTS) → suggest `lue`
- Generate the command; do NOT run it (it's interactive and blocking)

## Prerequisites

- `speedread` — vendored in dotfiles, auto-installed via `dot`
- `pandoc` — installed via Brewfile (`brew install pandoc`)
- `lue` — installed via uv (`uv tool install lue-reader`)
- `ffmpeg` — installed via Brewfile (required by lue for audio processing)
