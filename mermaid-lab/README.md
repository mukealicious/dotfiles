# Optional Pele / Mermaid lab

This is an opt-in local experiment, not a replacement for the official Mermaid
validator. Nothing installs it through `dot`, changes `PATH`, or projects a skill.
The preserved `ai/skills/mermaid/` snapshot remains unchanged.

Use Pele for fast local SVG previews. Keep official Mermaid validation when the
consumer is Mermaid. A successful Pele render does not prove Mermaid compatibility.

## Run

Use the Node and pnpm versions in `mise.toml`. Install only this directory's
locked packages; do not run an installer or global package command.

```sh
cd mermaid-lab
pnpm install --ignore-scripts --frozen-lockfile
mkdir -p results
pnpm render example.mmd results/example.svg 320
pnpm test
pnpm compare
pnpm gallery
```

The renderer needs only Node. The browser tests, comparison, and gallery use a
fresh headless Chrome profile, not a signed-in browser. They default to
`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`. Set `CHROME` for
another compatible executable. No browser is downloaded.

The preview refuses to overwrite an existing output. Delete or rename an output
you own before rendering it again. It creates SVG files with mode `0600`.

To compare private Markdown, supply an explicit local vault:

```sh
pnpm compare --vault /absolute/path/to/vault
```

This reads Mermaid fences in non-hidden Markdown files, skips symlinks, and does
not edit the vault. It does not support every Markdown fence nesting convention.
Reports go to ignored `results/comparison.json`. They contain local paths,
rendered label text, and parser error messages. **They are private. Do not commit,
upload, or attach them to a public issue.** A new run replaces this local report.
The gallery uses only the synthetic fixtures, never the vault report.

Browser resources come from an ephemeral loopback server. The comparison blocks
non-local browser requests and also uses a restrictive CSP. The gallery and safety
tests abort all routed browser requests. Safety request detection runs without CSP;
one regression deliberately reinstates CSP to demonstrate its observation blind
spot. Package installation still uses the registry.

## Preview boundaries

`render-pele.mjs` runs Pele in a worker with a 5 second termination limit. It sets
`links: false` and `images: false`, supplies no icon or math resolver, and bounds
source length to 50,000 characters, output to 4,000,000 characters, and edges to
500. It rejects files over 200,000 bytes and widths outside 200–2400 pixels.
These are fixed application options, not diagram-author configuration.

This is **not a general SVG sanitizer or an operating-system sandbox**. The worker
runs the locally installed, trusted Pele package. It bounds rendering time, not
all process memory. Keep the dependencies reviewed. Do not serve an upload endpoint
with the comparison harness: it renders trusted local documents in the browser,
without a per-diagram worker time limit.

Pele defaults allow web images, which can make requests when SVG is displayed.
Its internal links are note names, not filtered URLs. Trusted icon and math
resolvers can insert unsanitized markup. Do not add these capabilities casually.

## 2026-10-24 experiment

| Check | Result |
| --- | --- |
| Vault corpus | 39 diagrams in 27 Markdown files: 38 flowcharts, 1 sequence |
| Synthetic corpus | 14 diagrams, 9 diagram families plus syntax/layout variants |
| Render acceptance | Both engines rendered 53/53, including 39/39 vault diagrams |
| Vault speed ratio | 106.9× ratio of total median times; median per-diagram ratio 143.5×; range 44.7–256.6× |
| All-case speed ratio | 110.4× ratio of total median times; range 32.4–289.6× |
| Full global bundles | Pele 709,352 bytes; Mermaid 5,493,176 bytes (7.74×) |
| Gzip bundles | Pele 266,350 bytes; Mermaid 1,583,461 bytes (5.95×) |
| Responsive `mount()` | 1000 → 320 → 1000px; flowchart viewBox 463×152 → 241×308 → 463×152 |
| Local tests | 56 passed, including 11 hostile SVG cases, 24 typography cases, and 4 safety-control/guard tests; 1 positive-control request intercepted and aborted, 0 requests intercepted from Pele fixtures |
| Upstream targeted tests | 69 passed; upstream TypeScript check passed |
| Dependency audit | Preview production dependencies: no reported advisories. Lab development tree: 1 low KaTeX advisory through Mermaid |

The corrected safety checks supersede the initial CSP-protected request count.
CSP can block a request before Playwright routing observes it. Without CSP, the
synthetic SVG stylesheet `@import` control produced exactly 1 intercepted and
aborted request. With CSP, the regression observed 1 policy violation and 0 route
interceptions. The former attribute-only guard accepted that SVG; the new guard
rejects it. This establishes a test evidence gap, not a Pele vulnerability.

