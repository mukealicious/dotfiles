# Stress-test realistic UI data

Use to break a component or screen with plausible worst-case data. Test the existing design, not a redesigned version. Default output is a fixture/demo plus findings, then stop before repairs. If the user requests review-only or the environment forbids edits, keep all inspection read-only and return the fixture proposal instead.

Read [stress cases](../references/stress-cases.md) after mapping the rendered fields. Read [verification](../references/verification.md) before recording results. A stress-test request authorizes the needed local/dev-only test surface, not production data changes, privileged helpers, unapproved services or network exposure, package installation, or unrelated fixes. Ordinary project dev-server startup is allowed when the current task and harness authorize it.

## 1. Map every rendered value

Inspect component/callers, existing fixtures/mocks, types, validation schema, API contract, database limits, and form attributes where available.

| Field | Source | Type | Limit / evidence | Optional? |
| --- | --- | --- | --- | --- |
| `name` | `member.name` | string | 255, `schema.ts:14` | No |
| `email` | `member.email` | string | No bound found | No |
| `role` | `member.title` | string | 120, schema location | Yes |
| `count` | `workspace.memberCount` | integer | Contract range or unknown | No |

Include header counts, relative timestamps, status/badge text, data-driven button labels, tooltips, avatar/media, and collection length. Record frontend/backend disagreement: an input's 50-character limit does not constrain imports into a 255-character API field.

**Complete when:** every rendered value has a source and a real limit, “no bound found,” or an explicit unavailable-contract caveat. Do not claim unbounded storage merely because one schema could not be inspected.

## 2. Build plausible worst cases at the data boundary

Use all applicable categories from the catalog: people, identifiers, copy, numbers, collections, time, media, states, and environment. Match the fixture type and existing conventions. Prefer realistic strings or schema-backed maxima over repeated nonsense characters.

Create a mixed worst-case dataset so early visible rows cover distinct failures: long name, long email, single-letter name, missing avatar, missing role, and different statuses. Do not put every extreme into row 1. Also prepare separate Empty, One, and Huge cases; these cannot be represented by one mixed dataset. Use 1,000+ rows only where plausible for the actual unpaginated contract, and label invalid-contract resilience tests separately.

Change fixtures, props, mocks, or API stubs—not the component markup/CSS—to produce failures. Use local, inert media stubs and reserved addresses. Never write these values to production data.

**Complete when:** each applicable catalog case has a fixture value/state, source rationale, and expected failure signature to inspect. In review-only mode, return the exact proposed fixtures without writing files.

## 3. Provide a dev-only comparison surface

When test-surface edits are authorized, add **Demo data / Worst case** at the existing fixture boundary. Add **Empty / One / Large list** states as needed. Persist the selection in a local prototype URL or existing dev harness so reloads reproduce the case.

Keep the control neutral and outside the component's layout. A bottom-center overlay can work only if it does not obscure actions, safe areas, or the software keyboard; prefer the existing harness chrome when available. Switching fixtures is instant so the toggle does not introduce a motion confound. The switch needs keyboard labels and focus behavior.

Gate the harness behind the repository's actual development mechanism or isolate it in a nonproduction prototype route. For a standalone authorized demo, a self-contained HTML file can hold the component and fixtures. Use an existing development environment or start the ordinary project dev server when the current task and harness authorize it. Do not introduce privileged helpers or unapproved services/exposure. Claim a running URL only after verifying that it is served.

**Complete when:** the same component receives each dataset through its normal boundary, the selection is reproducible, and the harness cannot ship accidentally. Confirm the production exclusion mechanism from configuration rather than assuming a filename is enough.

## 4. Test the matrix

Inspect each fixture at its real container width, at 320px, and at the widest supported layout. A component in a 280px sidebar must be tested there, not only full-page. Test 200% browser zoom or large text, supported dark mode and RTL, touch/keyboard reachability, and relevant reduced-motion states.

Use [mobile](../references/mobile.md) for physical-device keyboard, safe-area, and scroll checks. Capture comparable Demo/Worst screenshots where browser tooling permits. Check DOM/focus/interaction in addition to images. Without a browser, clearly label CSS-based conclusions as inferred.

Use the catalog's failure-signature table to identify likely causes. Choose wrap, truncate, clamp, or reflow per field. Full-value access must work on keyboard/touch; a native `title` tooltip alone is not enough. Never hide comparison-critical amounts/dates behind ellipsis.

**Complete when:** every applicable catalog category, fixture, width, and environment has a recorded result: held, observed failure, inferred risk, blocked, or not applicable with a reason. Every failure has a reproducible value/state, cause or hypothesis, proposed remedy, and `file:line`.

## 5. Report and stop

### What broke

| # | Severity | Location / field | Worst-case value or state | What happens / evidence | Proposed fix |
| --- | --- | --- | --- | --- | --- |

Use **Broken** for unreadable/wrong content or unreachable actions, **Ugly** for visible defects without loss of use, and **Fragile** for a realistic but not yet observed failure risk. An unknown limit alone is a robustness question, not automatic permission to add a backend constraint.

### Decisions needed

List choices with more than one valid answer: wrap versus truncate, missing-role treatment, pagination versus virtualization, supported contract limits. Recommend one with the tradeoff.

### What held up

List tested cases that already work, plus the evidence gaps. Give the harness path or existing URL, its states, and whether anything is actually running. Stop before repairing component code unless fixes were explicitly included in the request.

**Complete when:** the user can reproduce each finding and choose repairs without guessing which results were observed.

## 6. Repair only the authorized findings

On an explicit fix request, apply the selected fixes with project conventions. If “test and fix” was already authorized, fix unambiguous in-scope defects after reporting; stop for consequential design choices. Re-run every fixture, including Demo, because a worst-case fix can regress normal content.

Retain useful fixtures as regression coverage in the authorized dev/test location. Keep the toggle dev-only. Remove temporary scratch artifacts unless the fixture/demo is an agreed deliverable; do not remove unrelated user work.

**Complete when:** each authorized finding is resolved or clearly blocked, Demo and all edge states still work, and the report identifies exact validation performed.

## Data-only branch

For “data only,” complete the field map, fixtures, and authorized dev-only switch without inventing visual findings. State explicitly that no rendering verdict was produced.
