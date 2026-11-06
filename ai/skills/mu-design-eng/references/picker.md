# Local variant picker

Use when an exploration needs a switcher. Adapted from Emil's prototype picker.
This is an implementation contract, not a shipped runtime or a mandatory visual theme.

## Presentation

Render one variant at full size in realistic context. Keep picker chrome visually
separate from the work under comparison. Labeled buttons show the available
directions and exactly one current selection. Use a `nav` with an accessible label,
ordinary buttons, and an announced selected state such as `aria-current="true"`.

Place the picker where it does not obscure the interaction. A floating bottom
control can suit a page, but move it above a bottom sheet or toast stack. Respect
safe areas, narrow widths, visible focus, and comfortable touch targets. Text must
remain legible in both the picker and the surrounding surface.

Variant swaps stay instant so repeated comparison is not delayed. A small selection
indicator can animate if useful, but must respect reduced motion. Provide Replay
only when an animation or state sequence needs it. Keep reset/replay semantics explicit.

## Selection and mounting

- Clicking a labeled button selects that variant. Keep keyboard focus on a stable
  control while the stage re-mounts. If a stage control disappears, move focus to a
  sensible surviving target rather than leave it lost in the document.
- Store selection in `?v=1` through `?v=N` where URL state is available. Treat missing,
  empty, malformed, fractional, negative, zero, and out-of-range values as variant 1.
  Validate the whole value, not a numeric prefix such as `2junk`.
- Always mount the initial fallback. A rejected index must not leave an empty stage.
- Update the selected state, URL, and stage consistently. Keep unrelated URL
  parameters. When URL updates are unavailable, local selection still works.
- Switching re-mounts the variant so entrance behavior restarts. Replay re-mounts the
  current selection. Cancel obsolete pending mounts on rapid input; stale callbacks
  must not render an earlier selection after a later one.
- Clean up listeners, timers, and animation handles when a variant unmounts.

Prefer framework rendering or DOM construction. Assign fixture strings through
`textContent` or the framework's escaping rules. Do not interpolate user/API text
into `innerHTML`. A shadow root is styling isolation, not a trust boundary.

## Keyboard contract

The picker is fully operable with Tab and button activation. Optional number keys
and arrow shortcuts must not steal input from the prototype being tested.

Scope shortcuts to the focused picker by default. Broader document shortcuts need
a demonstrated reason and must ignore input, textarea, select, contenteditable,
IME composition, handled events, repeated-key events where inappropriate, and all
modifier keys, including Shift. Check ancestor editability, not just the event target.

When enabled, `1–N` selects, Left/Right wraps between choices, and `R` replays only
if replay exists. Prevent the browser's default action only after handling the key.
All essential behavior remains available through visible buttons on touch devices.

## Verification cases

Check each variant, initial fallback, URL reload, rapid switching, keyboard focus,
modified keys, editable fields, touch layout, replay, cleanup, and reduced motion.
If history navigation is supported, handle it consistently; otherwise document that
selection replaces the current URL rather than creating navigation history.

A picker must stay local to the prototype. It has no helper connection, agent poll,
filesystem operation, upload endpoint, CSP mutation, or automatic production Apply.
Selection is evidence for the conversation, not an authorization message.
