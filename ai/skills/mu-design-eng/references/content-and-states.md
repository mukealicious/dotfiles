# Content, accessibility, and states

Use for task-heavy interfaces, forms, onboarding, recovery, localization, and
responsive state coverage. Adapted from Impeccable's product and UX-writing guidance.

## State inventory

For each touched action, identify applicable default, focus, active, disabled,
loading, success, empty, partial, error, permission, and recovery states. Not every
component needs every state. Model the states that can actually occur.

Distinguish first use, no results after filtering, missing permission, and failed
loading. They need different explanations and next actions. Preserve entered data
through recoverable failures. Prevent duplicate submissions and describe whether a
retry is safe. Optimistic changes need visible failure handling and rollback.

Loading feedback should preserve context. Use a skeleton when the layout is known,
a progress indicator when progress is meaningful, and concise status text when it
helps. Avoid fabricated progress or unsupported promises about completion time.

## Interaction and accessibility

Use native semantic controls where possible. Verify accessible names, persistent
labels, field instructions, error associations, heading order, and meaningful link
text. Placeholders supplement labels; they do not replace them.

Keyboard users must reach and operate the touched controls. Focus order follows
the task, focus remains visible, and opening/closing overlays manages focus correctly.
A modal needs appropriate containment and return focus; an ordinary popover should
not acquire a modal trap by accident. Announce asynchronous status where needed
without flooding assistive technology.

Check zoom, reflow, touch targets, clipping, nested scrolling, and content expansion.
Use the project's accessibility target and applicable standards; a screenshot or
automated scan alone does not prove conformance. Contrast guidance lives in
[visual design](visual-design.md); temporal behavior lives in the motion references.

## Copy that explains the action

Prefer specific outcomes over ambiguous labels: `Save changes`, `Create account`,
`Download PDF`, or `Delete 5 items`. Keep established platform labels when they are
already clear. Match destructive language to actual reversibility; do not call an
archive a permanent deletion.

An error should say what happened, the known cause if useful, and the next action.
Example: `We could not save this draft. Your text is still here. Check your connection
and try again.` Claim preservation only if the implementation actually preserves it.
Never assert that support is investigating unless that is true.

Keep the product's voice consistent and adapt tone to the situation. Serious loss,
permission, and recovery messages need clarity more than personality. Remove text
that merely repeats a heading or button.

## Onboarding and information architecture

Orient people around their task, not internal implementation names. Explain what
this page is, what they can do next, and what completing the action achieves.
Expose advanced controls progressively where it reduces burden without hiding
frequent work. Visible option count alone is not a working-memory measurement.

Teach in context and support the first useful action. Optional tours should remain
skippable. Prefer reversible actions or undo when appropriate; consequential,
irreversible actions still need clear confirmation and stated impact.

## Localization and realistic content

Use actual minimum, typical, and maximum content where available. Exercise long
names, unbroken identifiers, multiline labels, missing fields, large numbers, and
local formats. Test representative expanded translations and right-to-left layout
where supported; fixed language expansion percentages are not acceptance criteria.

Use the project's localization system for complete translatable messages, plural
forms, dates, and numbers. Avoid concatenating sentence fragments that assume English
word order. Keep terminology consistent by meaning, not by erasing real distinctions.
