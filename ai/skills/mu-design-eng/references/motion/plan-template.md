# Motion implementation-plan template

Use only after plan scope is selected. The plan must be understandable without the audit conversation. Use project plan conventions and an authorized destination; otherwise return the plan in the response. Do not create a new plans hierarchy or index without need.

One plan per independently executable fix. Merge findings when they share the same files and root cause. Inline exact proposed values and current evidence in the plan; this deliberate handoff snapshot is not a second shared standards document.

```markdown
# <ID> — <Imperative title>

- Status: TODO
- Baseline: <commit, plus relevant working-tree state>
- Severity / category: <impact and audit category>
- Scope: <files/components and rough change size>
- Dependencies: <other selected plans, or none>

## Problem

Explain the user-visible defect, its frequency, and its impact.
Cite each location as `path:line` and include its current code verbatim.
Distinguish observed behavior from a code risk or feel hypothesis.

## Target

Give the exact target behavior and relevant code.
Resolve curve, duration, spring, media-query, and state-selector values.
If a project token is used, show its definition and owner.
Include normal, interrupted, closed, and reduced-motion states.
Explain any justified exception to the routine timing budget.

## Project conventions

Name token ownership, file placement, primitive/library API and version,
and an existing `file:line` exemplar. Reuse the current stack.

## Ordered edits

1. <File, concrete edit, resulting behavior, local completion check.>
2. <Next edit and its dependency on the previous step.>

## Boundaries

- In scope: <exact components and behavior>.
- Preserved: <semantics, focus, data flow, layout, unrelated motion>.
- No new dependencies unless separately approved.
- If the baseline or API differs materially, stop and report the drift.
- This plan does not authorize implementation, deployment, or installation.

## Verification

- Mechanical: <repository-declared commands and expected results>.
- Normal speed: <route, state, action, observable result>.
- Slow/frame-by-frame: <origin, overlap, handoff, or settling to inspect>.
- Interruption: <rapid toggle/reversal/navigation cases and expected state>.
- Reduced motion: <instant/gentler behavior, no hidden content or waiting>.
- Input: <keyboard/focus, mouse, touch cases relevant to this change>.
- Performance: <same-device/workload before/after trace if relevant>.
- Device: <hardware/browser needed and authorized access arrangement>.
- Done when: <specific observable criteria, including cleanup>.
- Unverified: <remaining evidence needed and who can provide it>.
```

## Author checks

- Every finding has its own current evidence; never write “as discussed above.”
- Every target value comes from the project or a named deliberate choice. Resolve it in the plan instead of requiring the executor to invent timing.
- Include removal hazards from [selection.md](selection.md) when subtracting motion.
- Use [verification.md](../verification.md) for the shared evidence protocol; a passing typecheck does not settle motion quality.
- If an authorized plan index exists, record execution order, dependencies, and status there. Preserve its conventions and other authors' work.
- Reconciliation checks current source before marking a plan complete, refreshes stale locations, and identifies resolved findings. It does not execute pending plans.
