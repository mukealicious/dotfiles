# Example References

Read at most one or two examples before building. These are taste and structure references, not templates to copy blindly.

## Curated Effective HTML Examples

Bundled under `effective-html/` from the Apache-2.0 `html-effectiveness` corpus.

| File | Read when | What to study |
|---|---|---|
| `effective-html/04-code-understanding.html` | Codebase or architecture explanation | Diagram plus walkthrough plus key-file sidebar |
| `effective-html/10-svg-illustrations.html` | SVG craft, palette, downloadable figures | Inline SVG style rules, figure sheets, export button |
| `effective-html/13-flowchart-diagram.html` | Process or deployment pipeline | Clickable SVG nodes, side-panel details, failure paths |
| `effective-html/15-research-concept-explainer.html` | Concept teaching or system model | Tiny simulator, sliders, glossary, generated SVG |

## How to Borrow

Borrow these moves:

- one visual thesis per page
- serif title, mono labels, restrained palette
- side panel for detail instead of prose under every node
- SVG groups with `data-*` keys connected to a small JS object
- controls that mutate visible state immediately
- explicit palette and drawing rules
- export buttons when the artifact creates a reusable output

Do not blindly borrow:

- fictional data or Acme naming
- exact colors when the target project has a design system
- `innerHTML` for untrusted runtime content
- large prose sections when the user asked for diagram-first output

## Provenance

- `ThariqS/html-effectiveness` at `0e8d447494c81c661f2458b329e076a7ff7d75ec`
- Bundled via `plannotator/effective-html` at `138daaddddce5b89f0950aa446333bc03f3f7e95`
- Example license: Apache-2.0. See `effective-html/LICENSE`.
