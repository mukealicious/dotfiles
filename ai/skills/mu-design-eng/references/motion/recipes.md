# Motion recipes

Read [standards.md](standards.md) first. These fragments supply motion, not complete accessible components. Adapt state selectors, tokens, units, and exit lifecycles to the existing primitive. Every recipe needs the reduced-motion and input behavior from the standards; examples omit repeated wrappers so the motion remains visible.

## Button press

```css
.button { transition: transform 160ms var(--ease-out); }
.button:active { transform: scale(0.97); }
```

This scales the label and icons with the button. `:active` is real press feedback on touch. Gate hover independently. Keep activation on the normal accessible event; pointer-down can give feedback without prematurely submitting the action.

## Popover, dropdown, menu, select

```css
.popover {
  transform-origin: var(--transform-origin);
  transition: opacity 200ms var(--ease-out), transform 200ms var(--ease-out);
}
.popover[data-starting-style],
.popover[data-ending-style] {
  opacity: 0;
  transform: scale(0.95);
}
```

These selectors and the origin variable illustrate Base UI-style primitive state. Confirm the installed primitive's API. Retain its positioning, dismissal, focus, and presence behavior.

## Tooltip

```css
.tooltip {
  transform-origin: var(--transform-origin);
  transition: transform 125ms var(--ease-out), opacity 125ms var(--ease-out);
}
.tooltip[data-starting-style],
.tooltip[data-ending-style] { opacity: 0; transform: scale(0.97); }
.tooltip[data-instant] { transition-duration: 0ms; }
```

Use an initial discovery delay, then open neighboring tooltips instantly within the provider's skip-delay window. `data-instant` is illustrative; wire both animation and delay to that state. Keyboard focus must expose the same information without becoming a tooltip-only interaction.

## Centered modal

```css
.modal {
  transform-origin: center;
  transition: opacity 250ms var(--ease-out), transform 250ms var(--ease-out);
}
.modal[data-starting-style],
.modal[data-ending-style] { opacity: 0; transform: scale(0.96); }
.backdrop { transition: opacity 250ms var(--ease-out); }
```

Panel and backdrop read as one surface. Focus trapping/restoration, scroll lock, and semantic modality remain the primitive's responsibility. An exiting invisible backdrop must not keep blocking input.

## Drawer / sheet

```css
.drawer { transform: translateY(0); transition: transform 500ms var(--ease-drawer); }
.drawer[data-closed] { transform: translateY(100%); }
```

The 500ms choice is for a deliberate large-surface motion, not a universal UI budget. Tune on the actual screen. For dragging, use the gesture recipe below and [mobile.md](../mobile.md).

## Toast

```css
.toast {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 400ms ease, transform 400ms ease;
  @starting-style {
    opacity: 0;
    transform: translateY(100%);
  }
}
.toast[data-ending-style] { opacity: 0; transform: translateY(100%); }
```

This deliberately slower Sonner-like treatment uses `ease` for its component personality. Keep a toast mounted until its exit finishes, with cancellation and a non-animation cleanup path. Use the existing toast primitive's timing, announcements, and stacking rules.

When `@starting-style` lacks target-browser support, use the primitive's mount lifecycle or a staged `data-mounted` state. A mount `useEffect` alone may be coalesced before the initial style is painted; verify the actual entrance. Opacity and stack-height changes need a visual check together; no universal ratio settles this pair.

## Accordion / collapse

```css
.content {
  overflow: hidden;
  transition: height 200ms var(--ease-out), opacity 200ms var(--ease-out);
}
```

Use a measured height or the existing primitive's supplied size; handle resize, late images, and font loading. Modern intrinsic-size animation features need support checks before replacing measurement. Height changes layout, which can be the correct behavior here. Profile surrounding content and release fixed height when appropriate. Closed content must leave the tab order and accessibility tree through the primitive's semantics.

## Group entrance

For a rare list/grid entrance, consult [choreography.md](choreography.md) and [choreography-recipes.md](choreography-recipes.md). They own stagger budgets and the single-entrance rule. Avoid a separate stagger if the parent already carries its content into place.

## Hold to confirm

```css
.overlay {
  clip-path: inset(0 100% 0 0);
  transition: clip-path 200ms var(--ease-out);
}
.button:active .overlay {
  clip-path: inset(0 0 0 0);
  transition: clip-path 2s linear;
}
.button:active { transform: scale(0.97); }
```

