---
name: mono-color
description: "Create one-ink or controlled two-ink editorial artwork and prompts. Use for 单色海报、双色印刷、孔版印刷、risograph、网点照片、zine posters, duotone prints, or explicit mono-color styling. For interfaces, owns art direction and raster assets only; impeccable owns UI."
license: MIT. See LICENSE.
metadata:
  watch-sources: yanliudesign/mono-color-skill@a08c45df61ae480e2b0d78b978a304e06ba2894e
---

# Monocolor Editorial Print

Turn a theme or image into an original printed editorial artifact:

> adaptive neutral substrate + one or two inks + reproduced image + typographic tension + concise human voice

Recombine this visual grammar; never trace a reference composition.

## Deliverable and owner boundary

Return one final image-generation prompt, one generated raster image when native
image generation is available (unless prompt-only was requested), and a short
recipe naming palette, layout, type pairing, and print process. Otherwise return
the prompt and recipe and state the image-generation limitation; do not require
an external image service installation.

Follow the active image tool's save policy and the user's explicit destination.
For project-bound work, place the selected image in an existing asset directory
and report its verified path. Preview-only output may remain at the provider's
default location and render inline. Never claim a nonexistent file path.

For websites and app interfaces, compose with `impeccable`: it owns information
architecture, semantic copy, navigation, CTAs, controls, accessibility, responsive
behavior, and implementation. This skill owns art direction and raster assets.
Keep UI text and controls semantic, not baked into the bitmap. The print limits
and hard avoids apply to artwork, not to necessary interface affordances.

## Read the input

Identify the subject, intent, exact words, image role, and representation:

- Intent: poetic observation, announcement, field note, personal statement,
  cultural poster, or specimen page.
- Image role: hero photograph, isolated specimen, cropped fragment, texture
  source, or no supplied image.

- Preserve the supplied subject and exact wording in its original language.
- Without supplied text, invent one English display phrase of 2–8 words and
  preserve it across retries. Omit display text only on explicit request.
- Choose one concrete visual metaphor for a complex topic, not every point.
- Use faithful reproduction by default. For abstract, artistic, loose,
  experimental, less realistic, or less photographic requests, extract abstract
  symbols while preserving 2–4 identifying anchors and their relationships.
- Crop, isolate, enlarge, simplify, or screen source imagery; never invent branded
  details or replace the subject.

## Compose with focused references

| Decision | Read when needed |
|---|---|
| Resolve a generation recipe, defaults, stable retry seed | [recipe.md](references/recipe.md) before compiling a prompt |
| Palette/plate roles, grid, focal event, quiet space | [color-and-layout.md](references/color-and-layout.md) when composing |
| Reproduction, abstraction, controlled imperfections, typography, voice | [image-and-type.md](references/image-and-type.md) when composing |
| Choose the content-driven layout family | [composition.md](references/composition.md) |
| Compile the five-paragraph final prompt | [production.md](references/production.md) |
| Inspect/retry a generated image and format the deliverable | [inspection.md](references/inspection.md) |

The machine-readable catalogs in `design-system/` own exact palette IDs, geometry,
type roles, rhythm, carrier signals, and imperfection ranges. Read only catalogs
needed for current choices; exact catalog values win over prose.

Core defaults: `3:4`, clean Neutral White `#FAFAF7`, controlled Cobalt + Terracotta
`#2148B8` + `#C65F38`, 35% empty paper, one focal event, and a visibly quieter
release zone. Subject-specific recipe rules refine these. Explicit one-ink,
monochrome, or single named-ink requests use one plate; never exceed two.
Contemporary work is clean, not automatically aged. Keep resolved inputs stable
across retries; novelty is not a reason to change palette, text, layout, or process.

## Originality firewall

The reference is evidence for visual grammar, never a layout to trace. Before
generation, change at least four structural features from any supplied reference:
subject/crop, layout family, headline wording/location, image shape/count, grid,
type pairing, metadata treatment, ratio, or disruption device. Preserve supplied
subject/text constraints by changing other features.

Never reproduce exact object arrangements, line breaks, labels, dates, logos,
border systems, or distinctive slogans from a reference. No fake signatures or
publication marks. Transform user-provided protected/branded material without
presenting the result as an official artifact.

## Hard avoids

For standalone artwork and every generated raster asset, exclude:

- More than two inks, unassigned accents, gradients, rainbow, neon, full-color photos.
- Clean vector-flat digital posters, beige lifestyle minimalism, monochrome wash.
- Glossy mockups, 3D depth, cinematic lighting, lens blur, hard shadows.
- Centered template symmetry, card grids, UI panels, stickers, decorative blobs.
- Scrapbook collage, uncontrolled overlap, grunge overload, torn-paper styling.
- Automatic vintage styling, yellowing, sepia, distressed borders, nostalgic props,
  or retro type merely because the work uses halftone or limited inks.
- Long paragraphs, marketing copy, CTA buttons, logos, URLs, QR codes.
- Exact imitation of a supplied poster or recognizable artist signature.
