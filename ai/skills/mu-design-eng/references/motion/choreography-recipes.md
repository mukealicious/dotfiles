# Choreography recipes

Use after [choreography.md](choreography.md). Snippets show relationships, not full components. Use existing dependencies and adapt to their installed APIs. Apply [standards.md](standards.md) for reduced motion, input, and purpose.

## CSS overlap with indexed beats

For a one-shot marketing entrance, assign `--i` per element: title `0`, first paragraph `0`, supporting paragraph `1`, CTA group `2`. With React/TypeScript, type custom properties according to project conventions.

```css
.stagger > * {
  --step: 120ms;
  animation: enter 0.6s ease both;
  animation-delay: calc(var(--step) * var(--i));
}
@keyframes enter {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .stagger > * { animation: none; opacity: 1; transform: none; }
}
```

`both` applies the first frame during delay and retains the final frame afterward. Otherwise delayed content can flash before its entrance. Base content must remain visible if the enhancement does not initialize. One-shot index variables are not the per-frame inherited-variable trap described in [performance.md](performance.md).

## Motion variants with non-uniform delay

```tsx
import { motion, stagger } from "motion/react";

const group = {
  hidden: {},
  show: { transition: { delayChildren: stagger(0.06, { ease: "easeOut" }) } },
};
const lead = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] } },
};
const support = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } },
};
const decoration = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3 } },
};

<motion.section variants={group} initial="hidden" animate="show">
  <motion.span variants={decoration}>New</motion.span>
  <motion.h1 variants={lead}>Title</motion.h1>
  <motion.p variants={support}>Subtitle</motion.p>
</motion.section>
```

This is marketing timing. Role variants control distance/duration; stagger controls starts. `stagger(0.05, { from: "center" })` radiates from the middle; a supported index can represent the interaction's origin. Older versions may use `staggerChildren`. Check the installed API instead of upgrading automatically. For product lists, cap both delays and final completion time; a 300ms last delay plus a 500ms entrance is an 800ms group, not 300ms.

## Remove an item while siblings close the gap

```tsx
<ul style={{ position: "relative" }}>
  <AnimatePresence mode="popLayout" initial={false}>
    {chips.map((chip) => (
      <motion.li key={chip.id} layout
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}>
        {chip.label}
      </motion.li>
    ))}
  </AnimatePresence>
</ul>
```

Custom immediate children may need ref forwarding for the installed presence API. Ensure correct containing blocks and stable keys. Without a library, measure offsets before writing styles, make the departing item absolute at its current position, and reflow or FLIP the siblings. Restore focus to a logical surviving control; visual presence must not preserve a deleted action's usability.

## Resize and crossfade one container

Use the existing measurement primitive or `ResizeObserver`; do not install `react-use-measure` solely for this recipe. Measure the active view's natural height, not the already animated outer height. Keep the departing view out of measured flow.

```js
const MIN = 0.15;
const MAX = 0.27;
const delta = Math.abs(nextHeight - previousHeight);
const fadeDuration = Math.min(Math.max(delta / 500, MIN), MAX);
```

Store previous height during the measurement/update lifecycle, not by mutating a ref inside render or `useMemo`. Handle first measurement explicitly.

```tsx
<motion.div animate={{ height: nextHeight }}
  transition={{ duration: 0.27, ease: [0.25, 1, 0.5, 1] }}
  style={{ overflow: "hidden", position: "relative" }}>
  <AnimatePresence initial={false} mode="popLayout">
    <motion.div key={view}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: fadeDuration, ease: [0.26, 0.08, 0.25, 1] }}>
      {content}
    </motion.div>
  </AnimatePresence>
</motion.div>
```

The strong outer curve and lighter content curve are a deliberately related pair. Check that new content does not clip during font/image loading and that focus outlines remain visible. A height animation is a measured layout exception, not proof of poor performance.

## Direction-aware steps

```tsx
const [[step, direction], setStep] = useState([0, 0]);
const go = (d: 1 | -1) => setStep(([s]) => [s + d, d]);
const variants = {
  initial: (d: number) => ({ x: `${110 * d}%`, opacity: 0 }),
  active: { x: "0%", opacity: 1 },
  exit: (d: number) => ({ x: `${-110 * d}%`, opacity: 0 }),
};

<MotionConfig transition={{ type: "spring", duration: 0.5, bounce: 0 }}>
  <AnimatePresence mode="popLayout" initial={false} custom={direction}>
    <motion.div key={step} custom={direction} variants={variants}
      initial="initial" animate="active" exit="exit">
      {content}
    </motion.div>
  </AnimatePresence>
  <motion.div layout>{/* Back and Continue follow the size change */}</motion.div>
</MotionConfig>
```

