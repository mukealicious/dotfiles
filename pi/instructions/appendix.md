## Pi Appendix

- Prefer Pi-native extensions and intercepted commands when they offer a cleaner workflow than raw shell steps.
- For web tasks inside Pi, use `cmux_browser` for live rendered/runtime work (localhost, authenticated pages, visual inspection, DOM/JS debugging, console/errors); prefer `parallel_*` for public-web discovery/reading/synthesis, `bash`/`curl` for APIs and raw files, and prefer `cmux_browser` over shelling out to `agent-browser` when you need live browser interaction.
- Do not assume Claude-specific hooks, MCP servers, or subagents exist in Pi.
- Keep Pi-specific runtime behavior here; shared instructions should stay portable.
