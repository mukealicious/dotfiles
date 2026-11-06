# Motion standards

Use this reference for motion decisions, implementation, and review. These are starting points from Emil's motion practice, not universal product requirements. Existing project tokens, accessibility needs, documented decisions, and observed browser behavior take precedence. Record the reason when a different value works better.

## The gate: frequency, purpose, speed, function

Answer these in order before adding motion. For existing motion, use the same gate to decide keep, reduce, or remove.

| Frequency | Default decision |
| --- | --- |
| 100+ times/day: core navigation, command palette, repeated shortcuts | Instant state changes; remove decorative delay |
| Tens/day: row hover, repeated toggles, list navigation | No motion or subtle, brief feedback |
| Occasional: dialog, drawer, toast, settings | Purposeful standard motion |
| Rare/first-time: onboarding, completion, celebration | More room for explanation or delight |

Frequency is a hypothesis until usage evidence supports it. Keyboard input does not itself disqualify motion: preserve orientation and feedback for keyboard users, without delaying focus or action. A rarely opened keyboard-triggered dialog is not a command palette used hundreds of times daily.

Name the purpose: **feedback**, **spatial consistency**, **state indication**, **preventing a jarring change**, **explanation**, or **delight**. Explanation usually belongs in onboarding or marketing; delight earns its budget at rare moments. If there is no purpose, keep the state change immediate.

Ask whether it can fit the timing budget below. Then ask whether it helps the task. Data being read, compared, or acted on must not move merely for style. A functional chart may need a transition to explain a real value change, but not an entrance that redraws from zero on every refresh. Decorative pointer tracking belongs on an appropriate promotional surface, not a banking graph.

## Tools and properties

Choose the lightest existing tool that meets the lifecycle and interruption requirements:

| Need | Starting choice |
| --- | --- |
| Hover, press, color, class/attribute state | CSS transition |
| Entry without JS mount state | CSS `@starting-style`, with support checked |
| Predetermined one-shot sequence | CSS keyframes |
| Programmatic playback/cancellation without a library | Web Animations API (`element.animate()`) |
| Springs, layout transitions, exit presence, gestures | Existing motion library, if needed |

Use an existing accessible primitive for a dialog, menu, tooltip, drawer, or toast. Motion does not supply focus management, semantics, keyboard behavior, or announcements. Do not install dependencies automatically.

Prefer `transform` and `opacity` where they preserve the intended layout. They can avoid per-frame layout/paint; acceleration is not guaranteed. A transform does not change document flow and scales text and descendants. Height animation can be appropriate for an accordion. Read [performance.md](performance.md) when choosing drivers or investigating frame cost, including clipping, filters, and library-version behavior.

Name transition properties explicitly rather than `transition: all`. Animate the element's own transform rather than updating an inherited parent variable each frame. Static per-item delay variables are different from per-frame inherited values.

## Easing

| Situation | Starting choice |
| --- | --- |
| Entrance or exit responding to an action | Ease-out |
| Movement/morph between visible positions | Ease-in-out |
| Hover or color change | `ease` |
| Constant-speed progress or rotation | `linear` |
| Unclear | Ease-out, then verify |

An ease-in entrance often feels delayed because its initial movement is slow. Treat this as a review signal, not a ban on every ease-in phase. A physically motivated exit or part of a longer sequence may justify it. Built-in easing and pure fades can be correct; review the result, not the spelling.

Reuse the project's token system. If it has no suitable curve, these exact examples provide a coherent starting set:

```css
:root {
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
}
```

Do not create parallel tokens for nearly identical curves. Record a deliberate exception with its component rather than copying arbitrary curves across files.

## Duration and springs

| Element | Starting range |
| --- | --- |
| Press feedback | 100–160ms |
| Tooltip or small popover | 125–200ms |
| Dropdown or select | 150–250ms |
| Modal or drawer | 200–500ms |
| Marketing or explanation | Longer if the message needs it |

Aim below 300ms for routine UI; this is a responsiveness heuristic, not a contradiction of the drawer range. A 500ms drawer or 400ms toast is an explicit component-specific choice, not a default for everything. Judge total wait, including delay and stagger, not just one element's duration. Interactions must remain available without waiting for decorative motion.

