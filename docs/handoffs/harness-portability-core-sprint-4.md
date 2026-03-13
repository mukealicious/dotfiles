# Handoff: Sprint 4 — Validate the Shared Agent Pattern

## Goal

Prove that the agent architecture can follow the same shared-core pattern by migrating one low-risk read-only exemplar agent to a shared body plus harness-specific metadata.

## Dependency Assumption

Assume Sprints 1 through 3 are complete and should not be reworked in this sprint.

## What Sprint 3 Completed

Sprint 3 is now implemented.

- Shared instructions now live in `ai/instructions/base.md`.
- Harness-specific instruction behavior now lives in small appendices:
  - `claude/instructions/appendix.md`
  - `pi/instructions/appendix.md`
  - `opencode/instructions/appendix.md`
- `ai/install.sh` now assembles installed instruction files as managed outputs instead of symlinking every harness to one shared prompt.
- `~/.AGENTS.md` still exists, but only as a base-only compatibility output. It is not the source of truth.
- The installer now already contains reusable managed-file helpers:
  - `MANAGED_INSTRUCTIONS_MARKER`
  - `write_managed_file`
  - `assemble_instruction_file`

These helpers are the most relevant implementation precedent for Sprint 4.

## Current Repo State

- Architecture doc: `docs/harness-aware-capabilities-plan.md`
- Sprint plan: `docs/sprint-plan-harness-portability-core.md`
- Shared AI installer: `ai/install.sh`
- Pi installer: `pi/install.sh`
- Existing Claude agents: `claude/agents/*.md`

Current state after Sprint 3:

- Portable skills already follow the shared-authoring pattern under `ai/skills/`.
- Instructions already follow the shared-base-plus-appendix pattern.
- Claude agents are still combined source files in `claude/agents/` and are still installed as symlinks into `~/.claude/agents/`.
- In a Conductor workspace, those installed symlinks may point at the canonical `~/.dotfiles/claude/agents/*.md` tree rather than the current workspace checkout. Treat both as legacy runtime artifacts during migration.
- There is no shared `ai/agents/` body yet.
- There is no `pi/agents/` metadata yet.
- OpenCode agent support is still deferred.

## Recommended Exemplar

Use `review` as the first shared-agent exemplar unless a stronger reason appears during implementation.

Why `review` is the safest choice:

- It is read-only.
- It is the shortest and simplest of the current agent prompts.
- It does not include special bootstrapping like “immediately load a skill”.
- It has fewer harness-specific workflow assumptions than `librarian`.

Avoid migrating all three agents in Sprint 4.

## In Scope

- Confirm the shared-agent split in docs
- Extract one shared read-only agent body
- Add harness-specific metadata for that exemplar
- Add safe managed assembly and cleanup logic

## Out Of Scope

- Migrating every existing agent
- Rewriting all agent prompts
- Full OpenCode agent support
- Major Pi-specific prompt tuning
- Revisiting shared instructions or shared skills unless Sprint 4 is blocked without a tiny follow-up fix
- Cleaning up legacy `~/.AGENTS.md` compatibility handling unless it directly blocks agent assembly

## Tasks

### 4.1 Confirm the shared-agent contract
- Lock down the doc rule: shared body in `ai/agents/`, harness metadata beside each harness.
- Name the exemplar agent explicitly in the docs.

### 4.2 Extract one shared agent body
- Move one read-only exemplar body into `ai/agents/`.
- Keep harness-specific frontmatter out of the shared file.

### 4.3 Add harness-specific metadata
- Create Claude frontmatter for the exemplar.
- Create Pi metadata for the exemplar if the exact Pi agent schema can be verified confidently.
- If Pi schema remains uncertain, verify it first before writing files; do not guess.

### 4.4 Add safe managed assembly
- Extend installer logic so assembled agent runtime files can replace current symlinks safely.
- Reuse the managed-file safety pattern from Sprint 3 rather than inventing a separate mechanism.

## Read These Files First

