# Rendered verification

Use this reference when a playbook inspects or changes visible behavior. Static
inspection supports a hypothesis; the actual page establishes what users see.

## Establish the observation

Record the route or file, viewport, relevant input method, initial state, and steps.
Use realistic surrounding content and the project's existing development workflow.
Keep test data separate from live mutations. Network exposure requires the normal
project authorization; a phone test does not imply permission to bind to all interfaces.

For a reported defect, reproduce it before changing the code where the permitted
environment allows. Record why a reproduction is unavailable rather than infer success.

## Exercise the touched behavior

- Inspect the actual integrated page, not only an isolated component preview.
- Check narrow and wide layouts, zoom, keyboard order, visible focus, and applicable
  touch interactions. Test long content and affected loading, empty, error, and recovery states.
- For motion, observe normal-speed timing and visibility first. Then use slow motion
  or frame-by-frame inspection for sequencing, origins, clipping, and final-state errors.
- Trigger motion repeatedly and interrupt it mid-transition. Check rapid reversal,
  dismissal, cancellation, stale state, and content that changes during the animation.
- Enable reduced motion and verify a usable, legible final state. Where feasible,
  test gestures on a physical device; label emulation and real-device evidence separately.
- Check console errors and run relevant project tests. For performance claims,
  record the measured scenario and trace rather than infer compositing from CSS alone.

## Evidence and completion

Capture screenshots for layout and visual states. Use recordings, timing observations,
or traces for temporal claims; a screenshot alone cannot prove interruption or smoothness.
Report observed behavior separately from code-based inference and checks not performed.

A changed UI is ready for acceptance when the touched scenarios behave correctly in
its actual page, relevant checks pass, and material regressions are resolved. If browser
validation is unavailable, report implementation as unverified and acceptance blocked.
A read-only review can finish with explicitly limited findings; it cannot certify unseen behavior.
