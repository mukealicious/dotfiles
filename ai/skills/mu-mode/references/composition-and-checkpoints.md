# Composition and Checkpoints

Mu Mode owns the task contract and continuity; specialist skills own their methods. Playbooks offer useful starting shapes, not mandatory pipelines. Adapt the method as evidence changes without weakening the outcome or approval gates.

## Select methods

Choose only skills that reduce a real uncertainty or supply a needed capability. Load each selected skill before using it and honor its requirements; naming a skill is not executing it. The agent makes these choices rather than asking the user to assemble a workflow.

Briefly explain consequential choices: for example, “Breadboarding to trace the cross-app workflow; TDD for the retry seam once confirmed.” Do not narrate every skill read or principle. Skip methods whose work is already settled, including across a handoff.

| Need | Specialist owner | Keep the distinction |
|---|---|---|
| Unresolved product or design decisions | [Grilling](../../grilling/SKILL.md) | Inspect facts first; do not reopen settled answers. Honor its shared-understanding gate. |
| Workflow wiring or demoable slices | [Breadboarding](../../breadboarding/SKILL.md) | Map real affordances, stores, and effects; not a generic task list. |
| Changing domain terms and relationships | [Domain Modeling](../../domain-modeling/SKILL.md) | CONTEXT.md is a glossary; offer ADRs only for qualifying trade-offs. |
| Uncertain module interface or test seam | [Codebase Design](../../codebase-design/SKILL.md) | Use its vocabulary; alternative-interface exploration is not a default step. |
| A chosen test-first implementation | [TDD](../../tdd/SKILL.md) | An optional experiment, not an established user default. Confirm seams before writing tests; preserve already-approved seams. Claim TDD only with red-before-green evidence. |
| Frontend experience and visual behavior | [Impeccable](../../impeccable/SKILL.md) | Honor its product/design context setup; skip for backend-only work. |
| Operational or persistent-data risk | [Production Readiness](../../production-readiness/SKILL.md) | Check concrete failure modes at the touched boundaries. |
| Advisory findings on changes | [Code Review](../../code-review/SKILL.md) | Reviewers remain read-only; the parent owns fixes and validation. |
| Source-grounded conversation artifacts | [Framing Doc](../../framing-doc/SKILL.md), [Kickoff Doc](../../kickoff-doc/SKILL.md) | Read the source; neither is a generic plan generator. |

These are examples, not an exhaustive required set. Other skills remain available when relevant. [Implement](../../implement/SKILL.md) stays a manual alternative entry point, not a wrapper required by Mu Mode. Leaf skills remain independently useful.

## Shape phases proportionately

For substantial work, propose a lightweight outline: each phase's intended outcome, evidence needed to finish it, and meaningful handoff boundaries. A few lines in conversation usually suffice. Small tasks stay single-phase; do not require a planning document.

A phase is a coherent result or decision boundary, not every test, slice, or skill change. Verify small units inside a phase without pausing after each one. Revise the outline when evidence warrants it; explain changes to agreed boundaries rather than silently passing them. Stop at agreed checkpoints even when later work is already authorized.

Keep communication compact:

- Opening: route, consequential method choices, current phase and proposed boundaries.
- Checkpoint: result, evidence, unresolved issues, and the proposed next phase.

## Guide continuation

At an agreed handoff boundary, stop and recommend Pi's handoff command with a concrete next-phase focus, including the authoritative plan path if one exists. Do not automatically invoke it or start a phase loop. If the work is complete, hand back the result without inventing another phase. Use [Pause Safely](../playbooks/pause-safely.md) when the user wants to stop rather than immediately continue.

When the user invokes Pi's handoff command, its existing extension and the [Handoff](../../handoff/SKILL.md) skill own the temporary document, summarization, same-session tree continuation, and recovery. Do not create another session, process, Herdr tab, orchestrator, or confirmation UI. No manual tree navigation is needed for normal continuation.

Carry through the packet:

- Mu Mode, current route, intended stay/rematch, and reloading the router as the first continuation step;
- scope, settled decisions, approved test seams, and authoritative artifact paths;
- permissions already granted, actions still requiring approval, and agreed next checkpoints;
- verified results, failures or inconclusive evidence, and the exact next unfinished step.

Authorization survives unchanged. A planning-only request can recommend implementation but cannot authorize it; the next step is obtaining that approval, not building. A request to plan and implement already authorizes both within its scope, subject to agreed checkpoints and normal safety gates. Do not repeat answered approval questions merely because context was handed off.

On failure, preserve the source history, existing draft, and temporary artifacts; report what failed and the safe recovery step. A continuation starting, a packet being accepted, and the work being complete are distinct claims. Never substitute one for another.
