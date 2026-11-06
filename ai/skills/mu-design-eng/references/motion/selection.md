# Motion selection and safe subtraction

Use when finding opportunities, deciding what to keep, or removing excess motion. [standards.md](standards.md) owns the frequency/purpose/speed/function gate and target values.

## Find opportunities without producing a wishlist

Inspect each seam class. Record a candidate with `file:line`, or explicitly clear the class.

| Seam | Look for | Candidate, only after the gate |
| --- | --- | --- |
| Feedback gaps | Pressable controls with no visible feedback | Press/color feedback; preserve keyboard focus and activation |
| Deliberate confirmation | Easy accidental destructive action | Accessible confirmation; a hold fill only if appropriate |
| Teleporting state | Conditional content, collapses, added/removed rows | Brief transition that explains the change |
| Missing spatial connection | Trigger panel, sheet/toast entering and leaving unrelated edges | Origin-aware entrance and coherent exit |
| Occasional group entrance | Rare grid, onboarding hierarchy | One restrained group treatment |
| Gesture seam | Hard stops, distance-only dismissal, jump on reversal | Spring/velocity/resistance tuned on hardware |
| Rare high-emotion moment | First-run success or completion | A limited delight budget |

Search examples: conditional renders (`isOpen &&`), visibility toggles, `onClick`, `:active`, `details`, drag handlers, mapped lists, empty states, and success components. Missing animation alone is not a defect.

Cap whole-app suggestions around 5–7; a single view should need fewer. Give exact proposed properties/values from project tokens or the standards, reduced-motion behavior, and a testable purpose. List 2–5 rejected candidates where available, with the gate reason. Zero surviving opportunities is a valid result.

## Hunt for excess

- Repeated command menus, tab/route switches, sidebar navigation, and row hovers that visibly hold up use.
- Scroll reveals on every section or every revisit, especially when they hide content from fast scrolling or anchor navigation.
- Decorative card lifts, pulsing badges, glowing borders, ambient orbs, or icons that spin without conveying status.
- Charts that redraw from zero on every mount, counters that count up without a real change, and table-row entrances on every fetch.
- Long list staggers or stacked parent/child entrances.
- Flashing spinners/skeletons for operations commonly below roughly 300ms. Measure before introducing a delay, and preserve immediate action acknowledgment and error feedback.
- `transition: all`, unused motion utilities, or animation infrastructure that no longer serves a purpose.

Search `transition`, `animation`, `@keyframes`, `motion.`, `animate`, `whileInView`, `whileHover`, `AnimatePresence`, `layout`, `stagger`, `infinite`, `IntersectionObserver`, and equivalent framework utilities.

## Reduction choices

These are options after the gate, not blanket replacements:

| Existing treatment | Smaller equivalent to consider |
| --- | --- |
| Frequent hover scale/lift/shadow | Color or opacity, at most about 150ms, `ease` |
| Frequent slide/scale entrance | Opacity-only around 150ms, or instant |
| Unjustified slow routine UI | 200–250ms with its current curve |
| Long stagger | Around 30ms steps with a bounded total, or one group appearance |
| Persistent decorative loop | One run or a static final state |

If the smaller version no longer communicates its purpose, remove it. Keep motion that prevents disorientation or explains a real state change. Documented product choices deserve explicit consideration; they are not proof against a new accessibility failure or measured regression.

## Removal hazards: inspect before editing

| Hazard | Required preservation |
| --- | --- |
| Initial `opacity: 0`, hidden reveal class, `initial`, forwards-filled keyframe | Set visible final state when animation is removed |
| `animationend`, `transitionend`, `onExitComplete`, duration-sized timeout | Move required state/lifecycle work to an explicit non-animation path |
| Exit presence delays unmount | Preserve cleanup, focus restoration, and semantic close state with immediate unmount |
| Focus scheduled after motion | Move focus immediately at the correct state transition |
| `layout`/FLIP masks a real jump | Check the unanimated layout; report an out-of-scope layout defect rather than hiding it |
| Test waits/selectors depend on animation | Update tests to verify user-observable state, not elapsed decorative duration |
| Reduced-motion path already bypasses callbacks | Keep both paths correct; do not reintroduce a wait |

Then remove only proven orphans: unreferenced keyframes/utilities, empty variants/presence wrappers, unused imports, motion wrappers with no motion props, and unused config/token entries. Search all consumers before removing a shared token. Propose dependency removal separately; do not uninstall automatically.

For a subtraction-only request, keep useful animations unchanged and list any retuning work separately. Verification must include all formerly hidden content, rapid state changes, immediate focus, cleanup, and absence of stale references.
