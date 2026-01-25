---
name: sprint-plan
description: Break projects into sprints with atomic, testable tasks. Use when starting new features, migrations, or projects. Generates validated sprint plans and converts to built-in Tasks.
---

# Sprint Planning

Break projects into demoable sprints with atomic, committable tasks.

## Workflow

1. User: `/sprint-plan <project description>` or "plan sprints for X"
2. **Clarify** - Ask 3-5 questions about scope, constraints, tech stack
3. **Generate** - Create sprint breakdown using generation prompt
4. **Review** - Spawn Plan subagent to critique
5. **Revise** - Incorporate feedback
6. **Write** - Save to `sprint-plan-<name>.md`
7. **Convert** - Create TaskCreate calls for Sprint 1

## Generation Prompt

Use this prompt internally to structure the breakdown:

```
Break this project into sprints and tasks:

CONSTRAINTS:
- Every task = atomic, single-commit work
- Every task has validation (tests preferred, else clear verification)
- Every sprint = demoable increment that builds on previous
- Be exhaustive, technical, and clear
- Focus on small tasks that compose into sprint goals

OUTPUT:
## Sprint N: <Goal>
Demoable outcome: <what can be shown/run>

### Task N.1: <Title>
- Description: <what to implement>
- Validation: <how to verify completion>
- Files: <likely files to touch>

### Task N.2: ...
```

## Review Prompt

Spawn Plan subagent with:

```
Review this sprint plan for:

1. **Atomicity** - Is each task a single commit? Split if >1 logical change
2. **Validation** - Does every task have testable/verifiable criteria?
3. **Dependencies** - Are tasks ordered correctly? Missing prerequisites?
4. **Sprint boundaries** - Is each sprint demoable? Does it build on previous?
5. **Completeness** - Any missing tasks? Edge cases? Error handling?
6. **Scope creep** - Any tasks that don't belong? Out of scope work?

Suggest specific improvements with task numbers.
```

## Output Format

Save to `sprint-plan-<name>.md`:

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
- **Description:** <what to do>
- **Validation:** <how to verify>
- **Files:** <affected files>

### 1.2: ...

## Sprint 2: ...
```

## Task Conversion

After user approves plan, convert Sprint 1 to built-in Tasks:

```
TaskCreate({
  subject: "1.1: <Task Title>",
  description: "<Description>\n\nValidation:\n<criteria>",
  activeForm: "Implementing <task>"
})
```

Only create tasks for current sprint. User runs `/sprint-plan next` for subsequent sprints.

## Principles

### Atomic Tasks
- One logical change per task
- Should be completable in one focused session
- Clear start and end state

### Demoable Sprints
- Each sprint produces runnable software
- Stakeholder can see progress
- No "infrastructure only" sprints (pair with visible outcome)

### Validation-First
- Tests preferred
- If no tests: CLI output, API response, UI behavior
- "It works" is not validation

### Build Forward
- Each sprint assumes previous sprint complete
- No circular dependencies
- Clear progression toward goal

## Quick Reference

| Phase | Action |
|-------|--------|
| Clarify | 3-5 questions about scope/constraints |
| Generate | Use generation prompt |
| Review | Spawn Plan agent |
| Write | `sprint-plan-<name>.md` |
| Convert | TaskCreate for Sprint 1 |

## Commands

| Command | Action |
|---------|--------|
| `/sprint-plan <desc>` | Start new plan |
| `/sprint-plan next` | Convert next sprint to Tasks |
| `/sprint-plan status` | Show progress across sprints |
