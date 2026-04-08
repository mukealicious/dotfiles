## Pi Appendix

- Prefer Pi-native extensions and intercepted commands when they offer a cleaner workflow than raw shell steps.
- For web tasks inside Pi, prefer `parallel_*` for public-web discovery/reading/synthesis and `bash`/`curl` for APIs and raw files.
- Do not assume Claude-specific hooks, MCP servers, or subagents exist in Pi.
- Keep Pi-specific runtime behavior here; shared instructions should stay portable.
