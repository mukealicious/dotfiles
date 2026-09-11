# Figure It Out

Use this fallback when no permanent playbook fits or when a matching route has not yet been implemented. Design one proportionate, auditable run for the actual task. Do not recreate a playbook that already exists.

## Contract

Before substantial implementation, define a falsifiable outcome and a workflow that reduces the riskiest uncertainty first. Run the work as verifiable units. Preserve honest negative and inconclusive results.

Load these principle modules:

- [Foundational Thinking](../principles/foundational-thinking.md)
- [Exhaust the Design Space](../principles/exhaust-the-design-space.md) when uncertainty is consequential
- [Build the Lever](../principles/build-the-lever.md) when repetition, risk, or auditability justifies automation
- [Separate Before Serializing Shared State](../principles/separate-before-serializing-shared-state.md) when work can run concurrently
- [Prove It Works](../principles/prove-it-works.md)
- [Sequence Work into Verifiable Units](../principles/sequence-verifiable-units.md)
- [Never Block on the Human](../principles/never-block-on-the-human.md)
- [Encode Lessons in Structure](../principles/encode-lessons-in-structure.md) when a correction is likely to recur

## Workflow

### 1. Frame

State:

- the deliverable and a falsifiable definition of done;
- the known scope, constraints, and highest-risk unknowns;
- the rigor level and why it is proportionate;
- any genuine approval or preference gate.

Proceed with reversible discovery. For a multi-hour or high-blast-radius run, give the user one compact framing checkpoint before committing to it.

### 2. Design the run

Break the task into the smallest coherent units that can each end in evidence. Put foundational scaffolding and the riskiest unknown before broad implementation. Establish the baseline or observation method before changing the system.

Compare concrete alternatives only for consequential uncertainty. Parallelize only across real ownership seams, with separate files, branches, worktrees, or other isolated state where concurrent writes could collide.

Select relevant specialists and propose meaningful phase boundaries using [Composition and Checkpoints](../references/composition-and-checkpoints.md). Record the phase list in a todo, durable plan, or decision log only when the run needs coordination, auditability, or resumability. Stop at agreed checkpoints with evidence and the recommended next handoff; verification units inside a phase do not each require a pause.

### 3. Execute verifiable units

For each unit:

1. State the hypothesis or intended outcome.
2. Make the smallest change or observation that can test it.
3. Check the real artifact or execution path.
4. Keep the change only when it advances the predicate.
5. Record the result as verified, not verified, or inconclusive.

Fix a weak observation method instead of accepting an easy pass. Review delegated artifacts yourself.

### 4. Keep a proportionate trail

Preserve enough evidence for another person or a resumed session to reconstruct consequential decisions. Small mismatches may need only the final summary and command output. Long, risky, or autonomous work may need a checked-in script, decision table, or durable plan. Let temporary handoffs point to that authority rather than becoming a second plan. Do not create an audit artifact by default when the diff and tests already tell the story.

### 5. Verify and hand back

Run the whole definition of done against the real product or artifact. Encode recurring corrections in the strongest appropriate mechanism, such as a type, test, lint rule, metadata constraint, validator, or script.

Report the designed workflow, rigor level, verified evidence, negative or inconclusive findings, and remaining work. If this bespoke workflow recurs, recommend a permanent playbook with a precise trigger and invariant.

## Planning recipe

Use Figure It Out when the deliverable is an engineering plan rather than a bounded factual answer or an authorized implementation. Multi-Phase Plan remains deferred. The outcome is a buildable, evidence-grounded proposal with explicit unknowns and verification criteria, not a mandatory document or a promise that the design is proven.

A useful composition, adapted to what remains uncertain:

- Inspect the repository and existing decisions; distinguish facts, assumptions, constraints, and permissions.
- Use Grilling for unresolved decisions, not facts retrievable from code or questions already answered.
- Use Breadboarding when workflow wiring needs to become concrete, then identify demoable vertical slices. Use Domain Modeling for changing terms and relationships, or Codebase Design for uncertain interfaces and test seams.
- Add Impeccable for UI shape or Production Readiness for operational/data risks. Framing Doc and Kickoff Doc apply only when the requested artifact is grounded in real conversation sources.
- Propose a sequence with per-phase outcomes, dependencies, verification, open decisions, and meaningful handoff boundaries. Recommend test methods, including TDD only where useful; recommending a seam does not make it approved.

Load selected skills through the [composition guide](../references/composition-and-checkpoints.md), not the entire list. A short plan in conversation can be enough; reference an existing durable plan rather than creating competing records.

Verify the plan against actual code and constraints. At handback, distinguish what was inspected from what still needs an experiment. For planning-only scope, stop and request implementation approval if recommending a build next. If planning and implementation were both requested, preserve that authorization and transition to the appropriate implementation route after any agreed checkpoint; do not reopen settled decisions. Keep planning in this recipe for now. If repeated use reveals a distinct reusable need, propose a dedicated contract for a future scope decision; do not create one as part of the current run.
