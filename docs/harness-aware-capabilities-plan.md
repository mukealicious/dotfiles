# Plan: Harness-Aware AI Capabilities

> **Status**: Partially implemented — shared portable skills and harness-aware instructions are live; shared-agent assembly is now validated with one exemplar, and broader agent rollout remains optional.
> **Execution Plan**: `docs/sprint-plan-harness-portability-core.md`

## Why this plan exists

The original version of this plan focused on **subagent model selection**. That solves only part of the problem.

What we actually want is broader:

- A **shared default core** for instructions and skills, with shared agent roles only where they add real harness value
- **Harness-aware model/provider policy**
  - Claude Code → Anthropic / Max-plan-friendly defaults
  - Pi → OpenAI / API-friendly defaults
  - OpenCode → OpenAI / API-friendly defaults
- **Harness-specific customization** where the UX, tool surface, or extension model differs
  - Claude hooks, subagents, MCP patterns
  - Pi extensions, package-based add-ons, and custom tool wrappers
  - OpenCode-specific config and agent format when needed

In other words: this is not just an agent problem. It is a **shared capabilities + harness adapters** problem.

## Goals

1. Keep the **intent** of instructions, skills, and agents shared where possible.
2. Let each harness choose the **best provider/model** for that environment.
3. Preserve room for **Pi-specific** and **Claude-specific** behavior without polluting the shared core.
4. Minimize duplication, but do **not** force everything into one file format when the harnesses differ.
5. Make the layout easy to reason about by answering:
   - What is shared?
   - What is harness-specific?
   - How does the assembled output appear in practice?

## Mental model

Think in three layers:

```text
                     ┌──────────────────────────┐
                     │       Shared Core        │
                     │          `ai/`           │
                     │                          │
                     │  base instructions       │
                     │  shared skills           │
                     │  shared agent bodies     │
                     │  model policy docs       │
                     └────────────┬─────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
              ▼                   ▼                   ▼
    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
    │ Claude Adapter  │ │   Pi Adapter    │ │ OpenCode Adapt  │
    │   `claude/`     │ │     `pi/`       │ │  `opencode/`    │
    │                 │ │                 │ │                 │
    │ Anthropic       │ │ OpenAI          │ │ OpenAI          │
    │ Max-plan aware  │ │ API-first       │ │ API-first       │
    │ hooks + MCP     │ │ extensions      │ │ config only     │
    │ skill overlays  │ │ skill overlays  │ │ skill overlays  │
    │ agent metadata  │ │ agent metadata  │ │ agent metadata  │
    └────────┬────────┘ └────────┬────────┘ └────────┬────────┘
             │                   │                   │
             ▼                   ▼                   ▼
      `~/.claude/...`     `~/.pi/agent/...`   `~/.config/opencode/...`
```

**Key idea**: the shared layer defines the **capability**, while each harness adapter defines **how that capability is delivered** in that runtime.

## Design principles

- **Instructions + skills are the primary portability layer**: start with shared instructions and shared skills before introducing harness-native agent formats.
- **Shared by default**: if a capability is conceptually the same across harnesses, start in `ai/`.
- **Harness-specific by necessity**: if the prompt, tools, or integration differs materially, customize at the harness layer.
- **Use the simplest composition model that fits**:
  - instructions → assemble shared base + harness appendix
  - skills → prefer shared skill directories, with harness-specific overrides only when needed
  - agents (optional) → assemble shared body + harness frontmatter (+ optional appendix) only when named harness-native agents are genuinely helpful
- **Adapters own runtime format**: `claude/`, `pi/`, and `opencode/` decide the final file shape expected by that harness.
- **Do not source installers into each other**: keep shared assembly logic small inside `ai/install.sh` for now, and extract a tiny library only if the duplication becomes real.

## Proposed repository layout

This does **not** require every file or directory to exist on day one. It is a target shape.

```text
ai/
  instructions/
    base.md                     # Shared baseline instructions for all harnesses
  skills/
    sprint-plan/
    commit/
    uv/
    web-browser/
    ...
  agents/
    oracle.body.md              # Shared role / task body only
    librarian.body.md
    review.body.md
  policy/
    models.md                   # Human-readable model/provider policy
  lib/
    assemble.sh                 # Shared installer helpers (future)

claude/
  instructions/
    appendix.md                 # Claude-specific guidance
  skills/
    code-review/
    ...
  agents/
    oracle.frontmatter
    librarian.frontmatter
    review.frontmatter
    oracle.appendix.md          # Optional; only when Claude needs extra guidance
    librarian.appendix.md
    review.appendix.md
  hooks/
  settings.json

pi/
  instructions/
    appendix.md                 # Pi-specific guidance
  skills/                       # Optional; only for Pi-specific skill overlays
  agents/
    oracle.frontmatter
    librarian.frontmatter
    review.frontmatter
    oracle.appendix.md          # Optional
    librarian.appendix.md
    review.appendix.md
  extensions/
  settings.json

opencode/
  instructions/
    appendix.md                 # OpenCode-specific guidance
  skills/                       # Optional; only when OpenCode differs
  agents/
    oracle.frontmatter          # Deferred until OpenCode agent support is wired
    librarian.frontmatter
    review.frontmatter
  settings.json
```

