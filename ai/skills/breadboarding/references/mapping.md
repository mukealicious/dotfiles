# Mapping Workflows

## Existing Workflow

Use this when the workflow already exists in code or operations.

1. Define the operator story.
2. Identify entry points: route, button, API endpoint, job, webhook, command, agent tool call.
3. List Places involved.
4. Trace the implementation from entry point to effect.
5. Add UI affordances the operator sees or uses.
6. Add code affordances that perform meaningful work.
7. Add data stores that are read, written, or shape behavior.
8. Fill `Wires Out` and `Returns To`.
9. Re-read the source to verify the map.

## Read Implementation Seams

When code is ground truth, inspect:

- Module boundaries: what public functions cross files or packages?
- Function signatures: what data enters and leaves?
- Full call chains: what happens between trigger and effect?
- Module-level constants/config/templates: do they shape behavior?
- Decorators/framework patterns: background work, async, retries, transactions, auth.
- State co-access: which functions and stores cluster together?

Do not judge design until the breadboard accurately reflects what exists.

## New Workflow

Use this when designing from a frame, kickoff doc, transcript, shaped parts, or user story.

1. Name the outcome the operator needs.
2. List visible Places and system boundaries.
3. Add the UI affordances needed for the operator journey.
4. Add the code affordances needed to support each UI affordance.
5. Add data stores needed for display, persistence, or side effects.
6. Wire control flow from action to effect.
7. Wire data flow from source to display.
8. Mark unknown mechanisms as open questions or spikes.

## Reflection Pass

After accuracy, inspect design quality:

| Smell | Check |
|-------|-------|
| Unexplained behavior | Does the workflow require an effect with no path? |
| Hidden store | Does behavior depend on config/state not in the table? |
| Incoherent wiring | Does a node both write and trigger the writer redundantly? |
| Naming resistance | Does an affordance need "or" or multiple verbs to explain? |
| Wrong boundary | Is a function doing several separable jobs? |
| Diagram-only node | Does the diagram contain nodes absent from tables? |

## Naming Test

For each code affordance:

1. Who calls it?
2. What is its step-level effect, excluding downstream calls?
3. Can one idiomatic verb name that effect?

If one verb does not fit, split or rename the affordance in the breadboard. If changing code is in scope, refactor code only after the current map is accurate and the user wants implementation changes.

## Spikes

Use a spike when a mechanism is unknown.

```markdown
## [Component] Spike: [Question]

### Context
[Why this matters.]

### Goal
[What we need to learn.]

### Questions

| # | Question |
|---|----------|
| Q1 | Where is ...? |
| Q2 | What changes are needed to ...? |

### Acceptance
Spike is complete when we can describe [specific understanding].
```

Acceptance should describe information gained, not a decision made.
