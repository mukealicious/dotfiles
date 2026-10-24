# Design copy quality fixture

Status: experimental, manual, advisory only. No installer or skill projection changes.

This is one executable feedback loop beside the existing `impeccable` skill, not a
replacement skill. It covers one mechanical subset of redundant copy. It does not
decide whether arbitrary text is useful, infer product policy, or shorten text.

## Run locally

```sh
node --check ai/design-quality/copy-duplicate-descriptions.mjs
node --check ai/design-quality/serve-copy-fixture.mjs
node --test ai/design-quality/serve-copy-fixture.test.mjs
node ai/design-quality/serve-copy-fixture.mjs
```

Open the printed loopback URL in a real browser. The page must show `PASS` and
`window.copyFixtureResult.failures` must be empty. Check the console. Click
**Show reviewed after state**: the 2 warnings must disappear, while units, date
format, compatibility limits, and the loss warning stay. Check at compact and wide
viewports. Stop the server with Ctrl-C.

The Node test verifies the server's allowlist and HTTP behavior. The browser
fixture verifies the copy rule on a real DOM; the Node test does not replace it.

The server binds only `127.0.0.1`, chooses an unused port, and serves exactly 2
allowlisted files. It does not expose the repository, call models, load packages,
or upload page content. No dependency or global installation is required.

## Use on a local app

Import `findDuplicateDescriptions` into a local browser test or a local app's
existing development bundle, then call `findDuplicateDescriptions(document)`.
The module has no dependencies or side effects and returns structured findings:

```js
import { findDuplicateDescriptions } from './copy-duplicate-descriptions.mjs';
const findings = findDuplicateDescriptions(document);
// [{ ruleId, controlId, descriptionId, current, message }]
```

Do not add this module to a production bundle just to run a review. Integration
into another repository, its bundler, and its test runner remains project-owned.
The fixture is executable without that integration.

## Rule: `copy/duplicate-linked-description`

Scope: native inputs, selects, and textareas with unique IDs, exactly 1 plain
explicit label, and plain `aria-describedby` targets. Only whitespace is
normalized. Case, punctuation, units, and other characters must match exactly.

The check skips complex markup, ARIA naming overrides, custom roles, live
regions, ambiguous IDs, multiple labels, and the label itself as a description.
A missing reference is not a copy finding. This is not an accessibility audit
or an implementation of the accessible-name computation algorithm. An empty
result means no supported exact repetition was found, not that the UI passes.

Every result needs review. There is **no autofix**. Check all consumers before
removing a shared description. Remove its ID reference from each affected control
only when justified. Keep accessible names, units, scope, consequences, and state
feedback intact. Re-run the check and the application's accessibility tests.

Bad/good example: `Retry limit` with a linked `Retry limit` hint can lose the hint.
The separate linked `attempts` text stays. This is a proposed advisory check, not
a new mandatory global product standard.

## Regression method

The fixture asserts positive and negative cases on a real DOM, checks that the
checker does not mutate it, applies 2 explicitly reviewed fixture edits, and
checks protected copy and labels. A destructive mutant deletes the unit and must
fail the protected-copy invariant. The malformed negative cases live in detached
test documents; the visible demo shows only the first 6 valid scenarios.

This evaluates the check and its safety boundary. It does **not** measure agent
routing, semantic copy judgment, accessibility conformance, task completion, or
model improvement. It is not a baseline/with-skill model comparison. The fixture
is synthetic, not evidence of repeated failures in a real product.

## Evidence and adoption boundary

- [Rachel's clean-copy paste](https://paste.rachel.systems/ukogokijaz.md), read
  2026-10-24: decide whether copy should exist before rewriting it. Keep necessary
  consequences, compatibility, empty-state guidance, units, and formats. The
  `Retry limit` example informed the positive fixture. The wording is not vendored.
- [John Phamous, Teaching agents product design at Vercel](https://vercel.com/blog/teaching-agents-product-design-at-vercel),
  2026-06-25: separate judgment from deterministic checks; use stable rule IDs,
  before/after fixtures, source evidence, and human-reviewed updates. The article
  is a primary explanation, not a public release of Vercel's complete internal system.
- Local `ai/skills/impeccable/` retains upstream
  `pbakaus/impeccable@39bec7c08c8cb5d694221e2c2e4386140dde8759`. Its `SKILL.md`,
  `reference/clarify.md`, `reference/distill.md`, and `reference/ux-writing.md`
  already cover redundant copy. Keep those rules with their existing owner.

Update loop: preserve a real failing example, classify mechanical versus judgment,
add positive and negative regression cases, and ask a person to accept the rule or
reject adoption. Do not infer a general rule from 1 fixture. No scheduled evidence
collector, provider call, installer hook, or automatic rule promotion is included.
