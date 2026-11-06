# Implement motion

Use when asked to build or change an animation, transition, or gesture. For a review, use [motion-review.md](motion-review.md); for a codebase roadmap, use [motion-audit.md](motion-audit.md). A request to review or explore does not authorize implementation.

Read [motion standards](../references/motion/standards.md) before deciding whether anything should animate. Read [component behavior](../references/motion/components.md) for buttons, panels, tooltips, toasts, and dismissible surfaces, even when their motion is not the primary concern.

## 1. Establish the surface and permission

Inspect the requested component, its callers, state lifecycle, styles/tokens, existing primitives, dependencies/versions, and project instructions. Check current worktree changes. Identify target browsers/devices, product personality, and the actual requested behavior.

**Complete when:** the edited surface and source owners are known, user changes are preserved, and implementation is authorized. If the request only says “animate something,” ask for the target rather than emitting a canned introduction or inventing a feature.

## 2. Run the gate before choosing ingredients

Apply the standards' frequency → purpose → speed → function gate. Record the usage-frequency assumption and name the purpose. An immediate state change is a valid result. Reject or reduce decoration that delays frequently used actions, without treating keyboard input itself as a reason to remove useful feedback.

For “less motion” requests, read [selection and subtraction](../references/motion/selection.md). Keep that branch subtractive: identify what stays, inspect removal hazards, and avoid unrelated retuning.

**Complete when:** every in-scope element has a decision to add, keep, reduce, remove, or remain still, with its reason. For an addition-only task, stop without animation code if no proposed addition passes. For authorized changes to existing motion, rejection means subtraction work remains: continue through steps 3–5 to remove or reduce it, clear obsolete waits and hidden starts, and verify the resulting lifecycle. If removal exceeds the granted scope, report the recommendation rather than changing source.

## 3. Design the state transitions

For retained or added motion, choose the lightest suitable existing tool. Reuse accessible component primitives and the project's tokens. Select properties, origin, curve/duration or spring, exit path, and interruption strategy in that order. For removal, specify the immediate state transition and required focus, cleanup, and unmount behavior instead of choosing animation ingredients.

Read [recipes](../references/motion/recipes.md) for the matching component. If several parts move together, use [motion-choreography.md](motion-choreography.md) to write the timeline before coding. Read [performance](../references/motion/performance.md) for rendering tradeoffs, and [mobile](../references/mobile.md) for phone-facing viewport/gesture behavior.

Specify open, closed, interrupted, canceled, reduced-motion, and unmounted states. Include focus and action availability. A hidden start state must have a reliable visible destination even when animation is disabled. Handle normal and reduced-motion completion without relying solely on end events.

**Complete when:** the transition can be described with exact project tokens/values and observable behavior; no missing dependency is silently scheduled for installation.

## 4. Implement within the boundary

Write the smallest coherent change. Keep state ownership, semantics, focus, layout, and data flow intact. Ship the reduced-motion and pointer behavior with the animation. Add cancellation/cleanup for timers, promises, observers, capture, and animation handles where needed.

For subtraction, remove hidden starts and obsolete waits with the animation. Search consumers before deleting proven orphaned keyframes, tokens, wrappers, imports, or variants. Propose dependency removal separately.

**Complete when:** requested states and interruptions are implemented, no animation-only dependency controls required behavior, and unrelated code/user changes remain untouched.

## 5. Verify in the page

Use [verification](../references/verification.md), the standards' motion checks, and the smallest relevant project commands. Test at normal speed, then slowed/frame-by-frame. Trigger rapid reversal and repeated input. Check both reduced-motion settings, focus, pointer, and relevant touch behavior. Test actual content and concurrent page work, not only an isolated component.

**Complete when:** observed behavior meets the chosen purpose, timing is perceptible where intended without delaying action, cleanup works, and unverified device/browser cases are explicitly recorded. If code passes but the interaction still feels wrong, iterate within scope rather than declaring success from a typecheck.

## Output

The code is the deliverable. Summarize:

- Gate result: frequency, named purpose, and rejected motion.
- Ingredients: tool, properties, origin, curve/duration or spring.
- Changed paths and tests actually run.
- Exact feel/device checks still needed, if any.

For subtraction, include a compact removed/reduced table and the useful animations deliberately kept. Do not claim a visual or performance result that was not observed.
