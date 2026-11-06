# Component behavior: invisible details

Read when building, exploring, or reviewing buttons, anchored panels, tooltips, toasts, or dismissible surfaces—even when the task does not explicitly request animation. Use the project's existing accessible components and tokens. This reference supplies behavior checks; [standards.md](standards.md) and [recipes.md](recipes.md) own motion values and implementations.

## Pressable controls

Give immediate visible press feedback through `:active` or an equivalent pressed state. A small scale, color change, or static state can work. Activation remains on the normal semantic event; pointer-down feedback must not submit a destructive action before release. Preserve focus-visible and keyboard parity. Controls should work even when motion is absent.

## Anchored panels and dialogs

A popover, menu, or tooltip that scales should use its trigger-aware origin, including collision-adjusted placement. Inspect the primitive's supplied variable instead of assuming every library uses `--transform-origin`. Centered dialogs remain centered. Preserve focus transfer/restoration, Escape, dismissal, scroll lock, and portal layering. An animation is not a substitute for these behaviors.

## Tooltips

Delay the first hover tooltip to avoid accidental activation. While the user moves through neighboring controls in the same provider/session, skip both the delay and entrance animation. Reset that instant behavior after leaving the group according to the primitive's configured window. Keep focus-triggered access and accessible descriptions available; essential information cannot require hover. Verify first hover, neighboring hover, group leave/reentry, keyboard focus, and touch behavior separately.

## Rapidly changing UI

Retarget from current visual state when toasts arrive, a toggle reverses, or a panel closes during entry. CSS transitions or a continuous spring are useful; a freshly restarted keyframe can jump. Test rapid additions and dismissals, not only one clean entrance. Cancellation must invalidate old completion callbacks and release timers/listeners. Final semantic state must not depend exclusively on an animation-end event.

## Toast timers and hidden tabs

Pause auto-dismiss time while the document is hidden, so a user does not lose a notification they never saw. Preserve the **remaining visible time**, rather than restarting a full duration on every visibility change or expiring immediately on return.

- Prefer the existing toast primitive's supported behavior before adding a second timer.
- Model all pause reasons together: document hidden, pointer hover, keyboard focus, dragging, or another documented interaction state. Resume only when no pause reason remains.
- On pause, cancel the timeout and subtract elapsed visible time. On resume, schedule the remaining time. Use a monotonic clock where practical.
- Update/reset behavior when the same toast changes from loading to success/error must be explicit. Loading/persistent messages and `Infinity` durations do not use an ordinary auto-close timer.
- Remove visibility listeners and timeouts on dismissal/unmount. Prevent stale timers from removing an updated toast.
- Keep critical errors and required actions available outside ephemeral notifications. Use appropriate live-region behavior without repeatedly announcing decorative updates.

Verification: create a timed toast, hide the tab partway through, wait longer than its full duration, and return. It must still provide its remaining visible time. Repeat while focus or hover is already pausing it; resuming visibility alone must not override another pause reason. Verify loading-to-result updates and rapid dismissal/recreation with stable IDs.

## Continuous hover regions in stacked toasts

A pointer moving between expanded toasts must not cross a dead gap that collapses the stack or resumes timers. Make the interaction region continuous across the intended stack, including the gaps.

One implementation uses a pseudo-element to bridge each gap:

```css
.toast {
  position: relative;
}
.toast::before {
  content: "";
  position: absolute;
  inset-inline: 0;
  top: calc(-1 * var(--toast-gap));
  height: var(--toast-gap);
}
```

This illustrates a gap above a toast; reverse the bridge for the actual stacking direction. Use the real gap token and confirm the pseudo-element is not clipped. A stack-level hit region can be simpler. Avoid blocking unrelated page controls or creating a large invisible overlay. The bridge itself has no interactive semantics.

Keep the stack expanded while focus is within it, not only while hovered. Touch must have direct visible access to actions and dismissal. Test slow and diagonal pointer travel across gaps, a toast disappearing mid-hover, variable-height descriptions, focus moving between toast actions, and stack expansion near the viewport edge.

## Gesture dismissal

Capture the active pointer, ignore extra pointers, handle cancellation and lost capture, and provide increasing boundary resistance. Dismiss by a tuned distance/velocity rule, preserving direction. Use [recipes.md](recipes.md) for the concrete gesture pattern and [mobile.md](../mobile.md) for scroll/zoom ownership. Always retain a non-gesture close path.

## Existing Sonner projects

Use the installed version's API. The reviewed upstream separates a root-mounted `Toaster` from client-side `toast()` calls, stable-ID updates, explicit multiple-toaster targeting, and separate auto-close versus user-dismiss callbacks. Inspect these first for duplicated, missing, or stale notifications.

For loading/result flows, reuse the toast ID or the existing promise helper. For duplicates, check multiple root/page mounts and effect replay before adding suppression logic. For clipping, inspect portal and stacking contexts before increasing z-index. For theme/style issues, inspect resolved theme, style injection, cascade, and headless customization before adding blanket `!important` rules.

This candidate does not copy the full Sonner API tables or prescribe a library migration. Verify exact imports, props, defaults, stylesheet delivery, and callback semantics against the installed version. No dependency installation is implied.

## Completion

A component passes when normal, repeated, interrupted, reduced-motion, keyboard, pointer, and relevant touch flows preserve content and actions. Use [verification.md](../verification.md) to record observed results and unresolved device checks. Good defaults and low setup burden matter, but do not justify concealing uncertainty or removing accessibility behavior.
