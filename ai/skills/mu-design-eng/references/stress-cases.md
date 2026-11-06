# Realistic worst-case UI catalog

Use with [stress-test.md](../playbooks/stress-test.md). Choose plausible values or actual schema limits, not random nonsense. Record limits and frontend/backend disagreement. Use reserved example domains and inert local fixtures; do not contact the addresses or fetch arbitrary external test resources.

## People and names

| Value | What it tests |
| --- | --- |
| `Aleksandra Wiśniewska-Kowalczyk` | Long hyphenated name, wrapping, diacritics |
| `Christopher Alexander Montgomery III` | Suffix handling; initials policy must not accidentally select the suffix |
| `Konstantin Oberhauser-Wettstein` | Compound surname in a single-line slot |
| `Jo` / `J` | Short names, single-character fallback, undersized name-only target |
| `Ólafur Darri Ólafsson` | Accented initial and case/sort behavior |
| `Đặng Thị Ngọc Hân` | Tall Vietnamese diacritics and clipping |
| `王秀英` | CJK without spaces; initials cannot assume Western word structure |
| `نور الهدى عبد الرحمن` | RTL text, punctuation, icon order, `dir="auto"` |
| `Seán O'Brien-Ó Súilleabháin` | Apostrophes, accents, escaping, search |
| `María José de la Cruz y Fernández` | Particles and ambiguous surname/initials assumptions |
| `dana` | Lowercase source and display casing policy |
| `🦊 Fox` / `👩🏽‍💻 Priya` | Surrogate pairs and multi-codepoint grapheme clusters |
| `  Sam   Lee ` | Leading/trailing/repeated spaces |
| Missing name, email only | Accessible fallback identity |

Initials are a product/localization policy, not universally first-plus-last. Use grapheme-aware extraction such as `Intl.Segmenter` where supported; do not split emoji or assume every person has two names. A fallback icon can be more honest than invented initials.

## Emails, URLs, identifiers

| Value | What it tests |
| --- | --- |
| `bartholomew.fitzgerald@northwind-industries-holdings.example.com` | Long unbroken address pushes trailing actions away |
| `a@b.test` | Short address; no layout dependence on long metadata |
| `first.last+billing-notifications@example.com` | Plus-addressing and meaningful local part |
| `ops@sub.department.region.example.co.uk` | Nested domain parsing; use as inert text only |
| `https://example.com/workspaces/acme/projects/q3-launch/docs/9f8e7d6c5b4a?tab=comments&filter=unresolved` | Long URL and suffix distinctions |
| `9f8e7d6c-5b4a-4c3d-8e2f-1a0b9c8d7e6f` | UUID width and middle truncation |
| `Q3 Board Deck — FINAL (revised) v12 [approved by legal].pdf` | Filename version/extension visibility |
| `IMG_20250914_183022_HDR_portrait_edited_edited.HEIC` | Unbroken filename and uppercase extension |
| `@a` / `@thisisaverylongusernamethatisallowed` | Handle extremes, subject to real schema limits |

For domains beyond the reserved `.test`, `example.com`, or `example.org` shapes, keep fixtures inert or substitute a reserved-domain equivalent before wiring actions.

## Labels, titles, and data copy

| Value | What it tests |
| --- | --- |
| `Senior Product Design Engineer, Platform Infrastructure` | Multi-line secondary title |
| `Invitation expired 12 days ago` | Long badge competing with primary text |
| `Benachrichtigungseinstellungen` | German compound without spaces |
| `Paramètres de confidentialité et de sécurité` | Translation expansion |
| Twelve tags: `design`, `frontend`, `q3`, `urgent`, `needs-review`, etc. | Wrapping wall; overflow summary such as `+8` |
| `customer-feedback-from-enterprise-onboarding` | Single tag wider than container |
| `Untitled`, empty string, whitespace-only | Missing title and collapsed heading |
| Literal `<script>alert(1)</script>`, `&amp;`, `**bold**` | Correct escaping layer; render as text, never execute |
| `Line one\nLine two` with an actual newline | Single-line fields receiving multi-line data |
| Plausible 2,000-character pasted description, or actual maximum | Clamp, expansion, textarea growth |

## Numbers and money

| Value | What it tests |
| --- | --- |
| `0` / `1` | Empty state, pluralization, divide-by-zero guards |
| `1284` / `1000000` | Locale separators and badge width; compact form only when precision is not needed |
| Currency `12345678.9` | Formatted total such as `$12,345,678.90` |
| `-42.5` | Sign, accounting style, color-independent meaning |
| `0.1 + 0.2` | Floating-point display artifacts |
| `142%` / `-3%` | Out-of-range meters; separate displayed value from bounded geometry |
| `null`, `undefined`, `NaN` | Explicit unavailable/error state rather than raw output |
| 1284 formatted in `de-DE` and `en-US` | `1.284` versus `1,284` |
| Live `99` → `100` | Width jump and alignment; tabular digits |

Use `Intl.NumberFormat` and localized plural messages/`Intl.PluralRules`. Do not silently coerce missing values to zero. Do not truncate amounts, numbers, dates, or comparison values.

## Collections

- Zero items: distinguish genuinely empty from filtered no-results.
- One item: singular copy, grids, and “1 of 1.”
- Exactly page size and page size + 1: pagination/off-by-one behavior.
- Realistic upper bound; 1,000+ unpaginated items when the contract permits: render time, memory, scrolling, count copy.
- One item ten times larger than peers: row/card growth.
- Identical names: secondary identity and stable keys.

