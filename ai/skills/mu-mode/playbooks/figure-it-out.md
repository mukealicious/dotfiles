# Figure It Out

Use this fallback when no permanent playbook fits or when a matching route has not yet been implemented. Design one proportionate, auditable run for the actual task. Do not recreate a playbook that already exists.

## Contract

Before substantial implementation, define a falsifiable outcome and a workflow that reduces the riskiest uncertainty first. Run the work as verifiable units. Preserve honest negative and inconclusive results.

Load these principle modules:

- [Foundational Thinking](../../principle-foundational-thinking/SKILL.md)
- [Exhaust the Design Space](../../principle-exhaust-the-design-space/SKILL.md) when uncertainty is consequential
- [Build the Lever](../../principle-build-the-lever/SKILL.md) when repetition, risk, or auditability justifies automation
- [Separate Before Serializing Shared State](../../principle-separate-before-serializing-shared-state/SKILL.md) when work can run concurrently
- [Prove It Works](../../principle-prove-it-works/SKILL.md)
- [Sequence Work into Verifiable Units](../../principle-sequence-verifiable-units/SKILL.md)
- [Never Block on the Human](../../principle-never-block-on-the-human/SKILL.md)
- [Encode Lessons in Structure](../../principle-encode-lessons-in-structure/SKILL.md) when a correction is likely to recur

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

Record the phase list in a todo, durable plan, or decision log only when the run needs coordination, auditability, or resumability. In Pi, use its handoff command with the next phase and plan path at meaningful phase boundaries or under context pressure when the run should continue immediately. Repeated handoffs need no manual tree navigation.

### 3. Run the loop

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