- `docs/harness-aware-capabilities-plan.md`
- `docs/sprint-plan-harness-portability-core.md`
- `docs/handoffs/harness-portability-core-sprint-4.md`
- `ai/install.sh`
- `pi/install.sh`
- `ai/agents/review.body.md`
- `claude/agents/review.frontmatter`
- `claude/agents/oracle.md`
- `claude/agents/librarian.md`

## Deliverables

- One shared agent body under `ai/agents/`
- Matching harness-specific metadata files
- Safe assembly/cleanup logic
- Docs confirming the pattern

## Validation

- Shared body contains no harness-specific frontmatter
- Assembled Claude output preserves the current agent behavior except for intentional metadata separation
- If Pi is included, assembled Pi output differs only where Pi metadata requires it
- Installer logic safely handles existing symlinked runtime outputs without overwriting repo source files
- Assembled Claude output is compared against the current combined source before removing or replacing the old combined file

## Gotchas

- Do not try to migrate every agent in one sprint.
- Do not overwrite repo source files by writing through an existing symlink.
- Expect some runtime symlinks to point at `~/.dotfiles` instead of the current workspace; that still counts as legacy runtime state to replace safely.
- Reuse Sprint 3’s managed-file pattern instead of building a second cleanup path.
- Do not assume Pi agent frontmatter syntax; verify it before implementing.
- Do not expand scope into OpenCode agent support.

## Suggested Fresh-Session Prompt

```text
Work on Sprint 4 from `docs/sprint-plan-harness-portability-core.md` using the handoff in `docs/handoffs/harness-portability-core-sprint-4.md`.

This is a fresh session. Please read the handoff file first and treat it as the source of context.

Assume Sprints 1 through 3 are complete.

Goal:
Validate the shared-agent pattern with one low-risk exemplar agent.

Important rules:
- Shared agent bodies belong in `ai/agents/`.
- Harness-specific metadata belongs beside each harness.
- Reuse the managed-file safety pattern already added to `ai/install.sh` during Sprint 3.
- Existing Claude runtime agent files may be symlinks, so avoid overwriting source files.
- Prefer `review` as the exemplar unless investigation shows a better low-risk choice.
- Do not migrate every agent in one pass.
- Do not expand scope into OpenCode agent support.

Deliverables:
- Extract one shared agent body.
- Add harness-specific metadata for the exemplar.
- Add safe assembly and cleanup logic.
- Update docs and summarize the pattern used.

Before editing, briefly restate the plan and the files you expect to touch.
```

## Conductor Quickstart Checklist

- Read `docs/harness-aware-capabilities-plan.md`
- Read `docs/sprint-plan-harness-portability-core.md`
- Read `ai/install.sh`
- Read `pi/install.sh`
- Read `ai/agents/review.body.md` and `claude/agents/review.frontmatter` first
- Implement only Sprint 4
- Assume Sprints 1 through 3 are complete
- Migrate one low-risk read-only exemplar only
- Keep shared body in `ai/agents/`
- Keep harness-specific metadata beside each harness
- Reuse the managed-file safety pattern from Sprint 3
- Be careful with existing symlinked runtime files
- Validate the assembly pattern and summarize what changed

## Conductor Kickoff Prompt

```text
Work on Sprint 4 from `docs/sprint-plan-harness-portability-core.md` using the handoff in `docs/handoffs/harness-portability-core-sprint-4.md`.

This is a fresh session. Please read the handoff file first and treat it as the source of context.

Assume Sprints 1 through 3 are complete.

Goal:
Validate the shared-agent pattern with one low-risk exemplar agent.

Important rules:
- Shared agent bodies belong in `ai/agents/`.
- Harness-specific metadata belongs beside each harness.
- Reuse the managed-file safety pattern from `ai/install.sh` instead of inventing a new cleanup path.
- Existing Claude runtime agent files may be symlinks, so avoid overwriting source files.
- Prefer `review` as the exemplar unless investigation finds a better low-risk option.
- Do not migrate every agent in one pass.
- Do not expand scope into OpenCode agent support.

Deliverables:
- Extract one shared agent body.
- Add harness-specific metadata for the exemplar.
- Add safe assembly and cleanup logic.
- Update docs and summarize the pattern used.

Before editing, briefly restate the plan and the files you expect to touch.
```
