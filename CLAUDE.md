@AGENTS.md

## Claude Code

- See `claude/README.md` for Claude settings, hooks, MCP maintenance, and subagent setup. Edit source files under `claude/`, not installed files under `~/.claude/`.
- `oracle`, `librarian`, and `review` are read-only advisors. Use `subagent_type: "general-purpose"` for delegated implementation; do not route writes to advisors.
- For external-library investigations, use `grep_app` for discovery and the shared `opensrc` workflow for source inspection. Include repo/package identity, version/ref when known, file citations, and whether evidence comes from examples/tests or implementation.
- Shell-specific guidance lives in `.claude/rules/shell-scripting.md`.