The fill is visual feedback, not authorization to delete data. The action's state machine must handle release, cancellation, leaving the target, lost capture, navigation, and repeated input. Offer a keyboard/assistive-technology route that does not require a precise hold. Reduced motion must preserve understandable progress or a confirmation alternative. Inspect clipping cost in target browsers.

## Tab indicator with synchronized text color

Duplicate only the visual presentation of the tabs. Give the decorative copy active colors, then clip it to the active tab:

```css
.tabs-active-copy {
  clip-path: inset(0 60% 0 20%);
  transition: clip-path 250ms var(--ease-in-out);
}
```

Measure the active tab and update clipping after resize/font changes. Mark the copy `aria-hidden="true"` and `inert`, remove duplicate IDs, and prevent pointer interception. Only one semantic tab list owns focus and events. The percentages are an example, not fixed geometry. Keep reading direction and keyboard navigation correct even with animation disabled.

## Scroll reveal

```css
.reveal { clip-path: inset(0 0 100% 0); transition: clip-path 600ms var(--ease-in-out); }
.reveal[data-visible] { clip-path: inset(0 0 0 0); }
```

For suitable marketing/explanatory content, trigger once with `IntersectionObserver` or the installed library's `useInView({ once: true, margin: "-100px" })` equivalent. Content must remain available if JS fails, reduced motion is enabled, or a user scrolls quickly or follows an anchor. Apply the hidden enhancement only after setup. Repeated reveals on daily-use functional UI usually fail the gate.

## Drag to dismiss

Use distance and velocity, so a short flick can dismiss. This is a starting threshold, not device-independent physics:

```js
const elapsedMs = Math.max(1, performance.now() - dragStartTime);
const velocityPxPerMs = Math.abs(swipeAmount) / elapsedMs;
if (Math.abs(swipeAmount) >= swipeThreshold || velocityPxPerMs > 0.11) dismiss();
element.style.transform = `translateY(${distance}px)`;
```

Check allowed direction before dismissal. Whole-gesture average velocity is simple; recent pointer samples can better represent a flick after a pause. Tune distance, velocity, and cancellation on hardware.

1. Capture the active pointer so dragging continues outside the bounds.
2. Track its ID; ignore additional pointers, rather than switching fingers mid-drag.
3. Handle `pointercancel`, lost capture, and unmount; restore state and release resources.
4. Apply increasing resistance beyond a boundary, not an abrupt wall.
5. Retarget an existing spring from current position and velocity when released or interrupted.
6. Keep explicit dismiss buttons and keyboard behavior available.

A starting spring is `{ type: "spring", duration: 0.5, bounce: 0.2 }`. Scope touch-action to the gesture handle or surface, and preserve document scrolling and zoom.

## Crossfade seam

When ordinary tuning still shows two distinct overlapping states:

```css
.content { transition: filter 200ms ease, opacity 200ms ease; }
.content.transitioning { filter: blur(2px); opacity: 0.7; }
```

Try the simpler opacity-only version first. A 2–5px blur can soften a seam; even blur below 20px is not automatically cheap, especially over large areas or in Safari. Verify legibility, contrast, raster cost, and the final unfiltered state. Do not blur critical content merely to hide a lifecycle defect.

## WAAPI without a library

```js
const animation = element.animate(
  [{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0 0)" }],
  { duration: 1000, fill: "forwards", easing: "cubic-bezier(0.77, 0, 0.175, 1)" },
);
// Retain the handle. Cancel or replace it on interruption and unmount.
```

The 1000ms example is explanatory motion, not routine UI. WAAPI provides playback control without adding a library; it does not guarantee compositor execution for clipping. Set the durable final style and cancel the filled animation when appropriate. Handle rejection of `animation.finished` on cancellation, and avoid stale completion handlers changing newer state.

## 3D and clipping vocabulary

`rotateX`/`rotateY` plus `transform-style: preserve-3d` can express a flip or orbit; add perspective only when depth is useful. Test text quality, back-face visibility, reduced motion, and hit testing.

`clip-path: inset(top right bottom left)` removes area from each side. It can reveal content, show hold progress, synchronize active-tab colors, or create a comparison slider. A mask supports soft transparency where a hard clip does not. Neither technique substitutes for hiding inactive semantic content.
