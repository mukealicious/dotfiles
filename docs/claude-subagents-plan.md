# Claude Code Subagents

Port dmmulroy's specialized AI agents to Claude Code as native subagents.

## Summary

Add 3 specialized **subagents** to your dotfiles:
- **Oracle** - Senior advisor for architecture, code review, complex debugging (uses Opus)
- **Librarian** - Multi-repo explorer for understanding external libraries
- **Review** - Focused code reviewer for bugs and security

**Subagents** = isolated AI instances with custom prompts, tool restrictions, and model selection. They run in their own context window and return results to the main conversation.

## Directory Structure

```
~/.dotfiles/
└── claude/
    ├── install.sh            # MODIFY - add agents symlink logic
    ├── agents/               # NEW - Claude Code subagents
    │   ├── oracle.md
    │   ├── librarian.md
    │   └── review.md
    └── skills/               # Existing (unchanged)
```

## Phase 1: Create Subagent Directory

```bash
mkdir -p ~/.dotfiles/claude/agents
```

## Phase 2: Create Subagents

### 2.1 Oracle Subagent
Create `claude/agents/oracle.md`

Source: `/Users/mikeywills/Code/dmmulroy/.dotfiles/home/.config/opencode/agent/oracle.md`

Frontmatter:
```yaml
---
name: oracle
description: Senior engineering advisor for code reviews, architecture decisions, complex debugging, and planning. Invoke when deeper analysis is needed before acting.
tools: Read, Grep, Glob, WebFetch
model: opus
---
```

Key features:
- Read-only tools (no Edit/Write)
- Uses Opus for deeper reasoning
- Response format: TL;DR → Recommendation → Rationale → Risks → When to Reconsider
- Effort estimates: S/M/L/XL

### 2.2 Librarian Subagent
Create `claude/agents/librarian.md`

Source: `/Users/mikeywills/Code/dmmulroy/.dotfiles/home/.config/opencode/agent/librarian.md`

Frontmatter:
```yaml
---
name: librarian
description: Multi-repository codebase expert for understanding library internals and remote code. Use when exploring GitHub/npm repositories or tracing code through unfamiliar libraries.
tools: Read, Grep, Glob, WebFetch, Bash
disallowedTools: Edit, Write
model: sonnet
---
```

Key features:
- Read-only with Bash for git operations
- GitHub URL linking conventions for references
- Mermaid diagram support for complex flows

### 2.3 Review Subagent
Create `claude/agents/review.md`

Source: `/Users/mikeywills/Code/dmmulroy/.dotfiles/home/.config/opencode/agent/review.md`

Frontmatter:
```yaml
---
name: review
description: Code reviewer focusing on bugs, security, and structure. Use for PR reviews or after code changes.
tools: Read, Grep, Glob, WebFetch
disallowedTools: Edit, Write
model: sonnet
---
```

Key features:
- Focused on bugs, not style
- Reads full files, not just diffs
- Matter-of-fact tone, no flattery

## Phase 3: Update Install Script

### Modify `claude/install.sh`
Add subagent symlink logic after the skills section:

```bash
# Symlink subagents
AGENTS_SOURCE="$DOTFILES_ROOT/claude/agents"
AGENTS_TARGET="$HOME/.claude/agents"

if [ -d "$AGENTS_SOURCE" ]; then
  mkdir -p "$AGENTS_TARGET"
  for agent_file in "$AGENTS_SOURCE"/*.md; do
    if [ -f "$agent_file" ]; then
      agent_name=$(basename "$agent_file")
      target="$AGENTS_TARGET/$agent_name"
      if [ -L "$target" ]; then
        echo "  ~/.claude/agents/$agent_name symlink already exists"
      elif [ -e "$target" ]; then
        echo "  Warning: ~/.claude/agents/$agent_name exists (not a symlink)"
      else
        echo "  Linking ~/.claude/agents/$agent_name -> $agent_file"
        ln -s "$agent_file" "$target"
      fi
    fi
  done
  echo "  Claude Code agents setup complete!"
fi
```

## Files to Create

| File | Source | Notes |
|------|--------|-------|
| `claude/agents/oracle.md` | dmmulroy oracle.md | Opus, read-only, deep analysis |
| `claude/agents/librarian.md` | dmmulroy librarian.md | Sonnet, read-only + Bash, external exploration |
| `claude/agents/review.md` | dmmulroy review.md | Sonnet, read-only, bug-focused |

## Files to Modify

| File | Changes |
|------|---------|
| `claude/install.sh` | Add agents symlink logic |

## Verification

1. Run `dot` or `script/install`
2. Check subagents exist:
   ```bash
   ls -la ~/.claude/agents/
   ```
3. In Claude Code, run `/agents` to see them listed
4. Test each subagent:
   ```
   Use the oracle agent to review this architecture approach
   Use the librarian to explore how zod validates schemas
   Use review to check my recent changes
   ```

## Claude Code Subagent Reference

| Field | Purpose | Values |
|-------|---------|--------|
| `name` | Identifier | lowercase, hyphens |
| `description` | When Claude delegates | Be specific |
| `tools` | Allowed tools | Read, Grep, Glob, Bash, Edit, Write, WebFetch, etc. |
| `disallowedTools` | Denied tools | Removed from inherited list |
| `model` | Model to use | `opus`, `sonnet`, `haiku`, `inherit` |

## Optional Future Enhancements

- **Hooks**: Add `PreToolUse` hooks for command validation
- **Skill preloading**: Use `skills` field to inject domain knowledge
- **Background execution**: Ctrl+B to run subagents concurrently
