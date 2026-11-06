# Critique an interface

Use for visual, product-UX, brand, or accessibility diagnosis. Keep implementation
source unchanged. For a single animation diff, use [motion review](motion-review.md);
for a codebase-wide motion roadmap, use [motion audit](motion-audit.md).

1. **Scope.** Identify the target, audience, primary task or message, constraints,
   and requested review breadth. Read the relevant components and project context.
   **Done:** the review surface is bounded and unavailable evidence is named.
2. **Observe.** Open the actual page when permitted. Read
   [critique lenses](../references/critique-lenses.md) and inspect every lens relevant
   to the surface. Read [visual design](../references/visual-design.md) for hierarchy,
   brand, type, or color; read [content and states](../references/content-and-states.md)
   for task flows, forms, recovery, or copy. Read
   [component behavior](../references/motion/components.md) when reviewing overlays,
   feedback, gestures, or temporal states such as toast dismissal.
   Use [verification](../references/verification.md)
   for browser evidence. **Done:** each relevant lens has observations or a stated
   evidence limit, including supported states and narrow layouts.
3. **Diagnose.** For each substantial issue, name the concept, cite the element and
   observable evidence, explain user impact, and propose a concrete correction.
   Check the source before assigning a cause. Separate observed defects from taste,
   deliberate tradeoffs, and hypotheses. **Done:** every finding is supportable;
   duplicate symptoms are grouped under their actual cause.
4. **Prioritize.** Order by user impact and leverage. State what should remain,
   especially conventions the proposed change could accidentally damage.
   **Done:** the report contains actionable findings, verification limits, and the
   next consequential decision. No numeric total or additional reviewer is required.

Use a compact findings table or the critique-lens format. Motion findings can use
Before / After / Why, with location and evidence included. A review is complete
without fixes; source edits require an implementation request.
