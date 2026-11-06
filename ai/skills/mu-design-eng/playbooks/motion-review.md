# Review a motion diff

Use for existing animation code or a bounded diff. Review source and behavior; do not edit implementation, install packages, run mutating setup, or turn recommendations into changes. Use [motion-audit.md](motion-audit.md) for a broader codebase roadmap.

Read [motion standards](../references/motion/standards.md). They own the values, purpose gate, accessibility requirements, and context-dependent exceptions. For component behavior, read [components](../references/motion/components.md); for multiple moving parts, read [choreography](../references/motion/choreography.md).

## 1. Bound and inventory the review

Confirm the diff/base or exact files. Inspect current worktree changes without discarding them. Read changed motion and relevant callers, styles, tokens, primitive defaults, installed APIs, tests, and documented design decisions.

Inventory each affected animation: trigger, frequency, purpose, driver, properties, duration/delay/curve, origin, exit, interruption, and reduced-motion path. Expand inherited tokens and broad utilities rather than reviewing only literal diff lines.

**Complete when:** every changed motion behavior and its dependent lifecycle are accounted for. Identify any adjacent behavior inspected only to establish context.

## 2. Apply the craft bar with evidence

Check every inventory row against:

1. Justified purpose and frequency, with no decorative wait on a core action.
2. Responsive easing and total timing, including delay and group completion.
3. Correct trigger origin, scale, paths, and centered-modal exceptions.
4. Retargeting/cancellation for rapid or reversible interactions.
5. Rendering cost and actual driver behavior; use [performance](../references/motion/performance.md) where relevant.
6. Reduced-motion, keyboard/focus, pointer/touch, and pause/stop requirements.
7. Deliberate versus response timing where that distinction carries meaning.
8. Cohesion with the component and project; no layered entrances or arbitrary effects.
9. Hidden-state, timer, focus, unmount, and callback correctness, including removed motion.
10. Readable, usable content throughout and after the transition.

Search for `transition: all`, excessive `scale(0)`, slow ease-in entrances, unjustified long timing, wrong anchored origins, restarted keyframes, per-frame inherited variables, layout/paint work during navigation, missing reduced-motion, ungated hover, and unnecessary stagger. These are investigation triggers, not automatic verdicts based on syntax alone. Pure fades, keyboard-triggered motion, required height animation, and documented timing exceptions can be correct.

**Complete when:** every affected behavior has either a confirmed finding or a justified pass. No finding rests only on a value differing from the reference.

## 3. Verify and vet

Use [verification](../references/verification.md) for available browser evidence. Check normal-speed response, 2–5× slowed playback or frames, rapid reversal, reduced motion, and relevant device behavior. Re-read every cited `file:line`; deduplicate common root causes and reject modal/marketing/library-default false positives.

Prefer removing unjustified motion, then reducing it, then correcting timing/origin/interruption/cost before adding polish. Accessibility is required throughout. A proposed blur or stagger is not a substitute for a proven lifecycle defect.

**Complete when:** observed failures, static-code risks, and uncertain feel judgments are clearly separated. If browser access is unavailable, state the exact verification gap; static inspection must not masquerade as full approval.

## Output

First, one findings table with one row per issue:

| Severity / location | Before | After | Why / evidence |
| --- | --- | --- | --- |
| <impact and `file:line`> | <current code/behavior> | <specific remedy and exact token/value> | <user-visible effect and verification status> |

Then a concise verdict, grouping nonempty commentary by impact: feel/action regressions, missed simplifications, performance, interruption/timing, origin/cohesion, and accessibility. Promote critical accessibility issues to the highest impact rather than leaving them last.

Close with one explicit decision:

- **Block:** confirmed harmful behavior, inaccessible state, broken interaction/lifecycle, or a serious unresolved risk that prevents safe approval.
- **Approve:** no material defects found, needed lifecycle/accessibility checks pass, and evidence supports the result within the stated scope.
- **Needs verification:** code review is complete but a specific browser/device check can materially change the verdict.

Do not create findings to satisfy a quota. If motion already works well, say what was checked and stop. Implementation requires a separate authorized request.
