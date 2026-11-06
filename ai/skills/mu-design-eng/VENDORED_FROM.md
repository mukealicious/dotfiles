# Design sources and preservation map

This is a locally composed candidate, not an unchanged upstream distribution.
The Owner requested one entry point with reusable guidance and focused playbooks.
The source map records where each contribution lives and what changed.

## Exact sources

| Source | Reviewed revision | Role |
|---|---|---|
| [pbakaus/impeccable](https://github.com/pbakaus/impeccable/tree/39bec7c08c8cb5d694221e2c2e4386140dde8759/source/skills/impeccable) | `39bec7c08c8cb5d694221e2c2e4386140dde8759` | Broad visual/product judgment and local critique vocabulary |
| [emilkowalski/skills](https://github.com/emilkowalski/skills/tree/c8a79627b59d72d764d6ab6f2c87c09a48169833/skills) | `c8a79627b59d72d764d6ab6f2c87c09a48169833` | Motion, interaction, mobile, stress testing, and working variants |
| [cursor/plugins, pstack](https://github.com/cursor/plugins/tree/2776ddd2355d6d6c8747d3964600f28daf62f049/pstack) | `2776ddd2355d6d6c8747d3964600f28daf62f049` | Condition-based entry point, playbooks, disclosed primitives, and bounded experiments |

The local Impeccable adaptations come from dotfiles baseline
`0cb399a46a338c303212662afa9b1f6c56b599b3`, including its local-only critique lenses.
The older upstream metadata named generated output; authoring source is the correct
comparison for these retained references.

## Notices

- Impeccable-derived material retains [Apache 2.0](licenses/impeccable-LICENSE)
  and its [attribution notice](licenses/impeccable-NOTICE.md).
- Emil-derived material retains its [MIT notice](licenses/emil-LICENSE).
- pstack-derived material retains [Lauren Tan's MIT notice](licenses/pstack-LICENSE).
  The package license was verified at `pstack/LICENSE` at the exact revision above.

The table below marks adapted files. License terms remain attached to their source
material; this composition does not relabel all contributions under one upstream license.

## Architecture from pstack

`pstack/skills/poteto-mode/SKILL.md` supplies the organizational pattern: conditional
triggers, a playbook index, and reusable knowledge reached on demand. The new
[entry point](SKILL.md) adopts that pattern for design only.

Unlike pstack's independently invoked principle skills, this candidate uses plain
reference files. It does not attempt to invoke manual-only skills from a router.
The root remains manual-only during evaluation, so it does not compete with the
current automatic design owner.

The [exploration playbook](playbooks/explore.md) adapts
`skills/poteto-mode/playbooks/prototype.md`: name the decision, isolate the experiment,
compare alternatives, observe the relevant behavior, and return a decision.
Emil's promotable variants remain a distinct artifact purpose within that playbook.

The migration acceptance record borrows `playbooks/eval.md` methods: separate tasks
and criteria, sanitize approach labels where practical, inspect artifacts and available
transcripts, and record limitations. Evaluation is not an always-loaded design workflow.

Excluded: pstack autonomy grants, model selection, required subagents, broad trigger
cascades, verbatim todo copying, mandatory PRs, external-action permission, and
`cursor-team-kit` dependencies. Existing harness and repository rules keep authority.

## Emil preservation map

Paths in the source column are relative to upstream `skills/`. Local destinations
are plain documents, not separately discoverable skills.

| Upstream | Local destination | Behavior preserved |
|---|---|---|
| `emil-design-eng/SKILL.md` | [Standards](references/motion/standards.md), [component behavior](references/motion/components.md), [recipes](references/motion/recipes.md), [performance](references/motion/performance.md) | Purpose/frequency decisions, exact curve and spring examples, component feedback, origins, interruption, gestures, hidden-tab timers, continuous toast hover regions, rendering cost, accessibility, browser inspection |
| Selected `ask-sonner/SKILL.md` | [Component behavior](references/motion/components.md), Existing Sonner projects | Root placement, stable-ID updates, explicit multiple-toaster targeting, callback distinctions, and troubleshooting; full API catalog deferred |
| `animate/SKILL.md`, `animate/RECIPES.md` | [Motion implementation](playbooks/motion-implement.md), standards and recipes | Scoped implementation, tool choice, concrete CSS/JS patterns, context-sensitive timing, verification |
| `review-animations/SKILL.md`, `review-animations/STANDARDS.md` | [Motion review](playbooks/motion-review.md), standards, recipes, and performance | Diff-scoped findings, concrete before/after corrections, evidence, explicit verdict, no source edits |
| `improve-animations/SKILL.md`, `improve-animations/AUDIT.md`, `improve-animations/PLAN-TEMPLATE.md` | [Motion audit](playbooks/motion-audit.md), [audit categories](references/motion/audit.md), [plan template](references/motion/plan-template.md) | Recon, complete category coverage, confirmed findings, priorities, selection gate, self-contained plans, known-issue planning branch |
| `choreograph/SKILL.md`, `choreograph/RECIPES.md` | [Choreography](playbooks/motion-choreography.md), [sequencing reference](references/motion/choreography.md), [recipes](references/motion/choreography-recipes.md) | Motion beats, overlaps, hierarchy, replay, implementation examples, real-page observation |
| `animation-performance/SKILL.md` | [Performance diagnosis](playbooks/motion-performance.md), performance reference | Measured rendering diagnosis, driver selection, explicit-property and inherited-variable costs, before/after evidence |
| `find-animation-opportunities/SKILL.md`, `remove-animations/SKILL.md` | [Selection](references/motion/selection.md), motion implementation and audit | Purposeful additions versus removal, frequency, scope, preserving useful feedback |
| `mobile-native/SKILL.md` | [Mobile](references/mobile.md) | Viewport, safe area, keyboard, scrolling, touch, gestures, real-device verification |
| `break-ui/SKILL.md`, `break-ui/CATALOG.md` | [Stress testing](playbooks/stress-test.md), [stress cases](references/stress-cases.md) | Realistic adversarial content, isolated fixtures, reproducible findings, reporting boundary |
| `prototype/SKILL.md`, `prototype/PICKER.md` | [Explore](playbooks/explore.md), [picker contract](references/picker.md) | Distinct working variants, named axes, realistic context, full-size selection, replay, user choice, integration and cleanup boundaries |

### Deliberate Emil adaptations

- Shared standards own repeated knowledge. Playbooks keep task scope, ordered steps,
  completion criteria, and explicit conditional pointers to standards and recipes.
  Repeated readiness speeches and author-persona introductions are omitted; concrete
  craft criteria and the diagnostic workflow carry the standard instead. Mandatory
  review formatting is retained where it helps precise motion findings, not imposed
  on every design conversation.
- General component implementation and exploration read the applicable motion
  references for feedback, transitions, gestures, or temporal states. An explicit
  animation request is not required to reach component craft guidance.
- Component lifecycle hardening is local elaboration: combined pause reasons,
  remaining-visible-time bookkeeping, stale timer/callback protection, listener
  cleanup, focus continuity, and regression scenarios. Emil supplies the hidden-tab
  timer and continuous-hover-region ideas. Selected Sonner diagnosis is retained;
  exact APIs still come from the project's installed version.
- Project conventions, accessibility, and observed behavior govern exceptions.
  Timing ranges, easing, press scales, bounce, and frequency are strong defaults,
  not universal bans. Keyboard operation does not inherently prohibit useful motion.
- Reduced motion can remove motion entirely. Pure fades are not automatically defects.
  Transform/opacity are useful starting points, not a guarantee of GPU execution.
  Layout, clipping, filter, and library-version decisions require observation.
- Choreography owns group sequencing. Examples must not make uniform stagger a
  conflicting universal rule. Long total delays remain a usability concern.
- Audit, plan writing, and execution permissions stay separate. The audit's
  automatic executor, model choices, and mandatory fan-out are removed.
- Library suggestions do not authorize installation. Device testing does not
  authorize binding a server to all interfaces.
- Picker appearance is not copied verbatim. The contract permits accessible touch
  sizes, contrast, placement, and safe-area adaptation. It fixes invalid URL fallback,
  modified-key handling, unsafe string rendering, mount races, and focus behavior.
  Shortcuts are picker-scoped by default so they do not steal prototype interactions.
- No standalone implementation script is bundled. Markdown recipes remain examples
  to adapt within the target project's toolchain and authorization. Local recipe
  corrections include guarded async cancellation, semantic protection for duplicate
  views, full group-duration budgeting, and avoiding render-time ref mutation.
- General brand-philosophy speeches and documentation-site advice from
  `emil-design-eng` are not duplicated. Visual judgment lives in the Impeccable-derived
  reference; the candidate does not claim a documentation-site workflow.

Deferred as standalone scope: `animate-expo`, `write-swift`, `apple-design`,
the full `ask-sonner` workflow/API catalog, `pick-ui-library`, and
`animation-vocabulary`. Platform, library, and vocabulary requirements can justify
later branches; they are not silently claimed as complete coverage. Selected
Sonner diagnosis and component craft from `emil-design-eng` remain retained.

## Impeccable preservation map

Source paths are under `source/skills/impeccable/` at the pin, except the local-only lens file.

| Source | Local destination | Adaptation |
|---|---|---|
| Local `reference/critique-lenses.md` | [Critique lenses](references/critique-lenses.md) | Retains all 11 lenses; qualifies option-count and motion-property diagnoses |
| `SKILL.md`, `reference/brand.md`, `reference/product.md` | [Visual design](references/visual-design.md), entry context, [implementation](playbooks/implement.md) | Keeps proportional context, register, hierarchy, identity, semantic roles, and component fit; removes universal aesthetic bans |
| `reference/shape.md` | [Shape](playbooks/shape.md) | Keeps design-brief fields and discovery; removes mandatory interviews, image generation, and command dispatch |
| `reference/ux-writing.md`, `reference/product.md` | [Content and states](references/content-and-states.md) | Keeps actionable labels, errors, onboarding, localization, state coverage; corrects unsupported claims and rigid language percentages |
| Local `reference/critique.md`, `reference/polish.md` | [Critique](playbooks/critique.md), [implementation](playbooks/implement.md) | Keeps evidence-based diagnosis and bounded refinement; removes live detection and mandatory review orchestration |

Impeccable's helper runtime, command aliases, source injection/wrapping, polling,
context-renaming loader, CSP changes, and CLI invocation are not copied. The old
source remains outside this candidate until the retirement gates pass.

Broad Impeccable workflows such as design-system extraction and durable brand-context
setup are not claimed as full replacements. Their future retention must follow a
demonstrated gap, not an automatic import of every command.

## Local composition and validation

[Verification](references/verification.md) owns the shared actual-page evidence
contract. Other playbooks add only their branch-specific scenarios. The repository's
writing-for-agents guidance informed pointer conditions, co-location, and completion criteria.

Run `node ai/test-design-skill.mjs` for structural and disposable projection checks.
Run `bun test ai/watch.test.ts` for source-metadata parsing. These do not prove model
routing or design outcomes. Complete the repository acceptance record before
promoting this candidate or retiring the current owner.
