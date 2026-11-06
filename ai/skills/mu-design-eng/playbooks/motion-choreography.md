# Choreograph multiple moving parts

Use for group entrances, hero sequences, view swaps, multi-step flows, removal/reflow, rich-state morphs, or interactions combining several effects. The task determines mode: critique/plan stays read-only; implementation changes only the authorized surface.

Read [standards](../references/motion/standards.md) for the individual motion gate and [choreography relationships](../references/motion/choreography.md) for the shared coordination rules. Use [choreography recipes](../references/motion/choreography-recipes.md) only after casting and relating the elements.

## 1. Inventory and cast

Inspect every element that moves in response to the event, with `file:line`, state trigger, and current timing. Assign Lead, Support, Decoration, or Static. Identify what the user must notice and which controls must remain immediately usable.

**Complete when:** every moving part has a role, hierarchy has one clear lead, and unnecessary movement is explicitly removed from the proposal. A panel carrying its content is often one move, not a panel plus eight child entrances.

## 2. Relate the parts

Choose Together, Overlap, Sequence, or Carry for each relevant pair. Record the reason: same object, reading order, cause/effect, collision avoidance, or parent-driven path. Default to parallel movement; sequence only when order carries meaning.

Account for layout space on removal, dense views that cannot crossfade safely, current exit direction, and decoration that should stay still. Use shared timing families rather than unrelated curves for one component.

**Complete when:** each relationship has a purpose and no delay exists solely because its DOM index made it easy to add.

## 3. Write the timeline before code

Use the timeline table in the relationships reference. Record starts, durations, movement, role, and relationship. Calculate the full completion time, including the last item's duration. Attach accents to start/impact/settle instead of unrelated timers. Choose explicit per-state timings for a small state set, or a bounded distance-based formula where variation requires it.

Specify reverse/close behavior, rapid repeat, cancellation, reduced choreography, and focus/action availability. Exits should not make users wait through a reversed decorative stagger.

**Complete when:** the timeline meets the purpose/frequency budget, reduced motion has a coherent alternative, and the interruption state machine is known.

## 4. Implement only in implementation mode

Use CSS for a simple one-shot group, existing declarative library variants for state-driven groups, or imperative orchestration only where multiple events genuinely require awaiting completion. The recipes cover stable keys, presence modes, measured resizing, directional exits, visual duplicates, carry, and guarded cancellation.

Keep decorative copies inert and out of the accessibility tree. Stop old controls before creating new ones; prevent stale asynchronous completions from restarting idle work. Preserve actual actions independently of decorative readiness.

**Complete when:** the authorized timeline is implemented with cleanup and accessible state handling. In review/plan mode, finish with a precise proposed change instead; do not edit source.

## 5. Verify the relationship, not just each animation

Use [verification](../references/verification.md). Observe the actual page at normal speed, record it, then scrub the critical overlap/impact/handoff. Test hover-out halfway, Next twice quickly, Back during entry, switching menus while opening, repeated removals, and unmount during an awaited sequence. Inspect for duplicate mounted views and stale idle loops.

Test reduced motion, keyboard focus, visible control activation, realistic content sizes, and phone gestures where relevant. Imagine the 50th use: if the sequence adds a repeated wait, reduce it. A slowed recording diagnoses timing, but normal playback must still make the purpose perceptible.

**Complete when:** the group reads as one intended event, interruption leaves the correct state, and no decorative phase blocks interaction. Record any unresolved visual/device check instead of inferring it from code.

## Output

1. Timeline: one row per moving part, including relevant static context.
2. What does not move and why: usually 2–5 deliberate decisions, not a quota.
3. Changes or read-only findings with paths.
4. Feel check: the precise moment inspected and what remains unverified.

Use relationships and observable moments, not unsupported adjectives such as “buttery” or “native.”
