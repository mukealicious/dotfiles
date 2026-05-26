---
name: breadboarding
description: Maps workflows into places, UI affordances, code affordances, data stores, and wiring. Use when understanding nuanced existing workflows, designing a shaped feature, translating transcript decisions into implementation territory, or slicing work into demoable vertical increments.
references:
  - references/model.md
  - references/mapping.md
  - references/slicing.md
metadata:
  watch-sources: |
    rjs/shaping-skills/breadboarding@main
    rjs/shaping-skills/breadboard-reflection@main
---

# Breadboarding

Breadboarding explains how a workflow produces its effects. It turns a user journey or shaped idea into tables of places, UI affordances, code affordances, data stores, and wiring.

The tables are the source of truth. Mermaid diagrams are optional renderings for humans.

## Use When

- The user is trying to understand the nuance of a workflow before building it.
- A feature spans frontend, backend, agents, jobs, APIs, or multiple apps.
- A planning conversation produced "what should happen" but not the concrete mechanism.
- Existing code behaves in ways that need to be traced before changing it.
- Work needs to be sliced into demoable vertical increments.

## First Question

Ask for the workflow as an operator story:

> "Who is trying to do what, from where, and what effect should happen?"

If the user has transcripts, frame docs, kickoff docs, mockups, screenshots, tickets, or current code, use them as source material. If the workflow exists in code, inspect the code before finalizing the breadboard.

## Output

Produce these tables:

1. Places
2. UI Affordances
3. Code Affordances
4. Data Stores

Then optionally add:

5. Mermaid diagram
6. Slice summary
7. Per-slice affordance tables

Use stable IDs:

- `P1`, `P2` for places
- `U1`, `U2` for UI affordances
- `N1`, `N2` for code/non-UI affordances
- `S1`, `S2` for data stores
- `V1`, `V2` for vertical slices

## Core Rules

- Tables first, diagram second.
- Separate control flow from data flow.
- `Wires Out` means control flow: triggers, calls, writes, navigates.
- `Returns To` means data flow: returns, reads, feeds display.
- A UI affordance that displays data needs an incoming data source.
- A code affordance should have `Wires Out`, `Returns To`, or both.
- Wire navigation to the destination place, not to an internal affordance inside that place.
- Name real affordances, not vague infrastructure. Prefer `userRepo.save()` over `DATABASE`.

## Procedure

For existing workflows:

1. Define the operator story.
2. List places the operator or system passes through.
3. Trace from the entry point through the implementation.
4. Add UI affordances, code affordances, and stores.
5. Fill `Wires Out` and `Returns To`.
6. Verify the breadboard against source or code.
7. Reflect on smells only after the map is accurate.

For new workflows:

1. Start from the frame, kickoff doc, shaped parts, or desired outcome.
2. Identify existing places and new places.
3. Translate desired behavior into UI and code affordances.
4. Verify every visible output has a data source.
5. Wire the intended control and data flow.
6. Slice into demoable vertical increments if implementation planning is needed.

## Reflection

After the breadboard matches reality or intent, inspect for design smells:

- Unexplained behavior.
- Missing path from user action to required effect.
- Hidden data stores or configuration.
- Incoherent wiring.
- Affordances that need multiple verbs to explain.
- Diagram nodes that do not exist in the tables.

If code exists, read implementation seams before judging design: module boundaries, function signatures, full call chains, decorators, state co-access, and module-level constants.

## Load More

- Read `references/model.md` for places, affordances, tables, and wiring rules.
- Read `references/mapping.md` when mapping existing code or designing from shaped parts.
- Read `references/slicing.md` when turning a breadboard into vertical implementation slices.
