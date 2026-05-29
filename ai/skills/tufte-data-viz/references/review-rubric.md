# Review Rubric

Use this rubric for existing charts, screenshots, or chart code. Lead with
issues that could mislead a reader before style preferences.

## Integrity

- Are length, position, area, and color used honestly for the data type?
- Do bars start at zero?
- Is there a dual y-axis or scale trick that implies a false relationship?
- If visual change appears disproportionate to data change, estimate a lie
  factor: visual percentage change divided by data percentage change. Values
  close to 1 are honest; large deviations need redesign.
- Are units, date ranges, sample sizes, and denominators clear?

## Form Fit

- Does the chart match the data shape and reader task?
- Would a table or sentence communicate the result better?
- Are categories sorted by meaning or value rather than accidental input order?
- Are small multiples a better answer than overplotting?
- Is the chart type chosen because the library made it easy rather than because
  it serves the data?

## Data-Ink And Labeling

- Can the reader understand the chart without decoding a remote legend?
- Are gridlines, borders, ticks, fills, and labels doing useful work?
- Is the same value repeated through multiple redundant encodings?
- Are annotations attached to meaningful peaks, troughs, thresholds, or events?
- Is the title an insight or just a restated axis label?

## Accessibility And Responsiveness

- Is there a text alternative or companion table?
- Does contrast hold for text and marks?
- Is color paired with shape, position, direct label, or pattern when categories
  need distinction?
- Do hover interactions have touch/focus equivalents?
- Does the chart remain readable at narrow mobile and wide desktop widths?
- Does animation respect reduced-motion settings?

## Code Quality For Chart Implementations

- Does the implementation use project-standard components and tokens?
- Are dimensions stable enough to avoid label overlap and layout jumps?
- Are user-controlled labels escaped in SVG/HTML output?
- Are chart constants centralized when multiple charts share a visual system?
- Are data transformations clear and testable?

## Output Shape

For a review, return:

1. **Verdict**: keep, revise, or replace.
2. **Main risk**: the most important way the current chart could confuse or
   mislead.
3. **Recommended form**: the chart/table/sentence to use instead.
4. **Fix list**: ordered by impact, with concrete implementation moves.
5. **Residual tradeoff**: what the chosen design still does not show.