## Naming note

Keep the current top-level structure:

```text
ai/
claude/
pi/
opencode/
```

Rationale:

- `ai/` is the shared cross-harness core, so it remains the home for portable instructions, skills, agent bodies, and policy.
- `claude/`, `pi/`, and `opencode/` stay top-level because they are not just agent definitions; they are full harness packages with their own installers, settings, and native integrations.
- Using `ai/claude` or `ai/pi` would imply those harnesses are merely subfolders of the shared layer, when in practice they are peer adapters around that shared core.
- This keeps the filesystem simple while still supporting the conceptual model: shared core in `ai/`, harness adapters beside it.

## Skill Runtime Formats

For cross-harness portability, treat `.agents/skills/` and `.claude/skills/` as **runtime output formats**, not authoring sources.

```text
authoring source
  ai/skills/<name>/

runtime outputs
  .agents/skills/<name>/   # Codex-style
  .claude/skills/<name>/   # Claude-style
```

Rules:

- Write portable skills once in `ai/skills/`.
- Mirror, symlink, or assemble them into both runtime formats.
- Neither runtime directory is primary.
- Add harness-specific overlays only when a skill truly needs them.

In this repo, `ai/install.sh` is responsible for refreshing `.agents/skills/` and `.claude/skills/` as local runtime projections. They are outputs of the shared authoring layer, not places to author portable skills.

## What is shared vs customized?

| Capability Type | Shared Source | Harness Layer | Composition Strategy |
|---|---|---|---|
| Base instructions | `ai/instructions/base.md` | Harness appendix only when needed (`claude/instructions/appendix.md`, `pi/instructions/appendix.md`, `opencode/instructions/appendix.md`) | Assemble |
| Portable skills | `ai/skills/*` | none, unless needed | Project to runtime skill dirs or discover directly |
| Harness-specific skills | none | `claude/skills/*`, `pi/skills/*`, `opencode/skills/*` | Harness-only install |
| Agent role bodies | `ai/agents/*.body.md` | `*/agents/*.frontmatter`, optional `*.appendix.md` | Assemble |
| Harness-native behavior | none | `claude/hooks/*`, `pi/extensions/*` | Native runtime config |
| Model/provider defaults | `ai/policy/models.md` | `pi/settings.json`, harness frontmatter, future OpenCode config | Document once, enforce per harness |

## How this works in practice

### 1. Instructions: shared defaults + harness appendix

Today the repo symlinks the same instruction content into multiple harnesses. That is convenient, but it cannot express harness-specific policy cleanly.

Target model:

```text
ai/instructions/base.md
+ claude/instructions/appendix.md
= ~/.claude/CLAUDE.md

ai/instructions/base.md
+ pi/instructions/appendix.md
= ~/.pi/agent/AGENTS.md

ai/instructions/base.md
+ opencode/instructions/appendix.md
= ~/.config/opencode/AGENTS.md

ai/instructions/base.md
= ~/.codex/instructions.md

ai/instructions/base.md
= ~/.gemini/GEMINI.md
```

Example:

- Shared base says: prefer surgical changes, obey repo-local instructions, and update plans for multi-step tasks.
- Claude appendix says: lean on Claude-native subagents, hooks, MCP servers, and plugins when they help.
- Pi appendix says: prefer Pi-native extensions and intercepted commands instead of assuming Claude-specific tooling.
- Codex and Gemini currently use the shared base alone because they do not need extra harness policy yet.

This gives one shared voice, plus harness-specific behavior.

### 2. Skills: shared baseline, harness-specific overlays

Skills should be part of this plan, but they do **not** need the same assembly mechanism as agents.

The right model for skills is:

```text
             Shared skill?
                   │
         ┌─────────┴─────────┐
         │                   │
        yes                 no
         │                   │
         ▼                   ▼
   `ai/skills/<name>/`   harness-specific directory
                         (`claude/skills/`, `pi/skills/`,
                          `opencode/skills/`)
```

In practice:

- `ai/skills/commit/` remains shared because the workflow is portable.
- `ai/skills/sprint-plan/` is shared because clarification, sprint shaping, task atomicity, validation, and markdown output are portable.
- `pi/extensions/notify.ts` stays Pi-native because it uses Pi's extension API, not the skill standard.

