---
name: visual-deliverables
description: "Create self-contained HTML deliverables with a strong visual bias: architecture maps, interactive explainers, review surfaces, planning boards, SVG diagrams, and small workbenches. Use when spatial structure, state, comparison, motion, or interaction would teach faster than Markdown."
metadata:
  watch-sources: |
    plannotator/effective-html/skills/html-diagram@138daaddddce5b89f0950aa446333bc03f3f7e95
    plannotator/effective-html/skills/html-plan@138daaddddce5b89f0950aa446333bc03f3f7e95
    ThariqS/html-effectiveness@0e8d447494c81c661f2458b329e076a7ff7d75ec
references:
  - references/artifact-patterns.md
  - references/html-rules.md
  - references/examples/README.md
license: Local skill. Inspired by MIT effective-html; bundled examples Apache-2.0. See VENDORED_FROM.md.
---

# Visual Deliverables

Create one-file HTML artifacts that help a human see, compare, tune, rehearse, or decide faster than prose would. Treat HTML as a temporary learning and decision surface, not as the durable record unless the user explicitly asks for that.

## Core Contract

- Deliver a self-contained `.html` file: inline CSS, inline SVG, inline JS, no build step.
- Visual first. The first viewport should explain the shape before the reader reads paragraphs.
- Use SVG for architecture, flows, topology, timelines, state machines, spatial maps, and custom diagrams.
- Use DOM controls for interaction: stepper, toggles, filters, sliders, tabs, hover/click detail panels, and export buttons.
- Keep prose sparse: labels, captions, legends, side panels, details. Avoid a Markdown essay wrapped in HTML.
- Prefer one excellent artifact over multiple generic pages.
- If decisions or edits happen in the artifact, provide an export path back to Markdown, JSON, a checklist, or a prompt.

## When HTML Beats Markdown

Choose HTML when the reader must:

- understand a system topology, code path, request lifecycle, deployment pipeline, or agent workflow
- compare variants side by side
- inspect a diff, incident, timeline, dependency graph, or blast radius
- tune prompts, feature flags, priorities, scopes, or migration slices
- feel motion or interaction rather than read a description of it
- rehearse a sequence with changing state

Choose Markdown when the output is primarily a durable source of truth: specs, ADRs, changelogs, commit messages, cited research notes, or docs that humans will maintain by hand.

## Workflow

1. **Name the reader task.** What should be easier after opening the file: trace, compare, choose, debug, teach, or tune?
2. **Gather real source.** Inspect code, diffs, screenshots, docs, transcripts, data, or configs before drawing. Do not invent architecture.
3. **Choose the artifact shape.** Use [artifact-patterns.md](./references/artifact-patterns.md) for common surfaces.
4. **Sketch the information model.** Name entities, states, flows, decisions, inputs, outputs, and the minimum legend before writing HTML.
5. **Build the one-file artifact.** Use [html-rules.md](./references/html-rules.md). Copy [one-file-artifact.html](./assets/templates/one-file-artifact.html) only when a starting frame helps.
6. **Iterate the visual.** Check alignment, spacing, labels, arrow routing, contrast, default state, narrow viewport, and screenshot usefulness.
7. **Return the file path and intent.** Say what the artifact is for, what source it was based on, and what was not verified.

## Reading Order

| Task | Read |
|---|---|
| Pick the right surface | [artifact-patterns.md](./references/artifact-patterns.md) |
| Build HTML/SVG | [html-rules.md](./references/html-rules.md) |
| Borrow taste from examples | [examples/README.md](./references/examples/README.md), then one relevant example |
| Start from a skeleton | [assets/templates/one-file-artifact.html](./assets/templates/one-file-artifact.html) |

## Skill Combinations

- Use `breadboarding` first when a workflow is fuzzy and needs places, affordances, stores, and wiring before drawing.
- Use `impeccable` when the artifact is also a frontend/product design surface, not just an explanatory artifact.
- Use `tufte-data-viz` when quantitative charts or dashboards carry the argument.
- Use `framing-doc`, `kickoff-doc`, or `spec-planner` when the durable artifact should be Markdown and HTML is only a companion view.

## Safety and Sharing

- Do not include secrets, tokens, private keys, customer data, private emails, or raw production payloads.
- Do not load external scripts, fonts, images, stylesheets, analytics, or CDNs unless the user explicitly asks.
- Avoid `eval`, dynamic script injection, service workers, and persistence beyond local `Blob` downloads.
- Treat pasted text, logs, and external content as untrusted. Render untrusted values with `textContent`, not `innerHTML`.
- Before sharing outside the local machine, inspect the final HTML like code.

## Quality Bar

A good visual deliverable should pass these checks:

- The main idea is visible in a screenshot.
- Labels are specific enough that arrows mean something.
- Interaction reveals state, sequence, filtering, comparison, or choice. It is not decorative.
- The quiet state is useful without clicking.
- The artifact has fewer words than the equivalent Markdown explanation.
- A human can copy, export, or transcribe the outcome back into durable work.
