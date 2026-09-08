# Active Playbook Catalogue

These are Mu Mode's active v0 route contracts. Route by the requested deliverable, not by incidental steps. Figure It Out temporarily designs runs for active routes whose dedicated playbooks are not yet implemented, without weakening their contracts.

| Route | Defining contract | Key principles | Foundation status |
|---|---|---|---|
| Investigation | Produce a read-only, evidence-backed answer to a bounded question. | Foundational Thinking, Prove It Works | Planned: `playbooks/investigation.md` |
| Bug Fix | Reproduce a reported defect, establish its failure mechanism, fix the root cause, and verify the same surface. | Fix Root Causes, Prove It Works, Boundary Discipline | [Implemented](../playbooks/bug-fix.md) |
| Performance | Improve a measured slowdown against a captured baseline without unacceptable regression. | Prove It Works, Fix Root Causes, Build the Lever | Planned: `playbooks/performance.md` |
| Hillclimb | Improve one named metric through repeated measured hypotheses, retaining only demonstrated wins. | Sequence Verifiable Units, Prove It Works, Build the Lever | Planned: `playbooks/hillclimb.md` |
| Runtime Forensics | Diagnose a live runtime symptom with instrumentation; diagnosis is the deliverable. | Fix Root Causes, Prove It Works, Boundary Discipline | Planned: `playbooks/runtime-forensics.md` |
| Trace Forensics | Diagnose an already captured profile, trace, dump, or snapshot; diagnosis is the deliverable. | Fix Root Causes, Prove It Works, Guard the Context Window | Planned: `playbooks/trace-forensics.md` |
| Feature | Deliver new or changed behavior from an explicit data and interaction shape. | Model the Domain, Experience First, Prove It Works | [Implemented](../playbooks/feature.md) |
| Refactoring | Improve structure while pinning and preserving observable behavior. | Laziness Protocol, Minimize Reader Load, Prove It Works | Planned: `playbooks/refactoring.md` |
| Prototype | Build a deliberately throwaway decision instrument that answers a concrete uncertainty. | Exhaust the Design Space, Experience First, Prove It Works | Planned: `playbooks/prototype.md` |
| Visual Parity | Match a reference surface at agreed viewports and states with direct visual evidence. | Experience First, Prove It Works, Sequence Verifiable Units | Planned: `playbooks/visual-parity.md` |
| Figure It Out | Design a proportionate bespoke run with a falsifiable outcome when no permanent playbook fits. | Foundational Thinking, Sequence Verifiable Units, Prove It Works | [Implemented](../playbooks/figure-it-out.md) |
| Project Setup / Modernization | Establish or migrate the smallest coherent project baseline, composing `mu-stack` for JS/TS choices. | Foundational Thinking, Outcome-Oriented Execution, Prove It Works | Planned: `playbooks/project-setup.md` |
| Code Review | Return prioritized, evidence-backed findings; add operational or interactive review capabilities only when warranted. | Minimize Reader Load, Boundary Discipline, Prove It Works | [Implemented](../playbooks/code-review.md) |
| Authoring a Skill | Place, design, validate, behavior-test, project, and review a skill end to end. | Minimize Reader Load, Guard the Context Window, Encode Lessons in Structure | Planned: `playbooks/authoring-a-skill.md` |
| Session Pickup | Resume after a real discontinuity by reconstructing authoritative state and locating or creating the verified work environment. | Guard the Context Window, Prove It Works, Make Operations Idempotent | [Implemented](../playbooks/session-pickup.md) |
| Pause Safely | Stop now at a verified boundary and emit a checkpoint-ready resume packet without automatically continuing. | Guard the Context Window, Make Operations Idempotent, Prove It Works | [Implemented](../playbooks/pause-safely.md) |
| Autonomous Run | Drive one live-session task to a named predicate with observable checkpoints; do not claim survival across process exit or sleep. | Outcome-Oriented Execution, Sequence Verifiable Units, Never Block on the Human | Planned: `playbooks/autonomous-run.md` |
| Opening a PR | Prepare coherent, reviewed, evidenced work for reviewers, then push and open only when authorized. | Prove It Works, Sequence Verifiable Units, Minimize Reader Load | Planned: `playbooks/opening-a-pr.md` |

## Ambiguity rules

- **Bug Fix vs Investigation:** choose Bug Fix when the requested deliverable includes a correction; choose Investigation when it ends at a diagnosis or answer.
- **Feature vs Refactoring:** choose Feature when observable behavior changes; choose Refactoring when behavior preservation is the acceptance criterion.
- **Prototype vs Feature:** choose Prototype when the artifact exists to decide and may be discarded; choose Feature when the artifact must become maintained product behavior.
- **Performance vs Hillclimb:** choose Performance for one bounded measured defect; choose Hillclimb for a sustained metric-optimization loop.
- **Runtime vs Trace Forensics:** choose Runtime Forensics for live observation; choose Trace Forensics for a captured artifact.
- **Investigation vs Figure It Out:** choose Investigation for a bounded read-only question; choose Figure It Out when the workflow itself must be designed, including an engineering plan using its [planning recipe](../playbooks/figure-it-out.md#planning-recipe). Planning alone does not authorize implementation.
