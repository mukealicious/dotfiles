# Feature

## Contract

Deliver new or changed behavior from an explicit data and interaction shape, verified through the surface that consumes it. A passing build alone does not establish that the feature works.

Load these principle modules:

- [Model the Domain](../../principle-model-the-domain/SKILL.md)
- [Experience First](../../principle-experience-first/SKILL.md)
- [Prove It Works](../../principle-prove-it-works/SKILL.md)

Use [Composition and Checkpoints](../references/composition-and-checkpoints.md) for specialist selection, phase boundaries, and authorization-preserving handoffs. The following is a starting shape, not a required pipeline.

## Shape the behavior

Inspect existing code, repository guidance, and settled decisions. State who or what consumes the behavior, the expected effect, the data/state shape and owner, and relevant failure or empty states. Make acceptance observable at the real interface; keep a small feature's shape in a few lines rather than demanding a design document.

For unresolved decisions, consider Grilling. For a workflow spanning surfaces, consider Breadboarding and demoable slices. Use Domain Modeling when terms or relationships change, Codebase Design when interfaces or test seams are uncertain, and Impeccable for frontend experience. Do not redo shaping already accepted in the source context.

## Build a thin working slice

Start with the smallest end-to-end path that proves the shape. Reuse existing helpers and ownership boundaries, then cover the important states without speculative abstraction or unrelated refactoring. Adapt later slices to what the first one teaches.

Choose a proportionate testing method. TDD can be a useful experiment for a behavior that can be observed at an agreed seam; it is not a default requirement. If selected, load it and honor seam confirmation and red-before-green. Otherwise verify behavior without labeling the work TDD. Add Production Readiness when persistence, async work, or external dependencies introduce real failure modes.

## Verify and hand back

Exercise acceptance at the consuming surface: relevant tests plus direct UI, CLI, or integration evidence where applicable. Check the touched failure states and regressions; distinguish verified behavior from mocks, static checks, and paths not exercised. Use Code Review proportionately for advisory findings; the implementing agent owns fixes and revalidation.

Return the behavior delivered, evidence, consequential choices, and remaining limitations. At an agreed phase boundary, stop with the next recommended handoff rather than silently continuing. Do not create a commit, PR, deployment, or further phase just to make the feature feel complete.
