# Visual design

Use for choosing or judging hierarchy, typography, color, composition, or visual
identity. Adapted from Impeccable's brand/product distinction and visual references.
This is design judgment, not a fixed aesthetic or a component library.

## Register and context

**Product:** the interface serves a repeated task. Familiar controls, predictable
navigation, dense information where useful, and consistent state language reduce effort.
**Brand:** the interface communicates identity, credibility, and a story. Its visual
voice can carry more expression, pacing, imagery, and typographic contrast.
A product's marketing page and its settings screen can use different registers.

Before a substantial new direction, name the audience, task or message, physical
use context, and relevant reference surfaces. Read existing brand and component
choices before inventing replacements. For a small repair, preserve the current direction.

## Hierarchy and composition

Name the primary action or takeaway. Compare its emphasis with secondary choices,
labels, controls, and surrounding content. Scale, weight, placement, spacing, and
contrast should cooperate rather than make every element compete.

Use spacing to express relationships: tighter within a group, more separation
between groups. Inspect alignment, optical balance, line breaks, content width,
scrolling, sticky layers, clipping, and overlap at realistic sizes. Cards, borders,
centered layouts, and grids are useful when they express real grouping; they are
not mandatory decorations or prohibited shapes.

For product surfaces, preserve familiar navigation and component behavior. For
brand surfaces, choose a specific compositional voice rather than apply a generic
hero and repeated feature grid. Distinctiveness should serve the message, not obscure it.

## Typography

Reuse project fonts and tokens first. For a new identity, describe the desired
voice concretely and compare real font specimens, including numerals, punctuation,
weights, and language coverage. Font availability, licensing, loading cost, and
fallback behavior are part of the decision. No family is rejected solely for popularity.

Choose hierarchy by role rather than impose one modular ratio everywhere. Dense
product labels can need close steps; an editorial headline can need strong contrast.
Inspect weight, x-height, leading, tracking, measure, truncation, and font-loading
shift in the actual browser. Around 65–75 characters is a useful prose measure,
not a width limit for tables or compact controls. Use tabular numerals where alignment matters.

Body text should remain readable with zoom and the actual font. A blanket minimum
of 16px is a usability preference, not a WCAG conformance threshold. For contrast,
large text means at least 18pt regular or 14pt bold, approximately 24px or 18.67px.

## Color and contrast

Start with semantic roles: surfaces, text, boundaries, action, selection, and status.
Reuse tokens and inspect all states in supported themes. Color alone must not carry
meaning; pair it with text, shape, position, or icons where required.

A restrained palette can suit task-heavy UI; a committed or broader palette can
support a brand or a meaningful data distinction. Choose by context rather than
category stereotypes. Black, white, tinted neutrals, gradients, and saturated color
are choices to evaluate, not universal rules.

OKLCH can make perceptual adjustments easier where the project supports it. Check
rendered gamut, contrast, and fallback behavior rather than assume a color space
ensures accessibility. At WCAG AA, normal text generally needs 4.5:1 and large text
3:1. Relevant non-text controls and graphical objects generally need 3:1; evaluate
applicability and exceptions rather than score every decorative border.

## Identity, imagery, and iconography

On brand-heavy work, state the intended voice and show how type, color, composition,
and imagery express it. Use assets that support the message and verify their source,
rights, availability, crop, and responsive treatment. Do not invent image URLs.
Alt text describes the image's relevant purpose; decorative images can use empty alt text.

Keep icon families and stroke weight coherent. Inspect optical centering, metaphor,
label spacing, and active/inactive meaning. Give icon-only controls accessible names.

## Systems and evidence

Reuse components by semantic role. Extract repeated intent when it is demonstrated,
not every coincidental visual similarity. A component's states and interaction
contract matter as much as its default appearance.

Check whether a proposed change improves the actual task or brand message. Use
available research or behavior evidence where it exists. Record assumptions when it
does not. Use [critique lenses](critique-lenses.md) to turn observations into precise findings.
