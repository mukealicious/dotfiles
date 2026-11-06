# Motion performance: causes and evidence

Use for driver/property choices or jank diagnosis. [standards.md](standards.md) owns purpose, timing, and accessibility. Acceleration is a browser optimization, not a correctness guarantee.

## Frame budget and pipeline

At 60Hz, one frame interval is about 16.7ms; at 120Hz, about 8.3ms. The page shares this interval with input, scripting, rendering, and other work. Target the displays/devices the product supports rather than claiming one universal perceptual frame rate. A 100ms layout task can miss many frames.

The browser can perform style calculation, **layout** (geometry), **paint** (raster content), and **composite** (combine layers).

| Typical cost class | Properties | Qualification |
| --- | --- | --- |
| Often compositor-friendly | `transform`, `opacity` | Layer size, clipping, filters, content changes, and browser decisions still matter |
| Can repaint | `box-shadow`, `border-radius`, `color` | Cost depends on affected area and implementation |
| Can cause layout and subsequent rendering | `width`, `height`, `padding`, `margin`, `top`, `left`, `border-width` | Cost depends on containment, positioning, and affected descendants/siblings |
| Browser/content dependent | `filter`, `clip-path`, `background-color` | Measure; do not declare all forms composite-only |

## Cheaper property substitutions, with semantic checks

| Current approach | Candidate | Check before changing |
| --- | --- | --- |
| Grow width/height/padding | `scale()` | Text and children also scale; flow and hit area may differ |
| Move top/left/margin | `translate()` | Adjacent content no longer reflows; this may be wrong for the design |
| Animate shadow geometry | Static shadow on pseudo-element + opacity, or `filter: drop-shadow()` | Drop-shadow follows alpha, not the same box/inset/spread model; profile it |
| Show/hide by display or visibility | Fade opacity plus semantic state and final visibility/unmount | Opacity alone keeps invisible controls focusable and interactive |
| Accordion height | Keep a short measured height transition if flow must change | Check sibling layout cost instead of forcing scale |

A sidebar translated over content is not equivalent to a sidebar that pushes content. Preserve the intended layout. Specify transition properties explicitly; `all` can unexpectedly animate a later layout change.

## Driver and thread

| Driver | Main-thread dependency |
| --- | --- |
| `requestAnimationFrame` callbacks in the document | Must run on the main thread each frame |
| CSS transitions/keyframes | Eligible properties may run on the compositor |
| WAAPI (`element.animate`) | JS can hand eligible interpolation to the browser |
| Library animation | Depends on version, property, element, and execution path |

JS is not synonymous with per-frame main-thread animation: it can start a WAAPI animation. Conversely, CSS is not automatically off-thread. Even compositor animation can suffer from expensive raster work or memory pressure. Workers do not make ordinary DOM updates off-thread.

Look closely at motion concurrent with navigation, hydration, rendering, or data processing. A shared-layout tab indicator can stutter precisely when route loading makes the main thread busy. An equivalent CSS/WAAPI transform may avoid that dependency, if it preserves geometry and behavior.

### Motion version check

The reviewed upstream reports accelerated independent HTML transforms (`x`, `y`, `scale`, `rotate`) from Motion 14.2. Verify the installed version, official implementation/docs when needed, and the actual browser path before asserting acceleration or recommending an upgrade.

```tsx
<motion.div animate={{ x: 100 }} />
<motion.div animate={{ transform: "translateX(100px)" }} />
```

On an older or unsupported path, a full transform string can be worth testing under load. Do not blindly replace composed transforms or upgrade dependencies. Layout (`layout`, `layoutId`), `onUpdate`, `transformTemplate`, inertia, and continuously driven values can introduce main-thread work. Inspect the installed implementation and trace rather than treating a version number as a performance result.

Percent transforms are useful for unknown-size sheets/toasts. Historical browser acceleration limits do not justify hardcoding the wrong geometry. Correctness remains primary.

## React frame loops

Look for state updates in `requestAnimationFrame`, pointer/drag, or scroll handlers. A React render per frame can consume the budget.

```js
// Avoid when this state exists only to move one element each frame:
setY(nextY);
// Existing motion values or a scoped direct write can avoid that render:
ref.current.style.transform = `translateY(${nextY}px)`;
// y.set(nextY), with the installed library, is another option.
```

Keep semantic state in React where it belongs; separate it from visual interpolation. Batch reads before writes to avoid layout thrashing. Clean up listeners and frame callbacks. Do not remove state updates that drive required announcements or actual application state.

## Inherited variables and content size

A parent variable updated each frame can invalidate descendant styles:

```js
// Potential broad invalidation:
element.style.setProperty("--swipe-amount", `${distance}px`);
// Narrower direct write when equivalent:
element.style.transform = `translateY(${distance}px)`;
```

Vaul's upstream example degraded when drawer content grew beyond roughly 20 items. That is a diagnostic clue, not a fixed browser threshold. Compare small and large content and inspect style recalculation. Static per-item stagger variables are not the same problem. A registered non-inheriting property can change the tradeoff; measure the actual tree.

## Blur and layers

Start with 2–5px for an optional crossfade blur. The upstream's under-20px guidance is a caution, not a safe limit. Large areas, device pixel ratio, Safari behavior, and overlapping effects can make much smaller blur expensive. Prefer fewer/smaller filtered surfaces and avoid blurring essential reading content.

`will-change` is a hint, not a command or cure. It can help a measured layer-promotion hitch or 1px start/end shift:

```css
.drawer.is-about-to-move { will-change: transform; }
```

Verify the hypothesis first. Apply only to the moving element, shortly before motion if practical; remove it afterward. Broad or permanent promotion consumes memory and can change stacking/containing-block behavior. Inspect layer area and raster costs. Do not put it on `*` or a large ancestor to conceal a busy main thread.

## Diagnosis order

1. Expand actual animated properties, including utility classes, `all`, and library shorthands. Look for layout cost, then paint cost.
2. Correlate jank with route changes, hydration, rendering, and long tasks.
3. Check React renders/state writes per frame.
4. Increase realistic content size: inspect inherited variables, descendant work, and too many simultaneous animations.
5. Verify version-dependent library paths and animated custom properties.
6. Inspect blur, shadow, clipping, layer size, and memory costs.
7. Only then test a targeted `will-change` hypothesis.

## Record and compare

Capture a Performance trace for dropped frames, long tasks, layout, paint, and style recalculation. Use the Animations panel to inspect timing separately; slowing playback does not prove frame performance. Compare before/after with the same interaction, content, viewport, browser, device, and concurrent workload.

Test on representative hardware, preferably a mid-range or older supported phone. Desktop CPU throttling approximates CPU limits, not GPU strength, thermal state, memory, or touch feel. Use an existing authorized device access path; this reference grants no permission to expose a server.

Report each item with `file:line`, symptom, causal hypothesis, supporting trace/code evidence, proposed change, and verification status. Distinguish a code risk from measured dropped frames. A smooth isolated demo or fast laptop is insufficient evidence of a production fix.
