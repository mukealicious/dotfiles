# Critique Lenses

Use these lenses whenever giving UI/design feedback. The goal is to turn taste into diagnosis: name the design concept, cite observable evidence, explain user impact, then prescribe a concrete fix.

## Feedback shape

For each meaningful issue:

```md
- **[Severity] Lens: specific term**: What is wrong, naming the element.
  - Evidence: What you can see in the UI or code.
  - Why it matters: The user-facing consequence.
  - Fix: A concrete change, preferably using existing tokens/components.
```

Do not stop at "feels off", "clean it up", or "make it pop". Translate the reaction into one or more lenses below.

## Lenses

### Typography

Check hierarchy, measure, leading, tracking, weight, x-height/cap-height mismatch, tabular numbers, truncation, widows/orphans, and font loading shift.

Common diagnoses: flat type scale, weak hierarchy, long line length, cramped leading, over-tracked body text, missing tabular nums in data, placeholder-as-label, careless truncation.

### Color and tokens

Check semantic tokens, contrast, tinted neutrals, chroma/saturation, alpha vs solid borders, dark-mode recalibration, and color meaning consistency.

Common diagnoses: raw hex drift, inaccessible contrast, color-only state, dead grey tint from opacity, brand color over-saturation, status color used decoratively.

### Layout and composition

Check negative space, rhythm, max-width, alignment, optical centering, asymmetry, overflow, aspect ratio, breakpoints, z-index, sticky positioning, and layout shift.

Common diagnoses: even-padding monotony, container reflex, card overuse, misaligned baselines, unreadable full-width text, breakpoint chosen by device instead of content, hidden overflow breaking sticky children.

### Iconography

Check stroke weight, filled vs outlined state language, icon family consistency, optical centre, pixel hinting, metaphor accuracy, and icon-label breathing room.

Common diagnoses: mixed icon libraries, thin icons next to heavy text, ambiguous repeated icon, unbalanced play/chevron glyph, icon-only control without accessible name.

### Interaction states

Check affordance, hover, focus, active, disabled, loading, optimistic rollback, touch target, pointer events, cursor, and copy-to-clipboard confirmation.

Common diagnoses: weak affordance, missing keyboard focus, disabled-by-opacity only, no pressed feedback, loading action with no system status, 32px touch target on mobile.

### Motion

Check duration, easing, choreography, enter/exit asymmetry, reduced motion, and whether animation uses transform/opacity instead of layout properties.

Common diagnoses: motion as decoration, ease-in entrance, 400ms hover lag, animating width/top/height, no reduced-motion path, list items flashing all at once instead of staggered.

### Accessibility

Check semantic HTML, DOM order, tab order, label association, ARIA naming, focus trap, skip links, contrast, and non-color signals.

Common diagnoses: div-button, visual order fighting screen-reader order, modal focus escape, unlabeled icon button, error shown only with red border.

### Information architecture

Check navigation labels, mental model, hierarchy, progressive disclosure, wayfinding, depth, signposts, empty/error states, and whether search is compensating for failed browse paths.

Common diagnoses: internal terminology in nav, too many visible choices, missing page orientation, empty state with no next action, confirmation dialog that hides what will be lost.

### Copy and microcopy

Check CTA specificity, front-loading, sentence case, voice/tone, inline errors, destructive language, contextual help, numeric formatting, and scannability.

Common diagnoses: "Submit" instead of the real action, vague error copy, placeholder replacing label, press-release success toast, softened destructive action, inconsistent number formats.

### Components and systems

Check component semantics, state coverage, design-system fit, token use, shared vs one-off implementation, and component distinction.

Common diagnoses: badge used as tag, tooltip carrying interactive content, modal used as first thought, spinner where skeleton would preserve layout, data table without right-aligned tabular numbers.

### Measurement and evidence

When analytics or research exists, connect design claims to funnels, conversion, retention, churn, scroll depth, heatmaps, session recordings, or support/search queries.

Common diagnoses: optimizing for the wrong metric, CTA below observed scroll depth, high search volume for browseable content, A/B result without a meaningful success metric.
