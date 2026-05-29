---
name: tufte-data-viz
description: Apply Tufte-style data visualization judgment when creating, reviewing, or improving charts, graphs, dashboards, sparklines, data tables, or quantitative graphics. Use for chart design, chart code, visual integrity reviews, data-ink cleanup, accessibility checks, and library-specific chart implementation guidance.
metadata:
  watch-sources: |
    caylent/tufte-data-viz@ae7ca0de7819db83241b24a2618810d5f1171145
    aref-vc/tufte-claude-skill@e0d5a48545999c3a2a2f14596f3e1bcedd2b96ea
    gnurio/tufte-vdqi-plugin@a8c605400db070095fca33d0944316ed71e72667
references:
  - references/chart-selection.md
  - references/implementation-rules.md
  - references/review-rubric.md
---

# Tufte Data Viz

Use this skill when a task involves quantitative visual communication: choosing
a chart, writing chart code, reviewing an existing graphic, or cleaning up a
dashboard. The goal is not a decorative "Tufte look"; it is a readable,
honest, high-signal display.

## Workflow

1. **Name the message.** State the main comparison, trend, distribution, or
   relationship the reader should see. If the data only supports a sentence or
   small table, say so before drawing a chart.
2. **Choose the form before styling.** Use
   [chart-selection.md](./references/chart-selection.md) to pick a chart by
   data shape and reader task.
3. **Strip non-data work.** Remove visual features that do not help the reader
   compare values: 3D, pie/donut defaults, dual axes, heavy grids, legend
   decoding, shadows, gradients, redundant labels, and novelty widgets.
4. **Implement for the actual stack.** Use
   [implementation-rules.md](./references/implementation-rules.md) for
   library-specific guidance across React/SVG, Recharts, ECharts, Chart.js,
   matplotlib, Plotly, and D3.
5. **Review before handing off.** Use
   [review-rubric.md](./references/review-rubric.md) to check integrity,
   accessibility, responsive behavior, and whether the chart still earns its
   space.

## Defaults

- Prefer direct labels over legends.
- Prefer sorted dot plots, horizontal bars, sparklines, small multiples, range
  frames, and well-set tables over ornamental chart types.
- Use one accent color for focus; keep the rest quiet.
- Use position and length for numeric comparison. Avoid area, volume, and
  perspective for one-dimensional quantities.
- Preserve accessibility: text alternative, contrast, keyboard/touch access for
  interactive charts, and non-color cues when color distinguishes categories.
- For static outputs, keep SVG inert: no script-bearing markup, event handlers,
  `javascript:` URLs, external image loads, or embedded active HTML.

## Reading Order

| Task | Read |
|---|---|
| Pick the right chart | `references/chart-selection.md` |
| Build chart code | `references/chart-selection.md`, then `references/implementation-rules.md` |
| Review or improve a chart | `references/review-rubric.md`, then `references/chart-selection.md` if the form is suspect |
| Build static SVG/HTML | `references/implementation-rules.md` and the inert SVG rules above |

## Output Expectations

When designing or reviewing, explain the chart choice and one or two rejected
alternatives. When producing code, make the chart usable at narrow and wide
viewports, label data directly where practical, and include a short text
alternative or companion table when the surrounding project supports it.
