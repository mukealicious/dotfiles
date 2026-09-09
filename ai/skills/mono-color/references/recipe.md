# Recipe Manifest

Before writing the generation prompt, resolve the input into this manifest. Do not skip fields and do not expose the manifest unless the user asks for process details.

Use the machine-readable catalogs in `../design-system/` as the source of truth for palette IDs, typography roles, composition geometry, carrier signals, visual rhythm, and controlled print imperfections. Read only the relevant catalog for the current decision. The related composition and visual references explain intent; when an exact value differs, the catalog wins. Catalog paths in the manifest below are relative to the skill root.

```yaml
subject: <one recognizable subject>
intent: <one intent from SKILL.md's Read the input section>
exact_text: <user text, generated 2-8 word phrase, or none>
text_language: <language of supplied text, otherwise English>
representation: <faithful reproduction or abstract symbol extraction>
ratio: <explicit ratio or 3:4>
carrier: <one carrier ID from design-system/carriers.json or none>
substrate: <one substrate ID and exact hex from design-system/colors.json>
mode: <pure one-ink, chromatic + black, complementary duotone, or overprint duotone>
palette: <one palette ID from design-system/colors.json>
inks: <the palette's named ink or approved pair with exact hex values>
plate_roles: <one explicit role per ink plate>
layout: <one composition ID from design-system/compositions.json>
empty_paper: <explicit percentage>
visual_tension: <relaxed, balanced, or assertive from design-system/rhythm.json>
focal_event: <one strong visual event from design-system/rhythm.json>
release_zone: <one deliberately quiet region that gives the focal event room>
unresolved_edge: <one optional edge behavior from design-system/rhythm.json or none>
image_treatment: <one mechanical reproduction process>
type_hierarchy: <one role ID from design-system/typography.json>
disruption: <one deliberate disruption>
imperfection_seed: <stable hash derived from the resolved recipe>
imperfections: <0-2 restrained effect IDs for contemporary work, or 2-3 for tactile/vintage work>
```

Use these defaults whenever the user has not made the choice:

- ratio: `3:4`;
- representation: `faithful reproduction`, unless the user asks for abstract, artistic, loose, experimental, less realistic, or less photographic treatment;
- text language: English for all invented display text, labels, and microcopy;
- substrate: select from Neutral White `#FAFAF7`, Cool Gray `#E9E9E5`, or Pale Beige `#F5F1E8` according to the subject, image values, and ink contrast. Neutral White is the unspecified default; never assume beige or aged paper merely because the work uses halftone or risograph language;
- mode and ink: controlled two-ink by default. Use Cobalt + Terracotta `#2148B8` + `#C65F38` for an unspecified subject, then select the closest approved pair for the subject. The dominant plate carries 70%-85% and the accent plate carries 15%-30%. Switch to pure one-ink only when the user explicitly requests one ink, monochrome, or one named ink without a second color;
- empty paper: `35%`;
- visual tension: `relaxed` for reflective, travel, summer, leisure, lifestyle, and unspecified cultural subjects; `balanced` for ordinary events and editorial information; `assertive` only when the user requests a forceful declaration or the phrase itself is the subject;
- focal event: choose exactly one strong visual event and make all other devices support or release it;
- release zone: reserve one large quiet region with low information density; its size follows the composition rather than a universal percentage;
- unresolved edge: use one only when it strengthens the focal event or release zone; otherwise use none;
- image treatment: clean plate separation or medium screening for contemporary work; coarse halftone only when the subject, supplied image, or user request benefits from it;
- type hierarchy: resolve the role from `../design-system/typography.json`. Use Literary for intimate or quiet subjects, Cultural Grotesk for music and contemporary culture, Condensed Civic for public events, Programmatic when dates or structured facts lead, Rotated Display for bold covers, Handwritten Interjection only as a secondary human voice, and Typographic Object when the phrase itself is the image;
- disruption: one off-center image crop; use one oversized word instead when there is no image.
- imperfections: choose 0-2 subtle effects for contemporary editorial work and 2-3 effects for tactile, vintage, archival-aging, or explicitly rough work, using a stable hash of subject, exact text, palette, and layout; preserve the same seed across retries.

Explicit user choices override defaults unless they violate the two-ink limit or the originality firewall. For identical inputs, resolve the same manifest; do not vary palette, layout, percentages, or process merely for novelty. This stabilizes the design procedure while image-generation details may still vary.

Resolve generic color words consistently: blue to Cobalt, green to Botanical Green, orange to Terracotta Orange, red to Signal Red, purple to Aubergine, and black to Charcoal. For generic green + black, use Mint Green + Charcoal. For generic blue + orange, use Cobalt + Terracotta. Exact named inks always take precedence over these aliases.
