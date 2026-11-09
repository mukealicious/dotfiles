---
name: mu-design-eng
description: Design interfaces through focused playbooks for critique, exploration, implementation, and interaction craft.
disable-model-invocation: true
user-invocable: true
metadata:
  watch-sources: |
    pbakaus/impeccable/source/skills/impeccable@39bec7c08c8cb5d694221e2c2e4386140dde8759
    emilkowalski/skills/skills@c8a79627b59d72d764d6ab6f2c87c09a48169833
    cursor/plugins/pstack@2776ddd2355d6d6c8747d3964600f28daf62f049
---

# mu-design-eng

One entry point for interface judgment and implementation. Use the playbook that
matches the requested outcome, then load its references when their conditions apply.
Playbooks are plain documents, not separately invoked skills.

## Frame the task

Read the affected surface, relevant project guidance, existing components, tokens,
and available product/design context. For a bounded change, inspect only what it
needs. Missing `PRODUCT.md` or `DESIGN.md` is not a reason to create either file.
Read context directly; preserve legacy files and names.

Establish the surface, intended outcome, and permission: review, plan, experiment,
or implementation. Infer these from the request and evidence; ask only when an
unresolved choice materially changes the result. A bare invocation needs a target
or question, not a full design interview.

**Ready:** the target, constraints, and permitted output are clear enough to choose
one row below. An unavailable page or uncertain requirement stays an explicit gap.

## Choose the playbook

Choose the most specific matching row. A narrow task stays narrow; the table is
not a sequence to complete. Open the selected playbook before doing its work.

| Requested outcome | Read | Completion boundary |
|---|---|---|
| Review a particular animation change or diff | [Motion review](playbooks/motion-review.md) | Findings and verdict; source stays unchanged |
| Audit motion across a surface or plan animation improvements | [Motion audit](playbooks/motion-audit.md) | Vetted priorities; write plans only when requested |
| Diagnose dropped frames or costly animation | [Motion performance](playbooks/motion-performance.md) | Measured cause; fixes only within granted scope |
| Sequence a multi-part entrance, reveal, or transition | [Motion choreography](playbooks/motion-choreography.md) | Coherent sequence verified in its real context |
| Add, tune, reduce, or remove motion on a known interaction | [Motion implementation](playbooks/motion-implement.md) | Purposeful behavior, interruption and reduced motion verified |
| Stress an interface with long content, empty states, zoom, or unusual data | [Stress test](playbooks/stress-test.md) | Reproducible findings; repair only if requested |
| Critique visual hierarchy, usability, brand direction, or accessibility | [Critique](playbooks/critique.md) | Evidence, impact, and corrections; source stays unchanged |
| Plan an interface or flow before coding | [Shape](playbooks/shape.md) | Design brief with states, constraints, and open decisions |
| Compare alternatives or prototype an uncertain direction | [Explore](playbooks/explore.md) | Working alternatives and a decision; integration requires approval |
| Build a chosen direction or make a bounded UI refinement | [Implement](playbooks/implement.md) | Scoped change and rendered verification |

For a mixed request, start with the outcome that blocks the others. Reuse evidence
and load another playbook only when the task reaches that branch. A critique or
planning request remains read-only on implementation source even if the next step
looks obvious. Prototypes require a request for exploration or agreement on that
scope; uncertainty alone does not authorize building one.

## Shared judgment

Existing project conventions and accessibility requirements govern the result.
Design defaults guide choices; observable behavior and deliberate product tradeoffs
can justify exceptions. Preserve the reason with the choice.

Read [visual design](references/visual-design.md) when choosing or judging hierarchy,
type, color, composition, or brand/product register. Read [content and states](references/content-and-states.md)
for forms, onboarding, recovery, localization, or state-rich UI. Read
[mobile](references/mobile.md) when touch, viewport, keyboard, or safe-area behavior
matters. Detailed motion knowledge belongs to the motion playbooks, not this entry point.

Use ordinary project and browser tools. This skill supplies no live helper,
filesystem bridge, automatic source acceptance, package installer, or CSP editor.
Existing harness and project rules own execution, dependencies, network exposure,
delegation, and shipping.

For quantitative graphics use `tufte-data-viz`; for editable Pen deliverables
use `pen-design`; for workflow wiring
use `breadboarding`. Their specialist ownership remains intact.

For every rendered claim, follow [verification](references/verification.md).
For source maintenance, attribution, or adoption review, read [provenance](VENDORED_FROM.md).
