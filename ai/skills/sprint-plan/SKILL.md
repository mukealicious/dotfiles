---
name: sprint-plan
description: Break projects into demoable sprints with atomic, testable tasks. Use when starting new features, migrations, or multi-step refactors. Produces a reusable markdown plan that can be refined or saved to a file.
---

# Sprint Plan

Break a project or migration into demoable sprints with atomic tasks.

## Workflow

1. Confirm the goal, scope, and definition of done.
2. Ask only the missing clarification questions, usually 3-5.
3. Draft demoable sprints that build forward from foundations to visible outcomes.
4. Split each sprint into atomic, single-commit tasks with clear validation.
5. Review the draft for dependencies, missing prerequisites, and scope creep.
6. Present the plan inline, and save it as `sprint-plan-<name>.md` if the user wants a file or the repo already uses that pattern.

## Clarify

Ask about:

- Scope, non-goals, and success criteria
- Tech stack, integration points, and constraints
- Migration or rollout risks
- Validation expectations such as tests, smoke checks, or demos
- Existing plans, handoffs, or docs that must stay aligned

Skip questions already answered by the prompt, repo docs, or handoff material.

## Planning Constraints

- Every task should be atomic enough for one focused commit.
- Every task should have concrete validation.
- Every sprint should end with something demoable or reviewable.
- Tasks should be ordered by dependencies and build on previous sprints.
- Keep the plan specific about likely files, interfaces, or subsystems when the context supports it.
- Keep out-of-scope work explicitly deferred instead of smuggling it into early sprints.

## Self-Review Checklist

Before finalizing the plan, check:

1. **Atomicity** — Does any task contain more than one logical change?
2. **Validation** — Does every task say how completion is verified?
3. **Dependencies** — Are prerequisites introduced before dependent work?
4. **Sprint boundaries** — Is each sprint demoable and worth reviewing on its own?
5. **Completeness** — Are setup, migrations, error handling, docs, and rollout tasks covered where needed?
6. **Scope control** — Did any nice-to-have work leak into the main path?

Revise once before presenting the final plan.

## Output Format

Use this structure:

```markdown
# Sprint Plan: <Name>

**Created:** <date>
**Total Sprints:** N
**Total Tasks:** N

## Overview
<1-2 sentence summary>

## Sprint 1: <Goal>
**Demoable:** <what can be shown>

### 1.1: <Task Title>
- **Description:** <what to implement>
- **Validation:** <how to verify>
- **Files:** <likely files to touch>

### 1.2: <Task Title>
- **Description:** <what to implement>
- **Validation:** <how to verify>
- **Files:** <likely files to touch>
```

## When Continuing an Existing Plan

- Read the current plan first.
- Preserve completed work and existing numbering unless the user wants a restructure.
- Revise only the affected sprints or tasks.
- Call out what changed and why.

## Follow-Ups

- Save the approved plan to `sprint-plan-<name>.md` if the user wants a tracked artifact.
- If the runtime has task or todo primitives and the user explicitly wants them, derive them from the approved Sprint 1 tasks as a separate follow-up step.

## Principles

### Atomic Tasks

- One logical change per task
- Clear start and end state
- Small enough for one focused work session

### Demoable Sprints

- Each sprint should produce visible progress
- Avoid infrastructure-only sprints unless paired with a concrete outcome
- Build toward something a teammate or stakeholder can review

### Validation-First

- Prefer automated tests
- Otherwise name the concrete manual check, CLI output, API response, or UI behavior
- Avoid vague validation like "it works"

### Build Forward

- Each sprint assumes previous sprints are complete
- No circular dependencies
- Foundations should unlock later visible work
