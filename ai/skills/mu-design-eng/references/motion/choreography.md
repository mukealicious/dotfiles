# Choreography: relationships between animations

Read [standards.md](standards.md) for individual motion decisions. This reference owns order, overlap, timing families, and stillness when multiple parts respond to one event. Use [choreography-recipes.md](choreography-recipes.md) for implementation patterns.

## Cast before timing

| Role | Job | Treatment |
| --- | --- | --- |
| Lead | The item or change the user must notice | First or most prominent movement |
| Support | Content that supports the lead | Smaller/shorter movement, often overlapping |
| Decoration | Badge, pill, divider, background accent | Static or fade only |
| Static | The remaining structure | No animation |

If several elements compete to lead, resolve hierarchy first. Motion cannot repair unclear content priority.

Use one entrance per container: when a panel slides into place, its contents are already there. A panel entrance followed by eight staggered rows creates two waits. When children need a meaningful entrance, keep the container still. An explicit explanatory sequence can justify an exception, but record its purpose.

## Choose relationships

1. Same object or same moment → **Together**, with one timing family.
2. Different objects, but order carries no meaning → **Together**. Order without meaning is delay.
3. Order conveys reading order or cause/effect, and both can be visible → **Overlap**.
4. Overlap would create a collision or two competing dense views → **Sequence**, with a small overlap at handoff if safe.
5. A child's path is controlled by shared layout or another primitive → **Carry** it by animating its parent.

### Together

- On item removal, release its layout space while it exits so siblings close the gap concurrently. Motion's `AnimatePresence mode="popLayout"` is one option. Without it, snapshot coordinates, position the exit absolutely in a positioned parent, then reflow or FLIP siblings. Preserve scroll anchoring and focus when the removed row held focus.
- For a simple view swap, overlap old exit and new entry. `popLayout` can avoid both views adding to container height. Dense two-dimensional morphs may need `wait` instead; no presence mode is universally correct.
- A component's sub-animations should share a timing family. A drawer opening slowly and resizing abruptly can feel disconnected. Use a shared config/token; a lighter content fade can still belong to the same family.

### Overlap

- Occasional product groups can start at 30–80ms intervals, aiming for a total response around or below 300ms. Total response includes the final item's duration, not merely its delay.
- For long lists, animate only a few items or clamp later delays. Item 20 must not wait 20 steps. High-frequency menus, command palettes, or repeated navigation normally appear together.
- Marketing/first-run sequences have more room: 100–150ms steps over 0.5–0.6s entrances can read as one wave.
- Order follows importance and reading direction, not blindly DOM index. Title and first paragraph can share beat 0.
- Vary distance and duration by role. Lead travels more; support travels less; decoration stays still or fades. Compressed later delays can reduce a metronomic feel. Uniform steps are acceptable when rhythm itself carries meaning; do not add randomness for its own sake.
- Keep all visible controls usable. An invisible delayed element must not become an unexpected focus target or intercept input. Prefer immediate availability for action controls.

### Sequence

Use a sequence only when order communicates meaning or overlap is visually harmful:

- A dense container changes width and height: old content exits before the next enters. If overlap is required, use a decorative duplicate technique from the recipes and protect semantics.
- An object flies into a bin: delay the front face until the object nearly lands, instead of letting it pass visibly through the front.
- A checkbox illustration draws its box, then its checkmark. Persist each path's end state; start the checkmark slightly before box completion if that reads as one gesture.

A sequence is not permission to delay the actual state change or block ordinary activation.

### Carry

Move the parent of a shared-layout destination to influence its children's apparent path. For example, images can morph into a bin while the bin drops. This can be more coherent than independent image offsets. Verify stacking and clipping at the arrival moment.

## Synchronize with a meaningful moment

Attach each supporting effect to the lead's **start**, **impact**, or **settle**. A background press pulse belongs to the click, not the preceding hover. Motion lines or sparkles should land with the icon's decisive movement. An illustrative burst can use timeline offsets `[0.7, 0.9]`, with secondary accents about 40ms behind; tune on a recording rather than treating these as universal constants.

Repeat actions skip buildup once the state is established. Move the coordinated group earlier while preserving internal proportions. Use bounded, validated keyframe offsets for the actual library API.

## Adapt to size and direction

A fade that works for a large resize may look like a flicker for a 2px change. A starting duration function is `clamp(0.15s, abs(Δheight) / 500, 0.27s)` where height is in pixels and the result is seconds. For a finite set of states, explicit per-transition values are often easier to tune than a generalized formula.

A small object may tolerate more bounce than a large view. Tune per state; do not copy one spring into every dimension and call it consistent.

Forward/back navigation should match the product's spatial model, including RTL behavior. A common LTR model moves old content left for forward and right for back. Pass current direction to exiting children, not only new children. In Motion, both `AnimatePresence` and the child can need `custom`.

Closing exits are usually simultaneous, shorter, and simpler. Avoid reverse-staggering a dismissed panel. Close toward the entry edge unless the action's meaning establishes another path.

## Interruption and idle motion

Every new run must cancel or retarget old work before creating new animations. Await all reset animations before restarting an idle loop. Guard asynchronous continuations with a generation token so a canceled run cannot mark a later run ready or restart its idle state.

Use refs for coordination flags that do not render. Use state when the UI must actually reflect readiness or disability. Decorative readiness must never gate a real action. Test rapid Next/Back, hover leave halfway through, menu switching, and repeated dismissal. Stable unique keys prevent unintended retained views; still inspect the DOM after rapid switches.

An optional attention loop can wait roughly 2.5s before the first run and about 6s between repeats. It stops during interaction, when offscreen, or when the page is hidden. It resumes only after reset, if still appropriate. Persistent nonessential motion needs accessible stop/pause behavior and a reduced-motion path; rarity does not remove that obligation.

## Reduced choreography

Collapse the sequence, not just each duration. Remove decorative delays and spatial movement. Let the group appear together, instantly or with a justified small fade. For an explanation whose order matters, show discrete frames or provide a static equivalent. Verify no hidden starting frame remains and no callback waits for an animation that no longer runs.

## Timeline and completion

Record a timeline before implementation:

| Element | Role | Starts | Duration | Motion | Relationship |
| --- | --- | --- | --- | --- | --- |
| Title | Lead | 0ms | 600ms | fade + 12px rise | First marketing beat |
| Subtitle | Support | 80ms | 500ms | fade + 8px rise | Overlap title |
| CTA group | Support | 140ms | 500ms | fade + 6px rise | Overlap subtitle |
| Pill | Decoration | 0ms | 400ms | fade only | Together |
| Background | Static | — | — | none | — |

This example is a rare marketing entrance, not product-menu timing. Include static elements and reasons for omitted motion. Completion requires a normal-speed recording that reads as one event, a frame-by-frame check of the handoff, interruption tests, correct focus/action availability, and a fully usable reduced-motion state. Identify the exact unverified moment if browser evidence is unavailable.
