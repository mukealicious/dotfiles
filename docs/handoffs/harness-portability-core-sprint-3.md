# Handoff: Sprint 3 — Add Harness-Aware Instructions

## Goal

Move from one shared instruction symlink to a shared instruction base plus small harness-specific appendices, while keeping the resulting system easy to explain and install.

## Dependency Assumption

Assume Sprints 1 and 2 are complete. Shared skills should already have a neutral source of truth in `ai/skills/`, and `sprint-plan` should already reflect the new portability model.

## Current Repo State

- Architecture doc: `docs/harness-aware-capabilities-plan.md`
- Sprint plan: `docs/sprint-plan-harness-portability-core.md`
- Shared AI installer: `ai/install.sh`
- Shared AI docs: `ai/README.md`

At planning time, the repo still relies on one shared instruction symlink for several harnesses. This sprint is about splitting shared guidance from harness-specific policy.

## In Scope

- Define what belongs in the shared base versus harness appendices
- Create a shared instruction base
- Create small appendices for the harnesses that need them
- Assemble installed instruction files via the installer

## Out Of Scope

- Large rewrites of skill content
- Full shared-agent migration
- Pi extension work
- OpenCode agent wiring

## Tasks

### 3.1 Define the composition contract
- Decide the boundary between shared instruction content and harness-specific policy.
- Keep appendices short and additive.

### 3.2 Extract a shared base
- Move neutral guidance into `ai/instructions/base.md`.
- Keep model/provider specifics out of the base.

### 3.3 Add minimal appendices
- Create appendices only for the harness-specific behavior that really needs to differ.
- Avoid duplication.

### 3.4 Assemble installed instruction files
- Update installer logic to materialize the final instruction file each harness expects.

## Read These Files First

- `docs/harness-aware-capabilities-plan.md`
- `docs/sprint-plan-harness-portability-core.md`
- `ai/install.sh`
- `ai/README.md`
- Existing shared instruction source files

## Deliverables

- `ai/instructions/base.md`
- Minimal harness appendices
- Installer logic for assembling final instruction outputs
- Documentation explaining the composition model

## Validation

- Shared base reads cleanly without harness-specific assumptions
- Each appendix is short and additive
- Install flow produces the expected final instruction files

## Gotchas

- Do not move too much into appendices; keep the shared base strong.
- Do not duplicate the same rules across multiple harness files.
- Do not let provider/model policy leak back into the shared base.

## Suggested Fresh-Session Prompt

```text
Work on Sprint 3 from `docs/sprint-plan-harness-portability-core.md` using the handoff in `docs/handoffs/harness-portability-core-sprint-3.md`.

Assume Sprints 1 and 2 are complete.

Goal: implement shared base instructions plus harness-specific appendices and installer assembly.

Important context:
- Shared guidance should live in `ai/instructions/base.md`.
- Harness-specific appendices should be small and additive.
- Keep the resulting system easy to explain.

Please implement the sprint, validate the result, and summarize the final instruction composition model.
```

## Conductor Quickstart Checklist

- Read `docs/harness-aware-capabilities-plan.md`
- Read `docs/sprint-plan-harness-portability-core.md`
- Read `ai/install.sh`
- Read `ai/README.md`
- Read current shared instruction source files
- Implement only Sprint 3
- Assume Sprints 1 and 2 are complete
- Create shared base instructions plus small harness appendices
- Keep appendices short and additive
- Do not expand scope into agent migration
- Validate the final instruction composition model
- Summarize exactly what changed and what was verified

## Conductor Kickoff Prompt

```text
Work on Sprint 3 from `docs/sprint-plan-harness-portability-core.md` using the handoff in `docs/handoffs/harness-portability-core-sprint-3.md`.

This is a fresh session. Please read the handoff file first and treat it as the source of context.

Assume Sprints 1 and 2 are complete.

Goal:
Implement shared base instructions plus harness-specific appendices and installer assembly.

Important rules:
- Shared guidance should live in `ai/instructions/base.md`.
- Harness-specific appendices should be small and additive.
- Keep provider/model specifics out of the shared base.
- Do not expand scope into shared-agent migration.

Deliverables:
- Create a shared instruction base.
- Add minimal harness appendices.
- Update installer logic to assemble final instruction outputs.
- Update docs and summarize the final composition model.

Before editing, briefly restate the plan and the files you expect to touch.
```
