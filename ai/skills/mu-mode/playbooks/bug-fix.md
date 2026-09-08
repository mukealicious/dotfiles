# Bug Fix

## Contract

Reproduce the reported defect, establish its failure mechanism, fix the root cause, and verify the same surface. Diagnosis alone is not a completed fix; suppressing the symptom is not root-cause evidence.

Load these principle modules:

- [Fix Root Causes](../../principle-fix-root-causes/SKILL.md)
- [Prove It Works](../../principle-prove-it-works/SKILL.md)
- [Boundary Discipline](../../principle-boundary-discipline/SKILL.md)

Use [Composition and Checkpoints](../references/composition-and-checkpoints.md) for specialist selection, phase boundaries, and authorization-preserving handoffs. Adapt this starting shape to the defect and risk.

## Establish the failure

Inspect the report, relevant code, environment, and available logs or artifacts. Capture expected versus actual behavior and a minimal reproduction at the reported surface before changing the code. Narrow uncertain mechanisms with observations that can disprove them.

If reproduction is unavailable or intermittent, state that limitation, preserve the evidence, and improve observation. Separate a likely cause or candidate patch from a verified fix; do not manufacture certainty or an easy passing test. Ask only for information that cannot be retrieved and materially blocks progress.

## Correct the owner

Trace the failed behavior to the module or boundary that owns the violated invariant. Make the smallest correction there rather than adding a catch-all, retry, or success-shaped fallback at each caller. Preserve unrelated behavior and user changes.

Choose specialists by the remaining uncertainty: Codebase Design for an unclear interface or seam; Breadboarding for a broken cross-surface workflow; Impeccable for frontend behavior; Production Readiness for retries, concurrency, data, or external-dependency failures. Grilling is for genuine unresolved decisions, not a routine debugging interview.

A regression test at the affected public surface is useful when feasible. TDD is optional: if chosen, load it, confirm any unapproved seams before tests, and capture red-before-green. A manual reproduction followed by a test added after the fix is evidence, but not a TDD claim. Retain valid seam approvals from earlier phases.

## Verify the same surface

Rerun the original reproduction and relevant regression checks, including the important adjacent failure case. If a proxy or mock was necessary, report what remains unverified at the original surface. Use Code Review proportionately when the correction warrants it; fixes and final checks remain with the implementing agent.

Return symptom, mechanism, correction, before/after evidence, and limitations. Do not expand a bug fix into a redesign without a scope decision. Stop at agreed handoff boundaries; otherwise complete the bounded fix without a pause for every diagnostic step.
