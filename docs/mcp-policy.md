# MCP ownership policy

Harnesses in this repo do **not** share one universal MCP inventory.
MCPs are owned per harness so each agent gets only the integrations that fit its workflow.

## Ownership model

| Harness | Source of truth | Notes |
|---|---|---|
| Claude Code | `claude/install.sh`, `claude/settings.json` | Best place for Claude-native MCP workflows and plugins |
| OpenCode | `opencode/opencode.json` | Separate MCP inventory from Claude |
| Pi | none by default | Add via Pi extension/package only, e.g. `pi-mcp-adapter` |
| Codex | none repo-managed today | Add only if a real Codex-specific need appears |

## Current intended split

| MCP | Claude | OpenCode | Pi | Why |
|---|---:|---:|---:|---|
| `figma` | yes | no | no | Design workflow is Claude-only for now |
| `playwright` | yes | no | no | Browser automation stays Claude-native for now |
| `grep_app` | yes | yes | no | Useful in Claude/OpenCode; Pi does not use MCP right now |
| `cloudflare` | project | project | no | Broad production platform; add only in projects that need it |
| `linear` | no | yes | no | OpenCode-only today |

## Rules

1. **Default to harness-specific ownership.**
   Do not mirror an MCP into every tool automatically.

2. **Keep design integrations narrow.**
   If an MCP primarily supports design or plugin-heavy workflows, prefer Claude-only unless another harness has a proven use case.

3. **Keep Pi explicit.**
   Pi has no built-in MCP layer. If Pi needs MCP access, add it intentionally through a Pi-native adapter/package and configure only the servers Pi should see.

4. **Prefer the smallest useful surface.**
   Especially for large platforms like Cloudflare, avoid user-scope/global MCPs. Add them at project scope only when the repository needs them.

5. **Document exceptions.**
   If the same MCP is enabled in multiple harnesses, there should be a clear workflow reason.

## Change checklist

When adding or changing an MCP:

- update the harness-owned config only
- avoid copying it into other harnesses by default
- update this file if the intended split changes materially
- if removing an MCP, remove both the config entry and any installer logic that re-adds it

## Examples

- **Figma Claude-only**: add to Claude config, omit from OpenCode and Pi
- **Cloudflare project-only**: add to Claude/OpenCode at project scope in Cloudflare-backed repositories; do not configure it globally
- **One-off local MCP**: keep it in the harness where it is used instead of promoting it repo-wide