**Important distinction**:

- Use `ai/skills/` for **portable capabilities**.
- Use `claude/skills/`, `pi/skills/`, or `opencode/skills/` only when the harness truly needs a different implementation.
- If a shared skill works cleanly on its own, delete the harness wrapper instead of keeping a same-name duplicate beside it.
- Use `pi/extensions/` or `claude/hooks/` for features that are not skills at all, but runtime integrations.

### 3. Agents: shared role body + harness-specific metadata

Harness-native agents are optional. Baseline portability should flow through shared instructions plus shared skills; use assembled agent files only when a harness benefits from named agent metadata, tool restrictions, or model overrides.

Sprint 4 validates this with `review` first. It is the low-risk read-only exemplar; `oracle` and `librarian` stay in the legacy Claude-only combined format until later migrations.

```text
Claude assembled agent
----------------------
claude/agents/review.frontmatter
+ ai/agents/review.body.md
+ claude/agents/review.appendix.md      (optional)
= ~/.claude/agents/review.md

Pi assembled agent
------------------
pi/agents/review.frontmatter
+ ai/agents/review.body.md
+ pi/agents/review.appendix.md          (optional)
= ~/.pi/agent/agents/review.md
```

This lets the **role** stay shared while the **provider**, **tools**, and **harness-specific caveats** differ.

## Visual examples

### Example A: the same capability across harnesses

User intent:

```text
"Figure out how zod validation works internally"
```

Shared capability:

```text
librarian
- inspect docs
- inspect source
- trace control flow
- explain what matters
```

Harness-specific delivery:

```text
Claude Code
- agent: librarian
- model family: Anthropic
- tuned for Claude subagent UX
- can use Claude's allowed tool schema

Pi
- agent: librarian
- model family: OpenAI
- tuned for Pi's tool naming / extension environment
- may lean on Pi-native shell or repo helpers

OpenCode (later)
- agent: librarian
- model family: OpenAI
- tuned for OpenCode's agent schema
```

Same capability, different runtime policy.

### Example B: a shared skill with no harness customization

```text
Capability: `commit`
Location: `ai/skills/commit/`
Reason: workflow is mostly instructions and shell usage; no harness-native APIs required

Installed/discovered by:
- Claude Code
- Pi
- OpenCode
- Codex
```

No extra adapter needed.

### Example C: a migrated shared skill

```text
Capability: `sprint-plan`
Location: `ai/skills/sprint-plan/`
Reason: the core planning workflow is portable; the old Claude-only slash-command,
subagent-review, and TaskCreate steps were optional glue and were removed instead
of preserved as a permanent wrapper

Installed/discovered by:
- Claude Code
- Pi
- OpenCode
- Codex
```

No adapter needed after migration.

### Example D: a Pi-only enhancement

```text
Capability: desktop notifications
Location: `pi/extensions/notify.ts`
Reason: this is not a skill body; it is a Pi runtime integration

Installed only for:
- Pi
```

This keeps Pi power-user customizations where they belong.

## Provider and model policy

A small policy table makes the intended behavior obvious.

| Harness | Main Session Default | Specialized Agents | Rationale |
|---|---|---|---|
| Claude Code | Anthropic | Anthropic | Keep Claude Code aligned with Max-plan-friendly, native Claude workflows |
| Pi | OpenAI | OpenAI | Avoid third-party harness dependence on Anthropic / Max plans |
| OpenCode | OpenAI | OpenAI | Keep API-first and consistent with OpenCode usage |

A future `ai/policy/models.md` can document specific choices, for example:

```text
Claude Code
- main: Anthropic high-end model
- oracle: Anthropic high-end model
- librarian: Anthropic mid/high model
- review: Anthropic mid model

Pi
- main: OpenAI GPT-5.x
- oracle: OpenAI GPT-5.x high reasoning
- librarian: OpenAI GPT-5.x medium/high
- review: OpenAI GPT-5.x medium

OpenCode
- main: OpenAI GPT-5.x
- agents: deferred until agent wiring exists
```

This policy should be documented once and then reflected in each harness's config/frontmatter.

## Recommended composition rules

### Instructions

Use assembly.

```text
shared base + harness appendix -> installed instruction file
```

### Skills

Use overlay / precedence, not heavy assembly.

```text
shared skills
then harness-specific skills of the same name override only in that harness
```

This matches how people reason about capabilities and avoids inventing a complex multi-file skill build system too early.

When the shared skill already covers the capability, prefer deleting the same-name harness wrapper. Keep overlays only when they add small runtime-specific glue that can disappear without losing the core skill.

### Agents

Use assembly.

```text
frontmatter + shared body + optional harness appendix -> installed agent file
```

