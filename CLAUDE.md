@AGENTS.md

## Claude Code

- Read [claude/README.md](claude/README.md) before changing Claude settings, hooks,
  MCP connections, or advisor setup.
- `oracle`, `librarian`, and `review` are read-only advisors. Use
  `subagent_type: "general-purpose"` for authorized delegated implementation.
- For external-library investigations, load the shared `librarian` skill; it owns
  discovery, source inspection, and evidence requirements.
