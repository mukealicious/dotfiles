# Claude Code Configuration

Read this document before changing Claude settings, hooks, MCP, or advisor setup.
For shared instructions, skill authoring/projections, and agent assembly, read
[ai/README.md](../ai/README.md).

## Ownership

| Source | Owner / runtime |
|---|---|
| `claude/settings.json` | `claude/install.sh` links it to `~/.claude/settings.json` |
| `claude/hooks/` | Hook implementations referenced by settings |
| `ai/skills/` | `ai/install.sh` projects shared skills and links them into Claude runtimes |
| `claude/skills/` | Optional Claude-only authoring overlays; never a generated projection |
| `claude/agents/` | Combined advisor files and split `review` metadata, installed by `ai/install.sh` |

Author portable skills in `ai/skills/`. Use `claude/skills/` only for Claude-native
runtime requirements such as hooks, `$SKILL_DIR`, plugins, or subagent-specific
behavior. The [shared skill inventory](../ai/README.md#skill-inventory) owns
capability routing and invocation guidance; manual-only skills are not started
automatically.

No marketplace plugins are installed by this repo. Keep shared workflows
reviewable rather than adding a second harness-specific copy.

## Advisors

| Agent | Purpose |
|---|---|
| `oracle` | Architecture, planning, and complex debugging |
| `librarian` | Source-backed external-library investigation |
| `review` | Bugs, security, and change correctness |

Before delegating, follow the read-only advisor and implementation-routing
constraints in [CLAUDE.md](../CLAUDE.md#claude-code). Models and tool permissions
are defined in each role's frontmatter.

### Edit or Add an Agent

- Edit `oracle` and `librarian` in `claude/agents/<name>.md`.
- Edit `review`'s portable body in `ai/agents/review.body.md` and Claude metadata
  in `claude/agents/review.frontmatter`.
- New combined `claude/agents/<name>.md` roles are linked by `ai/install.sh`.
  Define explicit tool permissions and a task-routing description.
- The shared-body assembler currently handles only `review`; a new
  `*.body.md`/`*.frontmatter` pair alone is not sufficient. Inspect assembly
  support before adopting that pattern for another role.

Refresh installed roles with `ai/install.sh` when applying agent configuration.
Edit sources here, not assembled or linked files in `~/.claude/agents/`.

## MCP and Hooks

`claude/install.sh` removes the legacy user-scope `context7` entry and attempts
idempotent `grep_app` registration. `grep_app` is GitHub-wide discovery;
the shared `librarian`/`opensrc` workflows own source-backed investigation.
Inspect `claude mcp list` to verify local connections and authentication.
Other OAuth connections, including Linear, are machine/user-managed rather than
configured by this installer. Per-agent MCP scoping is not configured here.

The installer does not manage Codex MCP entries. If an old Codex `context7`
connection remains, remove it only as an explicitly intended one-time cleanup:

```bash
codex mcp remove context7
```

### Safety Hook

`hooks/safety-rm.sh` asks for confirmation and rewrites supported simple
destructive `rm` commands to `trash`, preserving path quoting. Complex `rm`
syntax can require review without a rewrite. This hook is not a shell sandbox or
a guarantee against deletion; shared approval and ownership rules still apply.

### Notifications and App Context

Stop/Notification hooks provide sound and macOS notifications. Herdr owns its
installed agent-state hook. The tldraw SubagentStart adapter forwards app-managed
context; inspect its source and the current hook settings before changing it.

## Installation

`script/install` and `bin/dot` run the topic installer. To apply only Claude
settings/MCP changes:

```bash
./claude/install.sh
```

Use `ai/install.sh` for instructions, skill projections, or agents instead.
Documentation-only changes need neither installer.

## Claude-Native Reference

Read these only when the task needs Claude-specific skill features or packaging:

- [Skills overview](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview)
- [Skills quickstart](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/quickstart)
- [Skill best practices](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices)
