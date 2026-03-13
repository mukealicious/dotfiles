# Handoff: Sprint 1 — Prove Shared Skill Portability

## Goal

Prove the core architecture with the smallest useful implementation: author one portable skill in `ai/skills/`, surface it into both `.agents/skills/` and `.claude/skills/`, and update the docs so neither runtime directory is treated as the source of truth.

## Why This Sprint Exists

This sprint is the proof point for the whole architecture. If authoring in `ai/skills/` and projecting to both runtime formats feels awkward, the larger plan should be simplified before migrating real skills like `sprint-plan`.

## Settled Decisions

Assume the following decisions are already made:

- Keep top-level directories as `ai/`, `claude/`, `pi/`, and `opencode/`.
- `ai/` is the shared authoring layer.
- Portable skills live in `ai/skills/`.
- `.agents/skills/` and `.claude/skills/` are runtime output formats only.
- Neither runtime directory is primary.
- Harness-specific overlays are allowed later, but only when genuinely needed.

## Current Repo State

- Architecture doc: `docs/harness-aware-capabilities-plan.md`
- Sprint plan: `docs/sprint-plan-harness-portability-core.md`
- Shared skill docs: `ai/README.md`
- Shared installer: `ai/install.sh`
- Current behavior:
  - shared skills are projected into Claude-oriented and OpenCode-oriented runtime locations
  - Pi discovers shared skills directly from `ai/skills/`
  - Codex currently gets instructions only; there is no `.agents/skills/` projection yet

## In Scope

- Document the shared-skill authoring contract clearly
- Add `.agents/skills/` runtime projection
- Keep `.claude/skills/` projection clearly secondary to `ai/skills/`
- Add one tiny portable reference skill

## Out Of Scope

- Migrating `sprint-plan`
- Changing agent assembly
- Reworking harness-specific instruction files
- Solving every OpenCode or Pi nuance

## Tasks

### 1.1 Document the portable skill contract
- Update docs so they explicitly say: author in `ai/skills/`, project to `.agents/skills/` and `.claude/skills/`.
- Keep wording neutral: no Claude-first framing.

### 1.2 Add `.agents/skills/` runtime projection
- Update installer logic to create or refresh a Codex-style runtime directory for shared skills.
- Keep the implementation simple and consistent with existing symlink helpers.

### 1.3 Keep `.claude/skills/` projection neutral
- Update installer comments and documentation so `.claude/skills/` is described as a runtime output, not the canonical location.

### 1.4 Add one tiny reference skill
- Create a small portable skill in `ai/skills/` with no Claude-only or Pi-only assumptions.
- The skill should be boring on purpose; the architecture is what matters here.

## Read These Files First

- `docs/harness-aware-capabilities-plan.md`
- `docs/sprint-plan-harness-portability-core.md`
- `ai/README.md`
- `ai/install.sh`

## Deliverables

- Updated docs that clearly explain the authoring/runtime split
- Installer support for `.agents/skills/`
- One tiny portable skill under `ai/skills/`
- A validation note in the final handoff message explaining what was tested

## Validation

- Confirm the docs consistently describe `ai/skills/` as the source of truth
- Run the relevant installer flow and verify shared skills appear in both runtime directories
- Verify the tiny reference skill exists only once in source form under `ai/skills/`

## Gotchas

- Do not accidentally make `.claude/skills/` the privileged or default framing in comments or docs.
- Do not over-design the reference skill.
- Do not couple the implementation to Claude-specific primitives.

## Suggested Fresh-Session Prompt

```text
Work on Sprint 1 from `docs/sprint-plan-harness-portability-core.md` using the handoff in `docs/handoffs/harness-portability-core-sprint-1.md`.

Goal: prove the shared skill portability pattern.

Important context:
- `ai/skills/` is the source of truth for portable skills.
- `.agents/skills/` and `.claude/skills/` are runtime output formats only.
- Keep `ai/`, `claude/`, `pi/`, and `opencode/` as top-level directories.
- Do not migrate `sprint-plan` yet.

Please implement the sprint, validate the result, and summarize exactly what changed.
```

## Conductor Quickstart Checklist

Use this when handing Sprint 1 to a fresh agent in Conductor.

- Read `docs/harness-aware-capabilities-plan.md`
- Read `docs/sprint-plan-harness-portability-core.md`
- Read `ai/README.md`
- Read `ai/install.sh`
- Implement only Sprint 1
- Treat `ai/skills/` as the source of truth
- Treat `.agents/skills/` and `.claude/skills/` as runtime outputs only
- Add `.agents/skills/` projection
- Keep `.claude/skills/` projection neutral
- Add one tiny portable reference skill
- Validate the install flow
- Summarize exactly what changed and what was verified

## Conductor Kickoff Prompt

```text
Work on Sprint 1 from `docs/sprint-plan-harness-portability-core.md` using the handoff in `docs/handoffs/harness-portability-core-sprint-1.md`.

This is a fresh session. Please read the handoff file first and treat it as the source of context.

Goal:
Prove the shared skill portability pattern with the smallest useful implementation.

Important rules:
- `ai/skills/` is the source of truth for portable skills.
- `.agents/skills/` and `.claude/skills/` are runtime output formats only.
- Neither runtime directory is primary.
- Keep top-level directories as `ai/`, `claude/`, `pi/`, and `opencode/`.
- Do not migrate `sprint-plan` yet.
- Do not expand scope into shared instructions or shared agents.

Deliverables:
- Update docs so the authoring/runtime split is explicit.
- Add `.agents/skills/` runtime projection.
- Keep `.claude/skills/` projection framed as a runtime output, not the source.
- Add one tiny portable reference skill under `ai/skills/`.
- Validate the result and summarize exactly what changed.

Before editing, briefly restate the plan and the files you expect to touch.
```
