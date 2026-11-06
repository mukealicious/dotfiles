# Diagnose animation performance

Use when motion stutters, drops frames, degrades under load, or needs a driver/property decision. This is a diagnostic workflow by default. Apply fixes only when the user authorizes implementation. For purpose/easing judgment, use [motion-review.md](motion-review.md).

Read [performance causes and evidence](../references/motion/performance.md). It owns frame budgets, pipeline tradeoffs, driver/version caveats, React loops, inherited variables, blur, and layer hints. Read [standards](../references/motion/standards.md) before a proposed optimization changes visual or interaction behavior.

## 1. Reproduce and inventory

Record the route, interaction, content size, browser/device, refresh rate where known, and concurrent work. Ask for missing evidence only when it cannot be retrieved. Inspect the implementation and installed versions.

| Element / location | Driver | Actual properties | Plays during | Symptom |
| --- | --- | --- | --- | --- |
| <component and `file:line`> | <CSS/WAAPI/library/rAF> | <expand `all` and shorthands> | <navigation/drag/idle> | <observed or reported> |

**Complete when:** the reproduction and animation surface are specific. If no browser/device is available, label this a code-risk audit rather than a measured diagnosis.

## 2. Name the cause before changing code

Follow the reference's diagnosis order: properties and rendering cost; concurrent main-thread work; React per-frame renders; content-size invalidation; installed library/custom-property path; expensive effects/layers; only then promotion hints.

Capture a trace where possible. Identify the work that coincides with missed frames. Change one hypothesis at a time in an authorized experiment. A syntactically compositor-friendly transform is not proof of a compositor-only frame.

**Complete when:** each proposed fix names a cause and supporting code/trace evidence, or is explicitly a hypothesis requiring a specified measurement. “Added will-change, seems smoother” is not a diagnosis.

## 3. Choose a correctness-preserving remedy

Prefer lower-cost properties only when they preserve layout, text, hit testing, focus, semantics, and content. A translated sidebar does not push siblings; a scaled accordion is not a reflowing accordion. Check that opacity-only hiding does not leave invisible controls active.

Consider CSS/WAAPI for eligible predetermined motion that coincides with busy-page work; keep gesture/spring capabilities when they are required. Use the installed library's supported API rather than automatically upgrading it. Read [mobile](../references/mobile.md) when scroll/touch/viewport behavior may explain the apparent jank.

**Complete when:** the remedy has explicit preserved behavior and a controlled before/after comparison. In diagnostic mode, report and stop here. Implementation mode can apply the smallest approved fix.

## 4. Verify under the same workload

Use [verification](../references/verification.md). Compare traces with the same content, route transition, viewport, browser, and device. Inspect layout/paint/style work and dropped frames, plus visible interaction correctness. Test realistic larger content and a representative supported phone when possible.

Desktop CPU throttling does not model GPU, memory, thermal conditions, or physical touch. Access devices only through an authorized setup; do not expose a server automatically. Use normal-speed playback for perceived response and slowed playback only for timing analysis.

**Complete when:** the claimed cause has evidence, the fix reduces its measured cost without breaking behavior, and limitations are stated. If device evidence is unavailable, report the remaining check rather than claiming universal smoothness.

## Output

For each finding, ordered by user impact and rendering cost:

- **Element / location:** `file:line`.
- **Cause:** measured cause or explicit hypothesis.
- **Before → after:** exact property/driver change and preserved behavior.
- **Evidence:** trace conditions/results or static-code evidence.
- **Status:** proposed, implemented if authorized, verified, or needs device check.

Conclude with commands/tests actually run and the next evidence needed. Keep diagnosis separate from permission to implement.
