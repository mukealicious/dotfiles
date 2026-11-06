# Audit motion and plan improvements

Use for a codebase motion survey, prioritized roadmap, opportunity discovery, or selected implementation plans. Keep application source read-only. A plan is a handoff, not implementation permission. Do not install, format, commit, delegate, select models, or execute plans automatically.

Read [audit coverage](../references/motion/audit.md) and [motion standards](../references/motion/standards.md). Use [selection](../references/motion/selection.md) when finding new opportunities or judging excessive motion. For a single diff, use [motion-review.md](motion-review.md).

## 1. Recon before judgment

Map framework/library versions, accessible primitives, motion locations, token ownership, product personality, target devices, and documented tradeoffs. Inspect relevant project guidance and existing changes. Build a frequency map; mark assumptions instead of treating every keyboard action as high-frequency.

Agree scope/effort: quick high-traffic coverage, standard interactive UI, or deep coverage including marketing/rare flows. A focused category still needs enough recon to avoid wrong recommendations.

**Complete when:** the motion surface and conventions are mapped, and the coverage boundary is explicit.

## 2. Audit the agreed surface

Work through all 8 categories in the coverage reference, or the requested subset: purpose/frequency, easing/duration, physicality/origin, interruption, performance, accessibility, cohesion/tokens, and opportunities.

Keep a coverage ledger with inspected locations, evidence, clear findings, and gaps. Trace shared primitives to consumers; a shared-token fix can matter more than many isolated polish edits. Load [component behavior](../references/motion/components.md) for panels, tooltips, toasts, or dismissible controls even when motion was not explicitly requested. Load [mobile](../references/mobile.md) for phone-facing flows.

**Complete when:** each scoped category and surface is cleared, has findings, or has an explicit evidence blocker. Repository size does not authorize automatic delegation.

## 3. Vet, rank, and report

Re-read every cited location and resolve actual defaults/overrides. Reject duplicate, misattributed, and intentional tradeoff findings unless new harm is evidenced. Use [verification](../references/verification.md) to distinguish observed behavior from code risk or feel uncertainty.

Present the coverage reference's findings table ordered by user impact, frequency, confidence, and effort. List a few additive opportunities separately; gate each one. For opportunity-focused requests, include rejected candidates and their reasons. An already coherent motion system can yield no findings.

**Complete when:** every presented finding has current `file:line` evidence, a concrete remedy, and a defensible priority. List unresolved verification separately.

## 4. Stop for plan selection

Ask which findings should become plans unless the user already selected them or supplied an explicit selection rule. A noninteractive run does not create permission to pick the top 3–5. End with the report when selection is unavailable.

**Complete when:** plan scope is explicitly selected. Review findings alone never authorize source changes.

## 5. Write self-contained selected plans

Read [plan template](../references/motion/plan-template.md). Use an authorized project destination/convention, or return plans in the response. Preserve existing numbering and unrelated plans.

Each plan includes baseline commit plus relevant working-tree state, exact paths/current excerpts, exact target values, the project's own exemplar, ordered edits, boundaries, dependencies, mechanical checks, real-page feel checks, interruption/reduced-motion/device cases, and observable completion criteria. Shared findings can merge only when their fix and files genuinely coincide.

**Complete when:** another implementer can act without this conversation, each selected finding is covered, and no plan relies on unspecified taste or “as discussed.” Record execution order/status in an existing authorized index if applicable. Do not execute the plan.

## Narrow variants

| Request | Path |
| --- | --- |
| Quick / deep / category focus | Same sequence with explicit narrower/wider coverage |
| Find animation opportunities | Recon, seam sweep, full gate, ranked suggestions and rejections; no implementation |
| Plan a named improvement | Recon enough to specify it, then write the selected plan; no artificial full audit |
| Reconcile existing plans | Compare source with plan baselines, refresh stale references/status with permission; no implementation |
| Execute a plan | Separate implementation task through [motion-implement.md](motion-implement.md), only when explicitly authorized |

## Output

Give the vetted findings, coverage and evidence limits, selected plan paths or inline plans, and any remaining selection question. State exactly what was not verified. Keep review, planning, and implementation permission separate.
