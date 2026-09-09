### 3. Image Treatment

Convert photographs and illustrations into the selected ink plate or plates plus substrate. Choose reproduction intensity from the subject instead of automatically aging every image:

- crisp screening or clean plate separation for contemporary work; coarse halftone, risograph grain, cyanotype-like exposure, photocopy breakup, or newspaper screening when materially useful or explicitly requested;
- visible dots at close range, recognizable subject at thumbnail scale;
- clipped highlights where paper shows through and dense shadows where ink pools;
- optional mild ink bleed, uneven coverage, scan noise, paper fibers, or 1-2 mm registration drift between plates; use fewer imperfections for contemporary branding and clean editorial work;
- medium contrast; avoid glossy photographic depth.

When no source image is supplied, do not default to a polished photorealistic hero person or a complete stock-photo figure. Prefer 2-4 identifying anchors such as a hand on a handlebar, one bent leg, a wheel arc, loose fabric, or hair direction. Build the subject from a partial editorial crop, simplified screened fragment, and one ordinary in-between gesture. For movement subjects, the object or cropped body relationship may carry the focal event while the person remains incomplete. Avoid advertising poses, victory gestures, athletic hero angles, catalog-style full bodies, and the safe headline-left/photo-right split unless the user asks for them.

#### Abstract Looseness

When `representation` is `abstract symbol extraction`, transform the supplied image into a small visual vocabulary instead of applying a stylized filter to the whole photograph:

1. Name 2-4 **identity anchors** that make the subject recognizable, such as a square sail, curved hull, mast, and wave direction. Preserve their relationship, not their photographic detail.
2. Convert the anchors into **one dominant mass**, **one structural contour**, and **one repeated rhythm**. Use flat plate shapes, broken hand-drawn lines, short strokes, dots, or paper cutouts; omit incidental scenery and fine surface description.
3. Let paper replace at least 35% of the source scene. Crop one anchor at a page edge and allow one type or line element to cross it. Abstraction must create active space, not merely blur or posterize the photo.
4. Keep the abstract geometry deterministic. Apply looseness through slightly irregular contours, uneven repeated marks, and the recipe's style-appropriate controlled print imperfections; do not randomly move anchors between retries.
5. Stop before the subject becomes generic. At thumbnail scale, at least two identity anchors must still communicate the original subject without relying on the caption.

For complementary duotone abstraction, assign the dominant ink to structure and rhythm, and reserve the accent ink for one identity anchor or one annotation. Do not distribute the accent evenly across the page.

#### Controlled Chance

Keep composition, wording, palette, and hierarchy deterministic. Introduce looseness only in the reproduction layer. Contemporary work selects 0-2 restrained effects; tactile, vintage, or archival-aging work selects 2-3 effects from `../design-system/imperfections.json` with the resolved recipe's stable seed.

- Let uneven ink density, dry-edge breakup, halftone drift, registration drift, or one broken manual gesture create the analog variation.
- Apply variation to large type, image plates, solid shapes, or the single gesture family; never distort microcopy or factual text.
- Keep all effect values inside the catalog ranges. The same resolved input must reproduce the same marks and offsets.
- In one-ink work, registration drift may appear only as a pale second impression of the same ink. It does not add another color.
- Do not use controlled chance to move the dominant object, change line breaks, alter the grid, or compensate for an unresolved composition.

Use one dominant image zone occupying 45%-80% of the page, 1-3 isolated specimens whose combined area stays in that range, or one repeated object system. A ruled information poster may reduce the image zone to 32%-55% only when real supplied information needs the space. Dense overlap is allowed only in the **overprint collage** family; it must still read as two printing plates rather than scrapbook decoration.

### 4. Typography

Typography is a responsive cast, not a fixed house font. Read `../design-system/typography.json` and choose one primary display skeleton from the subject, wording, and information structure. A series may move between literary serif, wide cultural grotesk, compressed civic sans, engineered program type, rotated display, and word-as-object typography. Consistency across a set comes from ink, spacing, plate logic, and disciplined microtype; do not force every image into the same serif-plus-mono treatment.

Build each image with one primary display voice and one functional support voice. A third voice is allowed only as one short handwritten interjection. Handwriting supplies human interruption, never dates, locations, essential facts, or long copy.

Choose at most one typographic behavior per image:

- natural lowercase sentence breaks for intimate language;
- wide or interlocked capitals for music, movement, and contemporary culture;
- compressed stacked lines for public events;
- tabular numerals and unequal ruled blocks for programs or schedules;
- one 90-degree rotation or vertical title for a bold cover;
- one circled handwritten aside for an invitation or personal note;
- oversized cropped letterforms when the words are the dominant object.

Do not repeat the same display category across every item in a multi-scene request unless the user explicitly asks for a unified typographic campaign.

Rules:

- Use one dramatic scale jump: largest text is 5-12 times the microcopy size.
- Prefer lowercase for intimate statements and uppercase for public declarations.
- Keep display copy to 2-8 words and all other copy sparse.
- Default all invented words to natural English, even when the user's request is written in another language. Preserve user-supplied wording exactly and do not translate it unless asked.
- Use exact readable wording only when the user supplies it or it carries the concept. Otherwise use plausible microtype as texture and do not invent organizations, URLs, sponsors, or event facts.
- No gradient type, outline effects, drop shadows, inflated 3D letters, or generic luxury-fashion spacing.
- Oversized type is valid when selected as the one focal event. Otherwise keep it subordinate to the selected image, object, crop, or overprint event.
- In `relaxed` work, create a clear strength difference: one typographic move may be audacious while all supporting type becomes sparse and functional.
- Do not copy a reference's distinctive lettering, exact line breaks, or word arrangement. Translate only the broader contrast, orientation, and voice relationship into an original solution.

### 5. Communication Tone

Write like an independent cultural poster, field journal, or community print notice:

- terse, observant, romantic, and free-spirited without becoming sentimental;
- human and specific rather than inspirational;
- quiet confidence, dry wit, or factual clarity;
- no sales language, CTA, hype, productivity slogans, or brand manifesto voice.

For summer, movement, travel, leisure, music, and night subjects, make romantic freedom the default emotional register. Express it through a physical sensation, an open direction, an unhurried gesture, or a small relationship between subject and space. Favor fresh English fragments such as an observation or invitation, never a generic motivational slogan. For factual, civic, scientific, or archival subjects, let clarity override this romantic default.

If text must be invented, prefer an English observation, plain declaration, object label, or small contradiction. Never reuse wording visible in reference images or repeat a stock phrase across unrelated outputs.

For romantic, intimate, nostalgic, or poetic prompts, express feeling through one observable relationship: two figures sharing one edge, an object carrying signs of use, a crop that implies closeness, or a small distance between forms. Do not default to string lights, wine glasses, fluttering fabric, stars, flowers, sunset silhouettes, or cinematic haze. Those props describe a romance category; a specific relationship creates romance while preserving the reference set's graphic directness.
