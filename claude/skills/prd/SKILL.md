---
name: prd
description: Create a Product Requirements Document for a feature. Use when planning new features, migrations, or refactors. Invoke with /prd or when asked to create a PRD.
---

# PRD Creation

Create Product Requirements Documents suitable for RFC review by engineers and stakeholders.

The PRD describes WHAT to build and WHY, not HOW or in WHAT ORDER.

## Workflow

1. **Ask clarifying questions** (5-7 max) to understand:
   - Problem & motivation
   - Users & stakeholders
   - End state & success criteria
   - Scope & boundaries
   - Constraints & requirements
   - Risks & dependencies

2. **Explore codebase** to understand:
   - Existing patterns to follow
   - Key files and dependencies
   - Technical constraints

3. **Generate PRD** to `.claude/state/<prd-name>/prd.md`

## Clarifying Questions

### Problem & Motivation
- What problem does this solve? Who experiences it?
- What's the cost of NOT solving this?
- Why now?

### Users & Stakeholders
- Who are the primary users? Secondary?

### End State & Success
- What does "done" look like?

### Scope & Boundaries
- What's explicitly OUT of scope?
- What's deferred to future iterations?

### Constraints
- Performance, security, compatibility, accessibility requirements?

### Risks
- What could go wrong? Technical risks?
- External dependencies?

## Output Format

Save to `.claude/state/<prd-name>/prd.md`:

```markdown
# PRD: <Feature Name>

**Date:** <YYYY-MM-DD>

---

## Problem Statement

### What problem are we solving?
Clear description with user and business impact.

### Why now?
What triggered this work?

### Who is affected?
- **Primary users:** Description
- **Secondary users:** Description

---

## Proposed Solution

### Overview
One paragraph describing what this feature does when complete.

### User Experience (if applicable)
How users interact with this feature.

---

## End State

When this PRD is complete:
- [ ] Capability 1 exists and works
- [ ] Capability 2 exists and works
- [ ] Tests cover the new functionality
- [ ] Documentation is updated

---

## Acceptance Criteria

### Feature: <Name>
- [ ] Criterion 1
- [ ] Criterion 2

---

## Technical Context

### Existing Patterns
- Pattern 1: `src/path/to/example.ts` - Why relevant

### Key Files
- `src/relevant/file.ts` - Description

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Risk 1 | High/Med/Low | High/Med/Low | How to mitigate |

---

## Non-Goals (v1)

Explicitly out of scope:
- Thing we're not building - why deferred

---

## Open Questions

| Question | Owner | Status |
|----------|-------|--------|
| Question 1 | Name | Open/Resolved |
```

## Key Principles

- **Problem before solution** - Lead with the problem
- **Define end state, not process** - WHAT exists when done, not HOW to build it
- **Technical context enables autonomy** - Show patterns to follow
- **Non-goals prevent scope creep** - Explicit boundaries
- **Risks show rigor** - Demonstrate you've thought through failure modes

## After Creation

```
PRD saved to .claude/state/<prd-name>/prd.md

To convert to executable tasks:
  /prd-task <prd-name>
```