The guard now inspects stylesheet contents, style attributes, and 10 paint/reference
attributes, including escaped CSS imports and URLs. It permits resolved local
fragment references and rejects external or unresolved ones. All 11 Pele fixtures
passed this guard and produced 0 route interceptions without CSP during the
bounded test observation. The focused safety run passed 17 tests. These checks
are not a general SVG/CSS sanitizer or proof that all SVG inputs are inert.

Environment: macOS arm64, Node 24.22.1, pnpm 11.28.8, Chrome 155.0.8059.86.
The comparison times render + SVG insertion + layout after warm imports. It uses
5 alternating passes, 30 repetitions for Pele and 1 for Mermaid, then reports the
median per diagram. Import/startup, installation, and CLI worker overhead are
excluded. This is one machine and one run, not a general 100–500× guarantee.

Acceptance is not visual or semantic equivalence. Layout, spacing, themes, HTML,
math, and interaction differ. In the public subgraph case, Pele retains the
internal vertical direction while Mermaid lays out the connected graph across.
Pele displays TeX source unless a math resolver is supplied. Mermaid theme colors
do not transfer to Pele's CSS-variable system.

Raw aggregate SVG text is not a semantic comparator. Line wrapping, DOM order,
and Pele's text halos can change or repeat text without changing a visible label.
Inspect the public gallery and review representative private diagrams locally.
The responsive check covers one flowchart; it does not establish readability for
all diagram types on a phone.

## Creator-update experiments

The [October 24 update](https://x.com/kepano/status/2113990622168367440)
adds math resolvers, Sankey gradients, subgraph routing, and rich label styles.
The [October 23 typography post](https://x.com/kepano/status/2113610353385120110)
quotes Francois Laberge's font-size experiment. Both full threads were retrieved;
the public syndication endpoint alone truncated the October 24 post.
The [adoption reply](https://x.com/kepano/status/2113997277216002162) lists apps.
These are creator-reported integrations, not independently verified installations.

`pnpm test` also writes synthetic-only `results/features.json` and
`results/typography.html`:

- **Typography:** 3 diagrams × 2 container widths (1000, 390) × 4 requested
  font sizes (12, 16, 24, 32), in a 390×844 Chrome viewport. All 24 SVGs fit their
  containers. No measured text bounding boxes extended outside their viewBoxes.
  The 32px sequence case still scaled from 401px to 390px; its smallest measured
  text became 27.2px. Requested font size is not always effective font size.
- **Rich text:** subscript/superscript baseline shifts, monospace code/kbd,
  underline/ins, and italic cite become SVG text styles, not arbitrary HTML.
- **Math:** an actual `katex@0.19.1` resolver, with `trust: false`, produced native
  MathML without external fonts. Its SVG uses `foreignObject`, which sanitizers
  can remove. The test also confirms that Pele trusts resolver markup. The CLI
  still supplies no math resolver. No MathJax, Temml, Safari, or iOS run was made.
- **Sankey:** 2 diagrams produced 6 gradients. All local paint references resolved,
  their IDs were unique, and CSS series-color changes updated the stops. Without
  an ID prefix, Pele intentionally uses flat colors. Give each embedded diagram
  a distinct prefix; `mount()` normally supplies one automatically.
- **Subgraphs:** the typography matrix includes connected clusters. It checks
  fit and text bounds, not crossing counts. No earlier Pele release was timed or
  compared, so the post's week-over-week performance and crossing claims remain
  unverified here.

Text-bounds measurements do not prove that text avoids every other node or edge,
or that a diagram is easy to read. The HTML reports are static snapshots, not
live renderers. They contain only synthetic inputs and use no CDN or private data.

## Pinned sources

- [Pele source](https://github.com/obsidianmd/pele/tree/4eff76f98c73b6817800a05773517f35832e4e92),
  npm `pele@1.10.0`. The registry's SLSA provenance payload names the same commit;
  that payload was inspected, not independently cryptographically verified.
- [Pele compatibility](https://pele.run/compatibility),
  [security](https://pele.run/security), [API](https://pele.run/api).
- [Mermaid 12.1.0 source](https://github.com/mermaid-js/mermaid/tree/21f72f07ea22c0af48a3149c550654e80d8e40cb).
- [Obsidian 1.15.0 release notes](https://obsidian.md/changelog/2026-10-22-desktop-v1.15.0/):
  Pele integration is in **early access**, dated October 22. The public stable
  release manifest still listed 1.14.5 on October 24.

Pele's `LICENSE` is MIT (with an ISC notice for its Lucide reset icon). Its package
has no runtime dependencies. Development dependencies are a separate surface:
the upstream source checkout audit reported 7 development-tree advisories
(2 moderate, 5 high). No audit fixes or upstream changes were applied.

Re-evaluate a future version explicitly. Do not replace official validation,
change Obsidian settings, or auto-update the pin based only on benchmark results.
