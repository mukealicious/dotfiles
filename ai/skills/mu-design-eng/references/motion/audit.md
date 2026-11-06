# Motion audit coverage

Use with [motion-audit.md](../../playbooks/motion-audit.md). [standards.md](standards.md) owns exact starting values and exceptions. This checklist owns search coverage, not a second rules catalog.

## Recon ledger

Record framework, motion/component libraries and versions, global tokens, CSS utilities, keyframe definitions, gestures, presence/layout APIs, product personality, target browsers/devices, and any documented tradeoffs. Build a frequency map with evidence or explicit assumptions.

Useful searches include `transition`, `animation`, `@keyframes`, `motion.`, `animate=`, `useSpring`, `ease-in`, `transition: all`, `scale(0)`, `prefers-reduced-motion`, `transform-origin`, `layoutId`, `setProperty`, `requestAnimationFrame`, and event callbacks. Search syntax is only discovery: inspect callers, styles, primitive defaults, and real behavior before judging.

## Eight categories

| Category | Inspect | Evidence required to clear it |
| --- | --- | --- |
| 1. Purpose and frequency | Repeated keyboard/menu/navigation actions; constant row hover; moving data; unexplained decoration | Each in-scope surface has a purpose and plausible frequency, or a removal/reduction candidate |
| 2. Easing and duration | Curves, delays, total stagger, slow entrances, tooltip provider skip-delay behavior, hold/release timing | Effective values resolved through tokens/overrides; measured or explicitly unverified response |
| 3. Physicality and origin | Anchored panels versus centered modals; excessive scale; press response; percent translations; exit direction | Actual origin and path checked, including collision-adjusted positioning and content size |
| 4. Interruptibility | Rapid toggles/toasts, resize/reversal, keyframe resets, gesture velocity and capture, boundary damping, cancellation | Lifecycle and callback paths traced; rapid-trigger cases observed or assigned a specific check |
| 5. Performance | Layout/paint properties, `all`, version-sensitive transforms, layout animation during navigation, inherited variables, frame-state updates, blur | Driver/property inventory plus measured traces where available; code risks labeled as risks |
| 6. Accessibility | Reduced motion, hidden initial states, focus timing, hover-only feedback, keyboard parity, pause/stop, flash risk | Both motion settings and supported inputs remain usable; no callback-only completion |
| 7. Cohesion and tokens | Nearly duplicate curves, conflicting durations/bounce, layered entrances, crossfade double exposure | Shared system identified; deviations justified or evidenced; polish separated from defects |
| 8. Missed opportunities | Feedback gaps, unexplained state changes, spatial relationships, rare explanation/delight | Candidate passes the gate; absence of animation alone is not a finding |

Use [selection.md](selection.md) for opportunity/removal sweeps and hazard checks, [performance.md](performance.md) for rendering evidence, and [choreography.md](choreography.md) for group relationships. Read [mobile.md](../mobile.md) for phone-facing surfaces.

## Scope and effort

| Effort | Coverage | Expected result |
| --- | --- | --- |
| Quick | High-traffic components and supplied problem area | Highest-impact verified issues; explicitly omitted surfaces |
| Standard | All interactive UI in the agreed app scope | Full category coverage ledger and prioritized findings |
| Deep | Whole agreed surface, including marketing and rare flows | Full ledger, low-priority polish, and cross-surface consistency |

A category focus narrows the audit, not the recon needed to interpret it. Do not imply whole-app approval from a quick or focused audit. Large scope does not authorize delegation or model selection.

## Vet and prioritize

Re-read every cited location. Resolve inherited defaults and actual call sites. Deduplicate shared-root-cause findings. Respect documented intentional choices unless new evidence shows harm. Reject false positives: centered modals, a justified large-surface duration, pure fade accessibility variants, and small necessary layout transitions can all be correct.

Severity is impact, not whether a value differs from the reference:

- **High:** blocked action, inaccessible content, lost state/focus, severe repeated delay, or observed dropped frames on a core flow.
- **Medium:** noticeable origin/timing/interruption/cohesion defect or an important unverified accessibility/performance risk.
- **Low:** optional polish, minor consistency, or a low-impact cleanup.

An accessibility issue can be High; it is not automatically a lower tier. Rank leverage by user impact, frequency, confidence, and effort. Separate observed defects, static-code risks, and subjective feel hypotheses. Do not manufacture findings to fill a quota.

## Report and plan gate

Use a vetted table:

| # | Severity | Category | Location | Evidence / finding | Fix summary | Confidence |
| --- | --- | --- | --- | --- | --- | --- |

Add a small separate opportunity list only where candidates survive the gate. Include rejected candidates when opportunity discovery is the requested focus. Record coverage gaps and what already works.

Stop for selection before writing plans, unless the user has already named the items or authorized a selection rule. Unattended execution does not authorize choosing work or implementing it. Plans use [plan-template.md](plan-template.md); they are a handoff, not permission to change source.
