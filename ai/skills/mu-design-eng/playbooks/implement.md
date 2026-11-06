# Implement or refine a direction

Use for a chosen UI direction or a bounded repair. A small fix does not require
shaping, prototyping, or a full-surface audit first.

1. **Inspect and bound.** Read the touched code, project conventions, existing
   components/tokens, and the request. Reproduce a reported visible defect where
   possible. Identify the expected user-visible result and the states it affects.
   **Done:** the change has a clear target, scope, and verification scenario.
2. **Choose the relevant knowledge.** Read
   [visual design](../references/visual-design.md) for layout, hierarchy, type, or
   color; [content and states](../references/content-and-states.md) for forms,
   onboarding, copy, accessibility, or recovery; [mobile](../references/mobile.md)
   for touch and viewport behavior. For components with feedback, transitions,
   gestures, or temporal states, read [component behavior](../references/motion/components.md),
   [motion standards](../references/motion/standards.md), and the applicable
   [component recipes](../references/motion/recipes.md), even if
   the request does not mention animation. If motion itself is the task, use
   [motion implementation](motion-implement.md); use [choreography](motion-choreography.md)
   for multi-part sequencing. **Done:** consequential choices fit existing tokens,
   behavior, and the user's intent. Material unresolved direction goes back to the
   user rather than becoming an unsolicited redesign.
3. **Implement.** Make the smallest coherent change. Cover the applicable default,
   loading, error, empty, focus, and responsive states identified in step 1.
   Follow the project's framework and dependency choices. **Done:** the affected
   interaction works in code and unrelated behavior remains intact.
4. **Verify.** Follow [rendered verification](../references/verification.md), run the
   smallest relevant project checks, and inspect the diff. **Done:** actual-page
   scenarios pass, or remaining verification is explicitly blocked.
5. **Report.** State the user-visible change, concrete evidence, tradeoffs, and
   checks not run. **Done:** the report distinguishes implemented from verified
   behavior and does not imply deployment or acceptance that did not occur.
