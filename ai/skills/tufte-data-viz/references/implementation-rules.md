# Implementation Rules

Apply these rules while writing chart code. Prefer the project's existing chart
library; do not introduce a new charting dependency just for stylistic control
unless the current stack cannot express the needed form.

## Universal Rules

- **No top/right frame by default.** Keep axes minimal; ticks and labels often do
  enough work.
- **Direct labels over legends.** Label series at endpoints, bars beside marks,
  or groups within the plotted area.
- **Gridlines are optional.** Use none by default. If precision reading needs
  them, use horizontal-only hairlines at very low opacity.
- **Range frames for continuous scales.** Let axis lines span the data range.
  Keep zero baselines for bars.
- **No 3D, shadows, bevels, decorative gradients, or chart-shaped mascots.**
- **One accent color.** Use gray or muted defaults for context, accent only the
  point or series the reader should inspect.
- **Human number formatting.** Use clear units, matched precision, separators,
  and abbreviations where appropriate.
- **Responsive strategy.** At small widths, reduce tick density, flip category
  charts horizontal, or switch to table/sparkline forms instead of shrinking
  everything.
- **Accessible output.** Provide a text alternative or nearby data table, meet
  contrast requirements, and avoid color-only encoding.
- **Motion explains state changes.** Animate sorting/filtering only when it helps
  comprehension, and respect reduced-motion settings.

## Static SVG And HTML

- Prefer self-contained SVG for portable artifacts.
- Escape all user-controlled text before inserting it into SVG or HTML.
- Keep SVG inert: no `<script>`, event-handler attributes, `javascript:` URLs,
  `<foreignObject>`, SMIL animation, or external image/use references.
- Use a stable `viewBox` and responsive width. Avoid fixed pixel-only output
  unless the consuming medium requires it.
- Put labels in the SVG rather than relying on surrounding prose to decode the
  marks.

## React / Recharts

- Remove `CartesianGrid` unless the chart needs faint horizontal reference lines.
- Avoid `Legend`; use `LabelList`, endpoint labels, or custom SVG text.
- Use `ResponsiveContainer` with a stable aspect ratio or explicit min height.
- Set `dot={false}` on dense line charts; add a small marker only for a focal
  endpoint or annotated point.
- Use `domain={["dataMin", "dataMax"]}` for line/scatter range frames; use zero
  for bar value axes.
- For dot plots, slopegraphs, and dense custom labels, raw SVG or D3-in-React is
  often cleaner than forcing Recharts components.

## ECharts

- Hide legends by default and use `endLabel` or rich labels on the series.
- Disable `splitLine` unless faint horizontal guides are needed.
- Keep `grid` margins tight but leave enough right margin for direct labels.
- Use theme tokens for background, text, axis, and accent colors.
- Validate touch behavior if relying on hover tooltips.

## Chart.js

- Disable `plugins.legend.display` by default.
- Disable grid and border lines unless needed for reading precision.
- Use `chartjs-plugin-datalabels` or a small custom plugin for direct labels.
- Keep tooltips plain and ensure keyboard/touch alternatives when embedded in an
  app workflow.

## Matplotlib / Seaborn

- Hide top and right spines.
- Set bottom/left spine bounds to the data range where appropriate.
- Use serif or project-standard report typography for titles and labels.
- Label lines directly with `annotate`; avoid legends for one or two series.
- Save figures with an off-white or transparent background according to the
  target medium.
- Beware seaborn defaults: remove heavy grids, saturated palettes, and redundant
  legends before publishing.

## Plotly

- Use `showlegend=False` when direct labels are practical.
- Set `showgrid=False` or use very faint horizontal gridlines only.
- Set `plot_bgcolor`/`paper_bgcolor` intentionally; do not rely on defaults.
- Keep hover labels plain and concise.
- Test the exported static image, not only the interactive view.

## D3 / Raw SVG

- Build scales explicitly and reserve layout space for direct labels.
- Prefer data joins that produce semantic groups: mark, label, and annotation
  together.
- Do not use default categorical palettes for ordered data; use a sequential or
  diverging scale that matches the meaning.
- Keep axes as thin reference elements. For sparse charts, endpoint ticks may be
  enough.
