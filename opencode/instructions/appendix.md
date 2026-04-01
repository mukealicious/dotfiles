## OpenCode Appendix

- Stick to portable shared workflows first and avoid assuming Claude-only or Pi-only runtime features.
- Treat OpenCode-specific behavior as additive config, not a reason to fork the shared base.
- When emitting fenced code blocks, prefer canonical info strings that OpenCode highlights reliably: use `bash` not `sh`/`zsh`, `yaml` not `yml`, `python` not `py`, `json` not `jsonc`, and `typescript`/`javascript`/`markdown` instead of short aliases.
- If the requested language is unsupported or uncertain in OpenCode's TUI highlighter, prefer `text` or the nearest supported language instead of a speculative fence label. In practice, avoid unsupported labels like `sql`, `zsh`, `jsonc`, `ini`, or `dockerfile` unless the user explicitly needs that exact fence.
