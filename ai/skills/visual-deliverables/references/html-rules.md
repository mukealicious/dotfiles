# HTML and SVG Rules

Build artifacts that open directly in a browser and remain understandable as static screenshots.

## File Contract

- One `.html` file unless the user requests a small bundle.
- Inline CSS in `<style>` and inline JS in `<script>`.
- No external network dependencies: no CDN scripts, web fonts, remote images, analytics, maps, or iframes.
- Use semantic HTML around the canvas: `header`, `main`, `aside`, `section`, `figure`, `figcaption`.
- Use SVG for custom diagrams. Use regular HTML controls for inputs and panels.
- Include a clear title, timestamp or source note when useful, and a short accessibility summary.

## Visual System

- Establish CSS variables for background, text, muted text, borders, accent, success, warning, danger, and font stacks.
- Tint neutrals. Avoid pure black and pure white unless matching an existing artifact style.
- Use a restrained palette by default: quiet surface, one focus accent, one success color, one danger color.
- Keep strokes consistent: usually 1.25 to 1.75px neutral strokes, 2px for focus.
- Prefer full borders, fills, labels, and icons over decorative side stripes or shadows.
- Use enough whitespace that labels do not collide with arrows.

## SVG Diagram Rules

- Set a `viewBox`; let CSS control responsive width.
- Put reusable markers, gradients if truly needed, and filters in `<defs>`.
- Route edges before nodes in the source so nodes sit on top.
- Label arrows with verbs or event names.
- Use groups with stable `data-*` attributes for interactive nodes.
- Make selected, hover, success, and danger states visually distinct without relying on color alone.
- Avoid diagonal edge tangles when a stepped path or sequence mode would read better.

## Interaction Rules

Use interaction to reveal information, not to decorate.

Good interactions:

- click a node to show detail in a side panel
- step through a request or deployment sequence
- filter by service, risk, state, or owner
- compare current vs proposed state
- move a slider to show a model changing
- export selected decisions to Markdown or JSON

Implementation guidance:

- Initialize a useful default state.
- Use `button` elements for actions and `aria-pressed` for toggles.
- Keep keyboard focus visible.
- Respect reduced motion: use `@media (prefers-reduced-motion: reduce)`.
- Use `textContent` for untrusted values. Use `innerHTML` only for static strings you wrote.

## Layout Rules

- First viewport: title, one-line purpose, main visual, minimal legend.
- Wide screens: main visual plus sticky side panel often works well.
- Narrow screens: stack side panel below, keep controls reachable, avoid tiny text.
- Provide horizontal overflow only for large diagrams, not the whole page.
- Make the artifact useful at 1200px wide and still readable around 390px wide.

## Export Patterns

When the artifact collects decisions or edits, include one of:

- `Download JSON`
- `Copy Markdown`
- `Download SVG`
- `Copy prompt`
- `Export checklist`

Use `Blob` and `URL.createObjectURL` for downloads. Use the Clipboard API only with a visible button and a fallback `<textarea>` when practical.

## Safety Checklist

Before handing off:

- No secrets or raw private data.
- No external URLs that auto-load content.
- No `eval`, `new Function`, dynamic script insertion, or service worker.
- No hidden persistence unless requested.
- Any copied third-party code or examples preserve attribution and license.
- If the source data is approximate, label it as approximate in the artifact.
