# Principle Index

Read this compact index when Mu Mode activates. Load a principle's full `SKILL.md` only when the selected playbook names it or its trigger becomes relevant.

## Core

- **Laziness Protocol** (`principle-laziness-protocol`): when sizing a diff or tempted to add layers, prefer deletion and the smallest maintainable change.
- **Foundational Thinking** (`principle-foundational-thinking`): before feature logic, settle core shapes, ownership, scaffolding, and shared-state boundaries.
- **Redesign from First Principles** (`principle-redesign-from-first-principles`): when integrating a new requirement, reshape the design as though the requirement were foundational.
- **Subtract Before You Add** (`principle-subtract-before-you-add`): before adding or rewriting, remove dead weight and obsolete paths when safe.
- **Minimize Reader Load** (`principle-minimize-reader-load`): when code is hard to trace, reduce indirection, hidden state, and unnecessary concepts.
- **Outcome-Oriented Execution** (`principle-outcome-oriented-execution`): during rewrites or migrations, converge on the target while preserving required compatibility and safe rollout states.
- **Experience First** (`principle-experience-first`): for product and workflow tradeoffs, optimize the consumer's experience rather than implementation convenience.
- **Exhaust the Design Space** (`principle-exhaust-the-design-space`): for consequential uncertainty without precedent, compare concrete alternatives before committing.
- **Build the Lever** (`principle-build-the-lever`): when repetition, risk, or auditability justifies it, build a rerunnable tool that performs or proves the work.

## Architecture

- **Model the Domain** (`principle-model-the-domain`): when state or branching repeats shape assumptions, encode the domain in an explicit structure.
- **Boundary Discipline** (`principle-boundary-discipline`): validate untrusted inputs at system boundaries and keep internal logic focused.
- **Type System Discipline** (`principle-type-system-discipline`): in typed code, make illegal states hard to represent and parse external data before trust.
- **Make Operations Idempotent** (`principle-make-operations-idempotent`): for retryable or interruptible operations, make reruns converge on the same correct state.
- **Migrate Callers Then Delete Legacy APIs** (`principle-migrate-callers-then-delete-legacy-apis`): migrate controlled callers and remove obsolete APIs, while respecting external consumers and staged rollout.
- **Separate Before Serializing Shared State** (`principle-separate-before-serializing-shared-state`): when actors may mutate the same state, remove sharing before adding locks or queues.

## Verification

- **Prove It Works** (`principle-prove-it-works`): before declaring done, verify the real artifact and execution path rather than a proxy.
- **Fix Root Causes** (`principle-fix-root-causes`): when debugging, reproduce and trace symptoms to the owning failure mechanism.
- **Sequence Work into Verifiable Units** (`principle-sequence-verifiable-units`): for multi-step work, end each small coherent unit with evidence before advancing.

## Delegation

- **Guard the Context Window** (`principle-guard-the-context-window`): when inputs or outputs are large, keep the main thread focused through selective reads, summaries, and bounded delegation.
- **Never Block on the Human** (`principle-never-block-on-the-human`): proceed on reversible work; retain gates for consequential actions and genuine preference decisions.

## Meta

- **Encode Lessons in Structure** (`principle-encode-lessons-in-structure`): when a correction recurs, encode it in a type, test, lint, metadata, validator, or script instead of repeated prose.
