## Generation and Inspection

1. Generate the image with the compiled prompt.
2. Inspect it at full size and thumbnail size.
3. Regenerate once when any of these fail:
   - a one-ink composition shows a second ink, or a two-ink composition shows a third printing ink;
   - a two-ink composition lacks clear plate roles or uses the accent across more than 30% without a subject-driven reason;
   - the page reads as digitally color-graded rather than physically printed;
   - empty paper falls outside 25%-55%;
   - the subject is unrecognizable;
   - typography lacks a clear 5x or greater scale jump;
   - long text is garbled or invented branding appears;
   - the composition closely follows a supplied reference.
   - a relaxed result has no immediately identifiable focal event or distributes equal emphasis across the whole page;
   - a theme-only person becomes a complete stock-photo figure or the page falls into a safe headline-left/photo-right split;
   - the release zone is filled with decorative microcopy, gestures, or secondary focal points.
4. If exact text renders incorrectly after one retry, generate a text-light base image and state that typography should be overlaid in a layout tool. Do not pretend distorted text is correct.

## Output Format

Use the conversation language for section headings. The English labels below are examples.

````markdown
**Generated image**

[Embed the generated image here, or provide its absolute path]

**Final prompt**

```text
[prompt used for generation]
```

**Recipe**

- Mode: [pure one-ink / chromatic + black / complementary duotone / overprint duotone]
- Ink: [exact one- or two-ink palette and hex values]
- Layout: [layout family]
- Type: [editorial voice + utility voice]
- Process: [halftone/risograph/cyanotype/photocopy treatment]
- Originality: [one sentence naming the major structural departures from references]
````

## Final Quality Gate

- Is there one intentionally selected white, gray, or pale-beige substrate and no more than two printing inks?
- Does the result read as contemporary editorial by default, with vintage or aged styling present only when requested?
- If there are two inks, does each plate have a clear role and does the accent remain controlled?
- Does 25%-55% of the page remain visibly empty?
- Is the image reproduced through dots or mechanical print texture rather than a color filter?
- Does one object occupy 45%-80% of the page, except for a justified information-heavy layout?
- Does the headline visibly cross, cover, split around, or lock tightly to the dominant object?
- Does exposed paper form a visible shape inside the image through highlights, gaps, fade-outs, or knockouts?
- Is there exactly one manual gesture family rather than several decorative doodle styles?
- Does the type hierarchy use a 5x-12x scale jump and no more than three type voices?
- Does the page have exactly one immediately identifiable focal event?
- Is there one visibly quieter release zone rather than evenly distributed emptiness?
- For relaxed work, is energy concentrated in the focal event rather than reduced everywhere?
- If no source image was supplied, does the figure feel observed in an ordinary in-between moment rather than posed as an advertisement?
- If type is page-filling, is it the selected focal event while the remaining devices retreat?
- Is the language terse, specific, and non-commercial?
- Is the user's supplied subject preserved?
- Are at least four structural features different from every supplied reference?
- Did the run generate an image when native image generation was available, unless prompt-only was requested? Otherwise, was the limitation stated?