After an initial tooltip discovery delay, neighboring tooltips can skip both delay and animation within the same toolbar session. Faster spinner rotation is not a general remedy for slow loading; preserve understandable status and avoid flashing feedback for very short operations.

Use a spring for reversible gestures, momentum, or a deliberately lively object. Example configurations use Motion-style units and must match the installed API:

```js
{ type: "spring", duration: 0.5, bounce: 0.2 }
{ type: "spring", mass: 1, stiffness: 100, damping: 10 }
```

Duration-based springs describe a perceived settling interval, not a strict physical deadline. Bounce `0.1–0.3` is a useful exploratory range; crisp product UI often needs zero. Reserve visible bounce for gestures or an appropriate playful moment. For decorative pointer tracking, smooth with a spring instead of mapping every cursor movement directly; still honor reduced motion.

## Origin, paths, and interruption

- A trigger-anchored panel should grow from its trigger. With a primitive that supplies it, use `transform-origin: var(--transform-origin)`. Verify its actual variable name and collision-adjusted origin. Centered modals stay centered.
- For a subtle scale entrance, start around `0.9–0.97` with opacity. `scale(0)` is usually excessive for ordinary UI, but a purpose-built illustration can use it. Opacity-only is valid when scale adds no information or conflicts with accessibility.
- Press scale `0.97` (roughly `0.95–0.98`) includes label and icon. Check text rasterization and adjacent alignment.
- Translate percentages use the element's own reference box: `translateY(100%)` hides a variable-height sheet by its own height. Verify SVG/reference-box exceptions when relevant.
- Closing should normally reverse the spatial entry path. Forward/back navigation can instead follow navigation direction. Match the user's mental model and reading direction.
- Retarget from the current state on rapid input. CSS transitions and continuous springs are useful. Restarting a keyframe entrance from zero can jump; keyframes and WAAPI are not inherently non-interruptible if their lifecycle is managed correctly.
- A deliberate hold may fill over `2s linear`, then reset over `200ms` ease-out. Normal activation must not wait for decorative phases. Preserve cancellation and accessible alternatives to timed gestures.

For multiple moving elements, use [choreography.md](choreography.md). It owns group timing, overlap, sequencing, and stillness.

## Accessibility and input

Reduced motion can mean an instant state change, no animation, or a small opacity/color transition that demonstrably aids comprehension. There is no requirement to retain a fade. Remove parallax, large spatial movement, repeated loops, and decorative delays as appropriate. Preserve content, focus, progress/status, and final state when animation is absent. Avoid flashing and provide pause/stop controls for persistent nonessential motion where required.

```css
@media (prefers-reduced-motion: reduce) {
  .panel {
    transition: none;
    animation: none;
  }
}
@media (hover: hover) and (pointer: fine) {
  .button:hover { transform: scale(1.02); }
}
```

The reduced variant must set the correct visible/closed state; deleting animation alone can leave an initial `opacity: 0` in place. JS-driven motion must read the preference too, including changes during the session. An existing `useReducedMotion()` hook can select static transforms and no delays.

Hover capability queries avoid sticky touch hover; they do not replace `:focus-visible` or press feedback. Test hybrid inputs. Read [mobile.md](../mobile.md) for touch, viewport, keyboard, scroll, and safe-area behavior.

## Choosing a remedy

Start with removal when motion has no purpose. Otherwise reduce the distance, duration, or moving parts; correct easing and origin; make interruption reliable; reduce measured rendering cost; then refine timing and visual cohesion. Accessibility is a requirement throughout, not a final polish tier.

A dashboard generally benefits from crisp, low-bounce motion. A playful consumer surface can sustain more. Opacity/height balance in a changing list and a spring's perceived weight require observation, not a formula. A subtle blur can sometimes join a crossfade; it is optional and needs cost and readability checks.

## Evidence and completion

Use [verification.md](../verification.md) for the shared evidence protocol. Also inspect motion at normal speed and at 2–5× duration or frame-by-frame in the browser's animation inspector. Confirm origin, absence of double exposure, property synchronization, exit path, rapid reversal, and the final state with reduced motion. Restore normal timing after inspection.

Verify in the actual page, including surrounding content and concurrent work, not only an isolated preview. For gestures, use real-device evidence through an already authorized access path. If hardware or browser access is unavailable, identify the exact unverified behavior. A fresh-eye review later can expose subtle feel issues, but does not replace current verification.
