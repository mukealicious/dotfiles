# Handoff: Sprint 2 — Extract a Real Shared Planning Skill

## Goal

Turn `sprint-plan` into a real shared capability by moving the portable planning logic into `ai/skills/sprint-plan/` and leaving only optional harness-specific glue outside the shared core.

## Dependency Assumption

Assume Sprint 1 is complete. That means the repo already treats `ai/skills/` as the neutral authoring layer and can project shared skills into both `.agents/skills/` and `.claude/skills/`.

If Sprint 1 is not complete, stop early, document the gap, and avoid inventing a second portability pattern.

## Current Repo State

- Current Claude-only skill: `claude/skills/sprint-plan/SKILL.md`
- Architecture doc: `docs/harness-aware-capabilities-plan.md`
- Sprint plan: `docs/sprint-plan-harness-portability-core.md`
- Shared skill guidance: `ai/README.md`

The current `sprint-plan` skill is a migration candidate because it contains portable planning logic mixed with Claude-specific assumptions.

## In Scope

- Audit portability blockers in the current `sprint-plan`
- Create a shared, harness-neutral `ai/skills/sprint-plan/`
- Reduce the Claude-specific version to a thin adapter or remove it if unnecessary
- Document the policy for shared skills versus harness-specific overlays

## Out Of Scope

- Redesigning the whole sprint planning workflow from scratch
- Adding Pi-specific or OpenCode-specific wrappers unless clearly necessary
- Instruction assembly work
- Agent assembly work

## Tasks

### 2.1 Audit portability blockers
- Identify which parts of the current skill are shared planning logic versus Claude-only glue.
- Call out obsolete assumptions too, not just harness-specific ones.

### 2.2 Create a harness-neutral shared core
- Move the lasting value into `ai/skills/sprint-plan/SKILL.md`.
- Keep the shared version focused on clarification, demoable sprints, atomic tasks, validation, and clear markdown output.

### 2.3 Reduce Claude-specific glue
- Keep only what is truly Claude-specific, if anything.
- If the shared skill makes the Claude wrapper unnecessary, simplify aggressively.

### 2.4 Update policy docs
- Add a short rule explaining when to put a skill in `ai/skills/` and when to keep a thin harness-specific adapter.

## Read These Files First

- `docs/harness-aware-capabilities-plan.md`
- `docs/sprint-plan-harness-portability-core.md`
- `claude/skills/sprint-plan/SKILL.md`
- `ai/README.md`

## Deliverables

- Shared `ai/skills/sprint-plan/SKILL.md`
- Either a thinner `claude/skills/sprint-plan/SKILL.md` or a deliberate removal/simplification plan
- Updated docs explaining shared-vs-adapter policy

## Validation

- Shared `sprint-plan` contains no Claude-only primitives like `subagent_type`, `TaskCreate`, or slash-command assumptions
- Docs use `sprint-plan` as the canonical example of migration from harness-specific to shared
- Any remaining Claude wrapper is clearly optional and small

## Gotchas

- Do not preserve stale behavior just because it already exists.
- Do not sneak Claude assumptions into the shared core.
- Do not expand scope into full instruction or agent refactors.

## Suggested Fresh-Session Prompt

```text
Work on Sprint 2 from `docs/sprint-plan-harness-portability-core.md` using the handoff in `docs/handoffs/harness-portability-core-sprint-2.md`.

Assume Sprint 1 is complete.

Goal: migrate `sprint-plan` from a Claude-only skill into a shared skill under `ai/skills/`, leaving only thin harness-specific glue if it still adds value.

Important context:
- `ai/skills/` is the source of truth for portable skills.
- `.agents/skills/` and `.claude/skills/` are runtime outputs, not authoring sources.
- Avoid Claude-only primitives in the shared `sprint-plan`.

Please implement the sprint, validate the result, and summarize the shared-vs-adapter split you chose.
```

## Conductor Quickstart Checklist

- Read `docs/harness-aware-capabilities-plan.md`
- Read `docs/sprint-plan-harness-portability-core.md`
- Read `claude/skills/sprint-plan/SKILL.md`
- Read `ai/README.md`
- Implement only Sprint 2
- Assume Sprint 1 is complete
- Move shared planning logic into `ai/skills/sprint-plan/`
- Keep Claude-specific glue thin or remove it if unnecessary
- Do not expand scope into instructions or agents
- Validate the shared-vs-adapter split
- Summarize exactly what changed and what was verified

## Conductor Kickoff Prompt

```text
Work on Sprint 2 from `docs/sprint-plan-harness-portability-core.md` using the handoff in `docs/handoffs/harness-portability-core-sprint-2.md`.

This is a fresh session. Please read the handoff file first and treat it as the source of context.

Assume Sprint 1 is complete.

Goal:
Migrate `sprint-plan` from a Claude-only skill into a shared skill under `ai/skills/`, leaving only thin harness-specific glue if it still adds value.

Important rules:
- `ai/skills/` is the source of truth for portable skills.
- `.agents/skills/` and `.claude/skills/` are runtime outputs, not authoring sources.
- Avoid Claude-only primitives in the shared `sprint-plan`.
- Do not expand scope into shared instructions or shared agents.

Deliverables:
- Create shared `ai/skills/sprint-plan/SKILL.md`.
- Thin down `claude/skills/sprint-plan/SKILL.md` or remove unnecessary wrapper logic.
- Update docs explaining the shared-vs-adapter policy.
- Validate the result and summarize the split you chose.

Before editing, briefly restate the plan and the files you expect to touch.
```