Bound `go` to real steps. Supply current direction to both presence and child so the leaving child does not use stale entry direction. Adapt spatial direction for the product and RTL. Similar small views may work better with an 8px shift or pure crossfade than a full 110% slide. Reduced motion can use an immediate swap with correct focus and status.

## Draw cause, then effect

Use `pathLength="100"`, `stroke-dasharray: 100`, and `stroke-dashoffset: 100` on both SVG paths.

```css
.square { animation: draw 0.6s cubic-bezier(0.645, 0.045, 0.355, 1) forwards; }
.checkmark {
  animation: draw 0.4s cubic-bezier(0.645, 0.045, 0.355, 1) forwards;
  animation-delay: 0.6s;
}
@keyframes draw { to { stroke-dashoffset: 0; } }
```

The checkmark delay equals the box duration. Try 0.5s for a slight handoff overlap. This is illustration timing, not a delay before a real checkbox becomes checked. In reduced motion, render final paths immediately.

## Dense two-dimensional morph

Prefer `mode="wait"` when two rich states cannot overlap cleanly. If a crossfade is essential:

1. Render an active semantic view that owns interaction and entering motion.
2. Create a visual exit-only copy, absolutely positioned, normally transparent. Its exit begins at opacity 1 and fades to 0.
3. Make the copy inert, hidden from accessibility, pointer-inactive, and free of duplicate IDs, side effects, live announcements, or data requests.
4. Tune its transform for each state pair: enlarge toward a larger destination, reduce toward a smaller one, and use horizontal scale if narrowing would bleed content beyond edges.
5. Pass transition-specific values through the presence API; tune bounce by object size.

Use a true snapshot or presentation-only subtree where cloning a live component would repeat effects. If complexity outweighs the visual gain, use a simple sequence instead.

## Carry a shared-layout destination

```tsx
<motion.div animate={{ y: 73 }}
  transition={{ delay: 0.13, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}>
  {selected.map((img) => (
    <motion.img key={img.id} layoutId={img.id} src={img.src} alt="" />
  ))}
</motion.div>
```

These illustrative values let images morph into a bin while it drops. Time the front face to appear as images nearly land. Provide semantic alternative text outside the decorative destination where the images carry information. Profile shared layout during concurrent page work.

## Imperative orchestration with cancellation

Use imperative orchestration only when multiple events coordinate several elements and completion must be awaited. Prefer declarative variants for a simple group entrance.

```tsx
const [scope, animate] = useAnimate();
const running = useRef<ReturnType<typeof animate>[]>([]);
const generation = useRef(0);

function cancelRun() {
  generation.current += 1;
  running.current.forEach((control) => control.stop());
  running.current = [];
  return generation.current;
}

async function play(makeControls: () => ReturnType<typeof animate>[]) {
  const ticket = cancelRun(); // stop old work BEFORE creating new work
  const controls = makeControls();
  running.current = controls;
  try { await Promise.all(controls); }
  catch { return false; } // inspect the installed API's cancellation semantics
  return generation.current === ticket;
}

async function resetThenIdle() {
  const stillCurrent = await play(() => [
    animate("[data-animate='icon']", { y: 0 }, { duration: 0.3 }),
    // Reset every other moving part here.
  ]);
  if (stillCurrent && canRunIdle()) startIdle();
}
```

Scope selectors beneath `scope`. On unmount, preference change, visibility loss, or a new event, cancel the run and invalidate continuations. Depending on the API, stopped controls may not resolve; never rely on an old promise to authorize current behavior. Await all controls when durations differ.

Hover can move an icon to `y: -4` over 0.3s. A click pulse can use `[1, 0.96, 1.02, 1]` over 0.4s. These are decorative examples; activation remains independent of hover readiness. Start line accents relative to the icon's impact, not an unrelated timer. Optional idle motion can use `y: [0, -3, 0]`, an initial 2.5s delay, and 6s repeat delay with the stop/pause conditions in the choreography reference.
