# PRD: Dotfiles Cleanup & Enhancements

**Date:** 2026-01-21

---

## Problem Statement

### What problem are we solving?

The Claude Code setup has accumulated multiple browser automation tools with overlapping functionality, lacks safety guardrails for destructive file operations, and is missing useful integrations (Linear MCP, Remotion skills). Additionally, the PRD/task workflow lacks a "hands-free" mode for executing multiple tasks sequentially.

**User impact:** Confusion about which browser tool to use, risk of irreversible file deletion, manual effort required to run consecutive tasks.

### Why now?

Inbox items accumulated from daily workflow. Good opportunity to consolidate and clean up while adding valuable new capabilities.

### Who is affected?

- **Primary user:** Mike (dotfiles owner)
- **Secondary:** Any future users of this dotfiles repo

---

## Proposed Solution

### Overview

1. **Browser MCP Consolidation** - Remove browser-automation plugin, keep only Vercel AI Browser MCP as the single browser automation solution
2. **Safety Hook** - Add PreToolUse hook to intercept `rm` commands and redirect to `trash` for recoverability
3. **Linear MCP** - Add Linear MCP server for work task management (already partially configured in settings.json)
4. **Remotion Skills** - Add remotion-dev/skills plugin for video creation guidance
5. **Ralph Wiggum Script** (stretch goal) - Automation script to loop `/complete-task` across sessions

---

## End State

When this PRD is complete:

- [ ] Browser-automation plugin removed from install.sh and settings
- [ ] Vercel AI Browser MCP configured and working
- [ ] Claude PreToolUse hook intercepts all `rm` commands → `trash`
- [ ] Linear MCP server verified working (may already be done)
- [ ] Remotion skills plugin installed and enabled
- [ ] (Stretch) Ralph Wiggum script created for batch task execution

---

## Acceptance Criteria

### Feature: Browser MCP Cleanup
- [ ] `browser-automation@browser-tools` removed from `claude/install.sh`
- [ ] Plugin disabled/removed from `~/.claude/settings.json`
- [ ] Vercel AI Browser MCP added to mcpServers config
- [ ] Browser automation verified working via simple test

### Feature: Safety Hook
- [ ] PreToolUse hook script created at `~/.dotfiles/claude/hooks/safety-rm.sh`
- [ ] Hook configured in Claude settings to intercept Bash tool
- [ ] Hook transforms `rm` commands to use `trash` instead
- [ ] `trash` CLI installed via Homebrew (add to Brewfile if missing)
- [ ] Hook preserves original command semantics (paths, flags where applicable)

### Feature: Linear MCP
- [ ] Linear MCP server config in `~/.claude/settings.json` verified
- [ ] Authentication working (may require `op` for token)
- [ ] Can query Linear issues from Claude

### Feature: Remotion Skills
- [ ] remotion-dev/skills marketplace added
- [ ] Remotion skill plugin installed and enabled
- [ ] Skill accessible in Claude sessions

### Feature: Ralph Wiggum (Stretch)
- [ ] Script created at `~/.dotfiles/bin/ralph-wiggum`
- [ ] Accepts PRD name and task count as arguments
- [ ] Loops `claude -p "/complete-task <prd>"` in fresh sessions
- [ ] Stops after N tasks or when no tasks remain
- [ ] Handles errors gracefully

---

## Technical Context

### Existing Patterns

- **Plugin installation:** `claude/install.sh:82-94` - Uses `claude plugin marketplace add` and `claude plugin install`
- **MCP servers:** `~/.claude/settings.json:mcpServers` - JSON config for MCP servers
- **Brewfile:** `~/.dotfiles/Brewfile` - Homebrew dependencies
- **Custom scripts:** `~/.dotfiles/bin/` - Executable scripts added to PATH

### Key Files

- `~/.dotfiles/claude/install.sh` - Plugin and skill installation
- `~/.claude/settings.json` - Claude global settings (MCP, plugins, permissions)
- `~/.dotfiles/.claude/settings.json` - Project-level permissions
- `~/.dotfiles/Brewfile` - Homebrew packages
- `~/.dotfiles/bin/` - Custom scripts directory

### Current State

```json
// ~/.claude/settings.json (current)
{
  "permissions": { "allow": ["Bash(gh pr view:*)", "Bash(gh pr diff:*)"] },
  "enabledPlugins": {
    "browser-automation@browser-tools": true,  // TO REMOVE
    "document-skills@anthropic-agent-skills": true,
    "example-skills@anthropic-agent-skills": true
  },
  "mcpServers": {
    "linear": { "command": "npx", "args": ["-y", "mcp-remote", "https://mcp.linear.app/sse"] }
  }
}
```

### Hook Configuration

Claude Code hooks are configured in settings.json under a `hooks` key. PreToolUse hooks can intercept tool calls before execution.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Vercel AI Browser MCP not working | Low | Med | Test before removing old plugin |
| Hook breaks legitimate rm usage | Low | Med | Allow passthrough for non-Claude contexts; test thoroughly |
| `trash` not installed | Low | Low | Add to Brewfile; hook checks for presence |
| Linear auth issues | Med | Low | Linear already configured; test auth flow |
| Ralph Wiggum infinite loops | Med | Med | Add max iteration limit; require explicit count arg |

---

## Non-Goals (v1)

Explicitly out of scope:

- **Other MCP servers** - Focus only on browser cleanup, Linear, not adding new servers
- **Hook for other dangerous commands** - Only `rm` for now; can expand later
- **GUI for Ralph Wiggum** - CLI-only; no TUI/GUI wrapper
- **Removing other plugins** - document-skills and example-skills stay

---

## Open Questions

| Question | Owner | Status |
|----------|-------|--------|
| Exact Vercel AI Browser MCP config format? | Mike | Open - needs research |
| Does `trash` preserve all rm flags behavior? | Mike | Open - verify compatibility |
| Linear MCP auth - token or OAuth? | Mike | Open - test current config |
