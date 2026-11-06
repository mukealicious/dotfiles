# Design skill candidate acceptance

Status: `mu-design-eng` remains manual-only by explicit Owner choice. The Owner subsequently authorized removal of Impeccable and all its live-mode tooling, without automatic activation of the replacement. Earlier trial results below remain historical evidence, not outcome-equivalence claims.

The validation table below records the pre-install candidate checks. Trial installation enables explicit use; it does not establish routing or rendered outcome equivalence.

The Owner approved one entry point with playbooks and references after rejecting the earlier separate-skill architecture. The Owner explicitly requires preservation of Emil's specialist depth.

## Candidate contract

- One manual entry point: `ai/skills/mu-design-eng/SKILL.md`.
- Plain playbooks preserve distinct workflows. References own shared knowledge.
- Impeccable supplies visual/product judgment and critique vocabulary.
- Emil supplies detailed motion and interaction workflows, recipes, mobile guidance, and stress cases.
- pstack supplies condition-based composition. Its model rules, delegation machinery, external-action authority, and shipping workflow are excluded.
- No new executable helper or package dependency ships with the candidate.
- Impeccable source, executable helpers, projector special cases, and automatic handoffs are removed. Installer regression coverage verifies retirement across all 4 providers while preserving the manual replacement.

The [source map](../ai/skills/mu-design-eng/VENDORED_FROM.md) records adaptations and deliberate exclusions. The [migration plan](impeccable-replacement-plan.md) retains process, residue, recovery, and runtime gates.

## Preservation review

Review a workflow against the exact source, not against its description alone.
For each selected Emil workflow, inspect:

1. Task scope and the boundary between review, planning, and implementation.
2. Ordered investigation steps and exhaustive coverage where needed.
3. Concrete diagnostic criteria, values, examples, and recipes.
4. Completion criteria and actual-browser verification.
5. Exceptions, caveats, and recorded reasons for local changes.

A shorter file is not a success criterion. Remove repeated rules only when another reachable reference owns their meaning. Keep detailed recipes behind explicit branch pointers.

## Routing cases

These cases are a human/model walkthrough set, not a keyword router or a benchmark score. Use ordinary prompts and check the first playbook read, subsequent reference reads, and permission boundary.

| Request | Expected first playbook | Required boundary |
|---|---|---|
| Review this dropdown animation diff; do not change it. | `motion-review.md` | Findings and verdict only |
| Audit motion throughout the app and prioritize improvements. | `motion-audit.md` | Confirm findings; plans only when requested; no implementation |
| Write an implementation plan for this known motion defect. | `motion-audit.md` | Focused recon and self-contained plan, not a full unrelated audit |
| The drawer drops frames when I drag it. Diagnose why. | `motion-performance.md` | Measure before recommending; diagnosis is not repair permission |
| Make these hero elements enter as one sequence. | `motion-choreography.md` | Sequence purpose and observed timing, not uniform stagger by reflex |
| Remove distracting animation from this frequent action. | `motion-implement.md` | Continue through actual removal, visible final content, preserved feedback, and obsolete-wait cleanup |
| Stress this screen with long names and empty datasets. | `stress-test.md` | Isolated fixtures; report before unrequested fixes |
| Critique the hierarchy and copy on this landing page. | `critique.md` | Visual/content evidence; no unsolicited code changes |
| Plan this settings flow before coding. | `shape.md` | Brief, states, and open decisions; no implementation |
| Show me 3 genuinely different versions of this toast. | `explore.md` | Isolated working variants; wait for selection and integration authorization |
| Fix the clipped label on mobile. | `implement.md` | Bounded fix plus mobile reference; no full redesign or prototype |
| Build a popover using existing primitives. | `implement.md` | Load Emil component standards/recipes despite no explicit animation request |
| Compare 3 toast designs. | `explore.md` | Load temporal/component guidance, including timers and hover behavior |
| Add a bar chart to this report. | `implement.md` with `tufte-data-viz` | Specialist owns quantitative graphics |
| Use mu-design-eng. | Clarify target | No full interview or automatic playbook sequence |

A route passes only when its references are actually read where the branch requires them. A file-link assertion proves reachability, not that a model will follow the pointer.

## Outcome comparison before cutover

Use disposable copies of identical project snapshots. Compare original Emil guidance and the candidate on matching motion tasks. Compare current instruction-only Impeccable guidance and the candidate on broader design tasks. Keep all privileged helpers unused.

Hold judging criteria separately from ordinary task prompts. Use sanitized output labels where practical. Keep Owner-selected model settings fixed. Inspect actual diffs, rendered behavior, and available read/tool records rather than agent self-reports. Record limitations of blinding.

| Task | Critical criteria |
|---|---|
| Bounded UI repair | Correct scope, token reuse, preserved surrounding behavior, actual-page evidence |
| Open design decision | Material divergence, realistic context, working interactions, explicit artifact purpose, user choice |
| Dense product screen | Hierarchy, content extremes, states, recovery, keyboard/focus, narrow layouts, actionable copy |
| Motion/gesture interaction | Purpose, perceptibility, interruption, rapid reversal, reduced motion, input methods, observed performance |
| Brand-heavy landing page | Coherent visual voice, type/color/composition, information architecture, responsive behavior, contextual identity |

Browser validation must use the integrated page, not only an isolated preview. Screenshots support spatial claims; recordings or observed traces support timing and interruption claims. An unavailable browser leaves outcome acceptance blocked.

## Validation record

| Check | Status |
|---|---|
| `node --check ai/test-design-skill.mjs` | Passed |
| `bun test ai/watch.test.ts` | Passed: 12 tests, including exact parsing of all 3 source records |
| `node ai/test-design-skill.mjs` | Passed: runtime-reference reachability, notices, 4 provider projections, repeat projection, and negative fixtures |
| `sh ai/test-install.sh` with disposable HOME/repository fixtures | Passed; no real installed projection changed |
| Source mapping and independent content review | Passed for the authored candidate; reviewer found no remaining material defect after corrections |
| Routing cases executed as fresh model trials | Not run |
| Head-to-head rendered outcome comparison | Not run |
| Installed native discovery | Pending the approved trial installation; verify the exact `mu-design-eng` name and manual flag afterward |
| Old process termination and project-residue cleanup | Not run; runtime cutover is not authorized here |

## Independent review corrections

One independent read-only reviewer identified and verified corrections for:

- Multi-source metadata: use 3 block-scalar locators, with a real parser regression test.
- Component routing: implementation, exploration, and critique reach Emil's component
  lifecycle guidance even without an explicit animation request.
- Subtraction: rejecting existing motion continues through authorized removal,
  hidden-state cleanup, obsolete-wait cleanup, and lifecycle verification.
- Provenance: component guidance maps to both `emil-design-eng` and selected
  `ask-sonner` material; local hardening is distinguished from upstream content.

The final review found no remaining material defect in these corrections. It did
not establish fresh-model routing or rendered outcome equivalence.

## Promotion and rollback

The candidate is not yet the automatic design owner. Before promotion, pass preservation review, routing trials, and the outcome comparison. Resolve capability losses and legacy shortcut collisions with the Owner.

Then follow the migration plan: prepare a helper-free recovery source, test partial-provider recovery, remove retired active ownership, refresh through the owning installer, and verify runtime termination separately.

Before installation, rollback is deletion or revision of only this candidate and its documentation/test additions. Preserve unrelated work and the source evidence. Do not restore or launch vulnerable helpers as a fallback.
