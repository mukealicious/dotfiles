---
name: agent-context
description: Create, audit, and refine repo-local AGENTS.md guidance that orients future agents to a repository, package, or subsystem. Use when adding local agent instructions, extracting durable context from a session, reducing bloated agent docs, or deciding where nested AGENTS.md files belong.
references:
  - references/good-agents-example.md
---

# Agent Context

Use this skill to make agent-facing repository context useful: compact, grounded,
verified, and local to the work agents will do.

`AGENTS.md` should be an execution contract for future agents, not a README,
runbook, style guide, or memory dump.

## Core Principles

- Prefer `AGENTS.md` as the source of truth. Tool-specific files should import,
  point to, or adapt from it where possible.
- Optimize for behavior-changing context. Litmus test: would removing this make
  an agent more likely to make a mistake?
- Ground claims in the repo. Verify commands, paths, ownership, and generated
  file rules before writing them.
- Keep root guidance short; push subsystem details into nested `AGENTS.md` files.
- Preserve curated human context. Prefer minimal diffs over rewrites.
- Get out of the way. Do not include generic advice like “write clean code,”
  obvious language conventions, or long tutorials.

## When to Create or Update Agent Context

Create or update agent guidance when you have durable knowledge about:

- what a repo, package, or folder owns
- why that area matters or what can break
- non-obvious architecture, data flow, or invariants
- commands that are hard to infer but important to run
- generated/runtime files agents must not edit directly
- local gotchas, failure modes, or safety boundaries
- where to start for common changes

Do not add content when it is:

- one-off conversation context
- already obvious from nearby code/config
- generic engineering advice
- a long procedure better suited to docs or a runbook
- an unstable file list that will go stale quickly

## Root vs Nested Files

Use a root `AGENTS.md` for repo-wide rules only:

- project purpose and high-level architecture map
- package/topic index and where to look first
- canonical commands verified from repo config
- global safety, secrets, generated-file, and install rules
- links to nested `AGENTS.md` or docs for details

Use nested `AGENTS.md` files for local context:

- folder/package ownership and boundaries
- local mental model or data flow
- key files and edit risks
- local invariants and gotchas
- local verification commands
- common changes and where to start

Nested guidance should not repeat root guidance unless the local area overrides
or sharpens it.

## Authoring Workflow

1. **Find existing guidance**
   - Search for `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.cursorrules`,
     `.cursor/rules`, `.windsurfrules`, `.github/copilot-instructions.md`.
   - Identify the current source of truth and any generated/adapted files.

2. **Inspect before writing**
   - Read nearby README/docs, manifests, workflows, and the files the guidance
     would name.
   - Verify commands from `package.json`, `Makefile`, `justfile`, `pyproject.toml`,
     `Cargo.toml`, `go.mod`, CI workflows, or repo scripts.
   - Do not invent commands or architecture.

3. **Choose scope**
   - If a rule applies everywhere, update root `AGENTS.md`.
   - If context only helps inside one package/folder, create or update a nested
     `AGENTS.md` there.
   - If content is long procedural detail, link to a doc/runbook instead.

4. **Write high-signal sections**
   - Prefer tables and bullets.
   - Use exact paths and commands.
   - Include only stable facts and decision-shaping context.

5. **Validate**
   - Check referenced paths exist.
   - Check commands are real; run the smallest safe verification when practical.
   - Check tool-specific adapter files do not drift from the source of truth.

## Local `AGENTS.md` Template

Use only the sections that add signal. For a concrete model with the intended
specificity, read `references/good-agents-example.md`.

```md
# <Area Name>

This folder owns <specific responsibility>. It exists because <why it matters>.

## Mental Model

- <Input/request/event starts here>
- <State/data/contract lives here>
- <Side effects happen here>
- <Output/UI/API/consumer observes it here>

## Key Files

| File | Role |
|---|---|
| `path/to/file` | <why agents should look here> |

## Invariants

- <Rule that must remain true after edits>
- <Public API, persistence, ordering, security, or compatibility constraint>

## Common Changes

| Task | Start here | Verify with |
|---|---|---|
| <change> | `path` | `<command>` |

## Gotchas

- <Symptom/cause/fix or non-obvious trap>
- <Generated file, cache, feature flag, migration, or runtime boundary>

## Boundaries

- Safe to edit: <paths or change types>
- Ask first: <prod, public API, migrations, secrets, destructive ops>
- Do not edit directly: <generated/runtime/vendor files>

## Related Context

| File | Load when |
|---|---|
| `../AGENTS.md` | <when broader context is needed> |
```

## Audit Checklist

Before finishing an agent-context change, check:

- [ ] The nearest `AGENTS.md` contains the most relevant local guidance.
- [ ] Root guidance is not carrying avoidable subsystem detail.
- [ ] Commands and paths are verified or omitted.
- [ ] No generic advice, stale file catalogs, or tutorial prose was added.
- [ ] Existing curated guidance was preserved unless demonstrably stale.
- [ ] Long procedures are linked, not copied.
- [ ] Tool-specific files either import/point to `AGENTS.md` or clearly explain why not.

## Update Modes

- **Create**: add the smallest useful file for an unserved repo/package/folder.
- **Refine**: replace generic/bloated content with verified local context.
- **Extract from session**: add only durable lessons that will prevent future
  mistakes; skip transient debugging notes.
- **Adapter cleanup**: make `CLAUDE.md`, Cursor, Windsurf, Copilot, or Gemini
  files point to the canonical source where the tool supports it.

## Good Content Filters

Keep content if it answers one of these:

- What is this agent working on?
- Why does this area matter?
- Where should the agent look first?
- What should the agent not touch?
- What invariant would be easy to break?
- What command proves the change works?

Cut content if it mainly says:

- be careful, write good code, or follow best practices
- a long explanation already covered by docs
- every file in the directory without explaining responsibility
- speculative plans that are not durable decisions