### Extensions / hooks

Do not force them into the shared model.

```text
Pi extensions remain in `pi/extensions/`
Claude hooks remain in `claude/hooks/`
```

## Migration notes and implementation advice

### 1. Introduce a tiny shared installer library

Do **not** source `ai/install.sh` from `pi/install.sh`.

Instead, keep the shared assembly helpers in `ai/install.sh` for now. If the duplication grows later, extract a tiny shared library then.

Potential helpers if that extraction becomes worthwhile:

- `assemble_file part1 part2 [part3] output`
- `write_managed_file output`
- `clean_managed_dir dir pattern`

This keeps installers independent while sharing the truly reusable bits.

### 2. Be careful when replacing current Claude agent symlinks

Current Claude agents are symlinked from `ai/install.sh`. Redirecting with `cat ... > ~/.claude/agents/oracle.md` will follow the symlink and overwrite the repo file instead of replacing the installed artifact.

Any migration from symlinked agents to assembled files should:

1. detect an existing symlink
2. remove it
3. write the new managed file atomically

### 3. Clean up stale generated files explicitly

`clean_dead_symlinks` only removes broken symlinks. Once agents become generated files, the installers need a small cleanup rule for old managed artifacts.

### 4. Stop treating Claude-specific skills as OpenCode defaults

Current behavior installs `claude/skills/` into OpenCode as well. That is convenient, but it blurs the adapter boundary.

Target behavior:

- OpenCode gets `ai/skills/` by default
- OpenCode gets `opencode/skills/` only when needed
- Claude-specific skills stay Claude-specific

### 5. Keep appendices optional

Not every capability needs them.

If a shared body works cleanly across harnesses, do not add extra files just to satisfy symmetry.

## Phased implementation plan

### Phase 1 — Document the architecture and policy

- Expand this plan from agents-only to capabilities
- Document what belongs in `ai/`, `claude/`, `pi/`, and `opencode/`
- Define provider/model policy in one place

### Optional Phase 2 — Shared agent bodies + harness frontmatter

- Create `ai/agents/*.body.md`
- Convert `claude/agents/*.md` into `*.frontmatter` + shared bodies
- Create `pi/agents/*.frontmatter`
- Assemble installed agent files for Claude and Pi
- Keep OpenCode agents deferred

### Phase 3 — Harness-aware instructions

- Move from one shared instruction symlink to:
  - `ai/instructions/base.md`
  - `claude/instructions/appendix.md`
  - `pi/instructions/appendix.md`
  - `opencode/instructions/appendix.md`
- Assemble harness-specific instruction files at install time

### Phase 4 — Skill boundary cleanup

- Keep `ai/skills/` as the portable default layer
- Audit `claude/skills/` and keep only the ones that truly depend on Claude-specific behavior
- Stop installing `claude/skills/` into OpenCode by default
- Add `pi/skills/` or `opencode/skills/` only where a genuine harness-specific variant is needed

### Optional Phase 5 — OpenCode agent support

- Add `opencode/agents/*.frontmatter` only if OpenCode agent support is actually needed, wired, and verified
- Reuse the shared agent bodies introduced in Optional Phase 2 when that extra harness-native layer is worth the complexity

## Verification checklist

1. Run `~/.dotfiles/ai/install.sh`
   - verify shared skills install correctly
   - verify Claude assembled agents are written correctly
2. Run `~/.dotfiles/pi/install.sh`
   - verify Pi settings still link correctly
   - verify Pi assembled agents are written correctly
   - verify Pi extensions and packages still install normally
3. Verify harness-specific instruction files assemble as expected once Phase 3 lands
4. Confirm OpenCode receives only intended shared skills by default
5. Compare assembled Claude agent output with current agent content before removing old combined files
6. Run `bin/dot` to validate the full install pipeline

## Open questions

### Resolved

- Pi agent frontmatter has now been verified to support comma-separated `tools`, optional `model`, and optional `thinking`; keep using Pi's current agent frontmatter support as the source of truth for future migrations.
- Shared instructions no longer rely on a repo-level symlink source; `~/.AGENTS.md` remains only as a base-only compatibility output assembled from `ai/instructions/base.md`.

### Open

- When OpenCode agent support is added, what file format differences exist versus Claude and Pi?
- Should `pi/skills/` exist immediately, or only after a concrete Pi-specific skill use case appears?

## Short version

If this architecture is working well, the repo becomes easy to explain:

```text
`ai/` defines the portable capability.
`claude/`, `pi/`, and `opencode/` adapt that capability to a harness.
Installers assemble or install the final runtime artifacts.
Pi- and Claude-native power features stay native instead of leaking into shared files.
```

That is the outcome this plan should optimize for.
