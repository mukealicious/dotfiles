# Chart Selection

Choose the chart by data shape and reader task. Do this before touching color,
fonts, or library defaults.

## First Question: Is A Chart Needed?

- **One or two numbers**: write a sentence with context.
- **Small exact lookup set**: use a table, especially when values matter more
  than pattern.
- **Many values, patterns, or comparisons**: use a chart.
- **Dashboard metric**: pair the number with comparison context, a sparkline, or
  a target delta. A large standalone number is usually under-informative.

## Data Shape To Form

| Data shape | Reader task | Prefer | Avoid |
|---|---|---|---|
| Single number with prior/target | Compare to context | Sentence, inline sparkline, small proportional mark | KPI card with no context |
| One value per category | Rank or compare | Sorted dot plot or horizontal bar | Pie, donut, treemap for routine comparison |
| One value over time | Track change | Line chart, sparkline, annotated time series | Bar chart for continuous time |
| Multiple comparable series | Compare patterns | Small multiples with shared scales | Overplotted spaghetti lines |
| Before/after by item | See change | Slopegraph | Side-by-side bars |
| Two numeric variables | Relate | Scatterplot with range frame | Bubble chart unless area is truly needed |
| Distribution | See spread/outliers | Strip plot, histogram, quartile plot | Decorative violin/box forms for general audiences |
| Part-to-whole | Compare shares | Sorted bar or small table | Pie/donut unless explicitly required |
| Funnel/stages | See dropoff | Horizontal bars by stage, retention table | 3D funnel |
| Geographic values | Locate and compare | Single-hue choropleth with annotations, small multiples | Rainbow maps, raw-count bubble maps |
| Multivariate table | Compare cells and trends | Table with sparklines or restrained shading | Heatmap when exact numbers matter |

## Gut Checks

- If categories are not intentionally ordered, sort by the value the reader
  cares about.
- If a chart needs a legend, first try direct labels.
- If you want a second y-axis, split into aligned small multiples.
- If labels must rotate, switch orientation or abbreviate.
- If the chart has more decorative ink than data marks, remove decoration before
  adding anything else.
- If the reader needs exact values for fewer than about 20 numbers, a table may
  be the honest answer.

## Alternative Discipline

For non-obvious data, consider at least two forms before choosing. State what the
chosen form reveals and what the rejected form would hide or distort.
