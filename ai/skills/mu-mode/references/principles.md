# Principle Index

Read this compact index when Mu Mode activates. Read a linked principle document in full only when the selected playbook names it or its trigger becomes relevant. These are internal Mu Mode resources, not standalone skills.

## Core

- **[Laziness Protocol](../principles/laziness-protocol.md)**: when sizing a diff or tempted to add layers, prefer deletion and the smallest maintainable change.
- **[Foundational Thinking](../principles/foundational-thinking.md)**: before feature logic, settle core shapes, ownership, scaffolding, and shared-state boundaries.
- **[Redesign from First Principles](../principles/redesign-from-first-principles.md)**: when integrating a new requirement, reshape the design as though the requirement were foundational.
- **[Subtract Before You Add](../principles/subtract-before-you-add.md)**: before adding or rewriting, remove dead weight and obsolete paths when safe.
- **[Minimize Reader Load](../principles/minimize-reader-load.md)**: when code is hard to trace, reduce indirection, hidden state, and unnecessary concepts.
- **[Outcome-Oriented Execution](../principles/outcome-oriented-execution.md)**: during rewrites or migrations, converge on the target while preserving required compatibility and safe rollout states.
- **[Experience First](../principles/experience-first.md)**: for product and workflow tradeoffs, optimize the consumer's experience rather than implementation convenience.
- **[Exhaust the Design Space](../principles/exhaust-the-design-space.md)**: for consequential uncertainty without precedent, compare concrete alternatives before committing.
- **[Build the Lever](../principles/build-the-lever.md)**: when repetition, risk, or auditability justifies it, build a rerunnable tool that performs or proves the work.

## Architecture

- **[Model the Domain](../principles/model-the-domain.md)**: when state or branching repeats shape assumptions, encode the domain in an explicit structure.
- **[Boundary Discipline](../principles/boundary-discipline.md)**: validate untrusted inputs at system boundaries and keep internal logic focused.
- **[Type System Discipline](../principles/type-system-discipline.md)**: in typed code, make illegal states hard to represent and parse external data before trust.
- **[Make Operations Idempotent](../principles/make-operations-idempotent.md)**: for retryable or interruptible operations, make reruns converge on the same correct state.
- **[Migrate Callers Then Delete Legacy APIs](../principles/migrate-callers-then-delete-legacy-apis.md)**: migrate controlled callers and remove obsolete APIs, while respecting external consumers and staged rollout.
- **[Separate Before Serializing Shared State](../principles/separate-before-serializing-shared-state.md)**: when actors may mutate the same state, remove sharing before adding locks or queues.

## Verification

- **[Prove It Works](../principles/prove-it-works.md)**: before declaring done, verify the real artifact and execution path rather than a proxy.
- **[Fix Root Causes](../principles/fix-root-causes.md)**: when debugging, reproduce and trace symptoms to the owning failure mechanism.
- **[Sequence Work into Verifiable Units](../principles/sequence-verifiable-units.md)**: for multi-step work, end each small coherent unit with evidence before advancing.

## Delegation

- **[Guard the Context Window](../principles/guard-the-context-window.md)**: when inputs or outputs are large, keep the main thread focused through selective reads, summaries, and bounded delegation.
- **[Never Block on the Human](../principles/never-block-on-the-human.md)**: proceed on reversible work; retain gates for consequential actions and genuine preference decisions.

## Meta

- **[Encode Lessons in Structure](../principles/encode-lessons-in-structure.md)**: when a correction recurs, encode it in a type, test, lint, metadata, validator, or script instead of repeated prose.
