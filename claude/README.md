# Claude Code Skills & Agents

Claude-specific overlays, projected shared skills, and subagents for automated agentic workflows.

## Runtime Architecture

Claude runtime files now use a mix of symlinks and managed assembled outputs:

```mermaid
graph LR
    subgraph "Dotfiles Repo"
        settings["claude/settings.json"]
        shared_skills["ai/skills/*"]
        claude_skills["claude/skills/*"]
        review_body["ai/agents/review.body.md"]
        review_meta["claude/agents/review.frontmatter"]
        legacy_agents["claude/agents/{oracle,librarian}.md"]
        hooks_src["claude/hooks/*"]
    end

    subgraph "~/.claude/"
        settings_dst["settings.json"]
        skills_dst["skills/*"]
        review_dst["agents/review.md"]
        legacy_agents_dst["agents/{oracle,librarian}.md"]
    end

    settings -->|symlink| settings_dst
    shared_skills -->|projected| skills_dst
    claude_skills -->|overlay| skills_dst
    review_body -->|assemble| review_dst
    review_meta -->|assemble| review_dst
    legacy_agents -->|symlink| legacy_agents_dst
```

**Key files:**
- `settings.json` → `~/.claude/settings.json` - Global permissions, hooks, plugins, MCP servers
- `ai/skills/*` + `claude/skills/*` → `~/.claude/skills/*` - Portable skills plus Claude-specific overlays
- `ai/agents/review.body.md` + `claude/agents/review.frontmatter` → `~/.claude/agents/review.md` - Shared-body exemplar agent
- `agents/{oracle,librarian}.md` → `~/.claude/agents/{oracle,librarian}.md` - Legacy combined subagents pending migration
- `hooks/` - PreToolUse, Stop, and Notification hooks (referenced from settings.json)

**Installation flow:**
1. `script/bootstrap` or `bin/dot` runs all `*/install.sh` scripts
2. `claude/install.sh` symlinks settings.json and installs plugins
3. `ai/install.sh` projects shared skills from `ai/skills/`, applies `claude/skills/` overlays, assembles `review`, and symlinks the remaining legacy agents

Author portable skills in `ai/skills/`, keep `claude/skills/` for Claude-native overlays, and edit repo files rather than `~/.claude/`.

## Structure

```
ai/
├── agents/
│   └── review.body.md      # Shared review body
└── skills/                 # Portable skills projected into ~/.claude/skills (11 skills)
    ├── build-skill/        # Skill authoring guide
    ├── code-review/        # Parallel code review
    ├── dotfiles-dev/       # Dotfiles development guide
    ├── favicon-generator/  # Favicon generation
    ├── feedback-loop/      # Structured self-validation
    ├── librarian/          # Multi-repo exploration
    ├── opensrc/            # External package/repo source context
    ├── qmd/                # Markdown search
    ├── spec-planner/       # Dialogue-driven specs
    ├── sprint-plan/        # Sprint planning
    └── workspace-snapshot/ # Quick workspace orientation

claude/
├── install.sh              # Symlinks settings.json + installs plugins
├── settings.json           # Global config (permissions, hooks, MCP)
├── hooks/                  # Lifecycle hooks
│   ├── safety-rm.sh        # PreToolUse: rewrites rm to trash
│   └── notify-idle.sh      # Stop/Notification: sound + macOS alert
├── agents/                 # Subagents (specialized AI advisors)
│   ├── oracle.md           # Legacy combined agent (Opus)
│   ├── librarian.md        # Legacy combined agent
│   └── review.frontmatter  # Shared-body exemplar metadata
└── skills/                 # Claude-only overlays (currently empty; shared skills projected here by ai/install.sh)
```

## Subagents

Specialized AI advisors invoked via natural language:

| Agent | Model | Purpose |
|-------|-------|---------|
| **oracle** | Opus | Senior advisor for architecture, planning, complex debugging |
| **librarian** | Sonnet | Multi-repo explorer for external libraries |
| **review** | Sonnet | Code reviewer focused on bugs, security |

**Usage:**
```
Use the oracle agent to review this architecture
Use the librarian to explore how zod validates schemas
Use review to check my recent changes
```

## Skills

Shared skills live in `ai/skills/` and are projected to `~/.claude/skills/` at install time. Claude-only overlays in `claude/skills/` remain optional and are currently empty. See `ai/README.md` for the full inventory.

Key skills available via slash command or auto-trigger:

| Skill | Purpose |
|-------|---------|
| `code-review` | Parallel code review with architecture validation |
| `spec-planner` | Dialogue-driven spec development |
| `sprint-plan` | Break projects into demoable sprints |
| `feedback-loop` | Self-validate work through structured loops |
| `opensrc` | Fetch source context for packages and repos |
| `build-skill` | Guidance for creating new skills |
| `dotfiles-dev` | Guidance for working with this dotfiles repo |

## Adding New Skills

1. Create `ai/skills/<name>/` for a shared skill, or `claude/skills/<name>/` only for a Claude-only overlay.
2. Add `SKILL.md` with YAML frontmatter:
   ```yaml
   ---
   name: skill-name
   description: Brief description of what the skill does
   ---
   ```
3. Add supporting scripts/resources next to the skill when needed.
4. Run `bin/dot` to refresh the runtime projections.

Default to `ai/skills/`. Use `claude/skills/` only when the skill truly depends on Claude-specific features such as hooks, `$SKILL_DIR`, plugins, or subagent-specific runtime behavior.

## Adding New Agents

Prefer the shared-body pattern for new portable agents:

1. Create `ai/agents/<name>.body.md` with the neutral agent instructions.
2. Create `claude/agents/<name>.frontmatter` with Claude-specific metadata:
   ```yaml
   name: agent-name
   description: When to use this agent
   tools: Read, Grep, Glob, WebFetch
   disallowedTools: Edit, Write
   model: sonnet
   ```
3. Run `bin/dot` to assemble the installed runtime file.

`oracle` and `librarian` still use the older combined `agents/<name>.md` format until they are migrated.

## How Skills Work

Skills use "progressive disclosure" - Claude loads information in stages:
1. **Metadata**: Name and description (always loaded)
2. **Instructions**: The SKILL.md content (loaded when skill is triggered)
3. **Resources**: Supporting files/scripts (loaded as needed via bash commands)

Skills are invoked automatically by Claude when the user's request matches the skill's description.

## Plugins

Installed from official marketplaces:

| Plugin | Source | Purpose |
|--------|--------|---------|
| **document-skills** | anthropic-agent-skills | PDF, XLSX, PPTX, DOCX creation/editing |
| **playground** | claude-plugins-official | Interactive HTML playgrounds for visual collaboration |

The playground plugin generates standalone HTML files for:
- Visualizing codebase architecture
- Adjusting component design
- Brainstorming layouts
- Tweaking interactive parameters

## Installation

The `install.sh` script is automatically run by:
- `script/install` (during initial setup)
- `bin/dot` (during updates)

Or run manually:
```bash
./claude/install.sh
```

## Documentation

- [Claude Skills Overview](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview)
- [Skills Quickstart](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/quickstart)
- [Best Practices](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices)