## Time

| Value | What it tests |
| --- | --- |
| Now | “Just now” or localized zero-unit policy |
| 12 days, 11 months, 3 years ago | Relative/absolute thresholds defined by the product |
| Future date | “In 3 days,” not negative “ago” |
| `1970-01-01` | Real historical date versus accidental zero-timestamp fallback |
| `2025-12-31T23:30:00-08:00` | Different calendar day across timezones |
| `1,284 hours` | Long-duration unit rollover |

Use `Intl.RelativeTimeFormat` and `Intl.DateTimeFormat`. Fix the test clock/timezone when reproducibility matters. Do not impose a universal “absolute after a week” policy.

## Images and media

- Local stub returning 404, missing avatar, and repeated image failure: stable fallback with no retry loop.
- 4000×200 panorama and 200×4000 portrait: cropping versus distortion, aspect ratio, card height.
- Transparent logo and dark logo on dark background: visibility and contrast.
- Delayed image: reserved dimensions/aspect ratio and layout shift.

Choose `object-fit: cover` for intentional crop, `contain` when the whole asset matters. Preserve alt text and decorative-image semantics.

## States

- Loading: stable skeleton/spinner geometry and understandable status.
- API error: useful recovery rather than raw stack/error output.
- Partial data mixed in one list: alignment and optional-field behavior.
- Every enum state: active, invited, expired, suspended, and actual project variants.
- No permission: hidden/disabled actions with correct layout and explanation.
- Current user: “You” label and self-action restrictions.

## Environment matrix

| Condition | What it reveals |
| --- | --- |
| Real container width, including a 280px sidebar where applicable | Full-page assumptions in reused components |
| 320px viewport/container and supported widest layout (e.g. 2560px) | Overflow, stranded content, excessive line length |
| 200% browser zoom and large-text settings | Fixed-height clipping, reflow, inaccessible controls |
| Supported dark mode | Hardcoded colors, borders, media visibility |
| Supported RTL, mixed-direction strings | Logical spacing, chevrons, trailing actions |
| Touch, keyboard, focus-visible | Hover-only or pointer-only actions |
| Reduced motion | Hidden starting state or feedback dependent on animation |

Use [mobile.md](mobile.md) for hardware-only touch/keyboard/chrome checks. Unsupported modes can be exploratory tests, but label them rather than claiming a project requirement.

## Failure signatures and candidate fixes

| Visible failure | Likely cause | Candidate fix and tradeoff |
| --- | --- | --- |
| Avatar/icon becomes an oval | Flex shrink | `flex-shrink: 0` on fixed-size media |
| Text refuses to shrink/wrap | Flex/grid automatic minimum | `min-width: 0`; grid `minmax(0, 1fr)` |
| Email/URL escapes its row | Few line-break opportunities | `overflow-wrap: anywhere` on that field |
| Trailing menu is unreachable | Middle column consumes width | Shrinkable middle, nonshrinking action; reflow when all content cannot fit |
| Badge wraps unexpectedly | Competing widths | `white-space: nowrap; flex-shrink: 0` only if another area can yield; otherwise redesign wrapping |
| Avatar floats beside three-line name | Center alignment across variable heights | Top-align when appropriate |
| Last row clips mid-glyph | Fixed height and unclear overflow | Correct scrolling/height with a visible affordance; a fade alone does not expose content |
| Heading breaks every word | `word-break: break-all` | Normal wrapping plus `overflow-wrap: anywhere` when needed |
| Broken initials or replacement glyph | Code-unit slicing or cultural assumptions | Grapheme-aware, localized policy or fallback icon |
| Orphaned dash/empty role line | Optional field always rendered | Omit or intentionally reserve space |
| “1 members” | Hardcoded plural | Localized count messages |
| Jittering number columns | Proportional digits | `font-variant-numeric: tabular-nums` and stable layout |
| Raw `NaN`/undefined/unformatted decimals | Missing formatting/guards | Validate and use locale-aware number formatting |
| Translated action label overflows | Fixed button width | Content-based size with minimum, wrapping or responsive layout |
| Diacritics/scripts clipped | Tight line-height and overflow | Adequate line-height; avoid text clipping |
| Broken image icon | Missing fallback | Safe on-error fallback and correct fit |
| Ellipsis hides required identity | No full-value route | Wrap, expand, copy, or accessible detail view; native `title` alone is insufficient on touch/keyboard |
| Large list scrolls poorly | Every row rendered or expensive row work | Profile, then paginate or virtualize with accessibility preserved |
| Wrong literal markup/entities | Wrong escaping layer | Escape once at the render boundary; rich text needs an approved sanitizer/parser |

## Wrap, truncate, or clamp

Choose per field:

- **Wrap** names/titles needed to identify an item, especially in detail views. Many lines may signal insufficient width.
- **End-truncate** secondary metadata when its beginning is meaningful, with a full-value access route.
- **Middle-truncate** filenames, paths, hashes, or emails whose distinct portion is near the end; preserve both ends deliberately.
- **Clamp** multi-line previews, such as a two-line card description, with access to full content.
- **Keep full** amounts, dates, numbers, and values compared across rows.

Every tested case needs a result: held, observed break, inferred risk, blocked, or not applicable with a reason. A screenshot alone does not test focus, reachable actions, escaping safety, or scrolling performance.
