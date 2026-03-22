# cmux_browser audit and hardening

**Status:** Ready for task breakdown
**Date:** 2026-03-22
**Scope:** `cmux_browser` only in `~/.dotfiles/pi/packages/pi-cmux`
**Target environment:** local macOS + cmux setup
**Total effort:** M

## Discovery

**Explored**
- `extensions/tools.ts`
- `extensions/cmux-client.ts`
- `CLAUDE.md`
- `README.md`
- `cmux-guide.md`
- upstream cmux capabilities + browser docs/tests in `~/.dotfiles/.context/opensrc/cmux/...`

**Key findings**
- Three advertised actions are currently broken due to contract drift between `pi-cmux` and cmux:
  - `eval`
  - `get_text`
  - `is_visible`
- Many browser actions can falsely report success because cmux API errors are collapsed to `null`, then tool handlers substitute optimistic fallback text such as `Clicked`, `Filled`, or `Element found`.
- The current browser tool intentionally exposes a **small** subset of cmux browser capabilities. Expanding to full agent-browser parity is unnecessary for this local fix and conflicts with the repo preference for a small tool surface.
- For repeatable local smoke testing, `file://` fixtures are more reliable than `data:` URLs on this setup.

## Current audit matrix

Happy-path checks were run against:
- `https://support.nabucasa.com/hc/en-us/articles/28699323695389-Using-Home-Assistant-Voice-Preview-Edition`
- local fixtures: `file:///tmp/cmux-browser-fixture.html`, `file:///tmp/cmux-browser-fixture-2.html`

| Action | Happy path | Failure transparency | Evidence / note |
|---|---|---|---|
| `open` | Pass | At risk | Opened support page and file fixture successfully. Handler currently falls back to success text on `null`. |
| `navigate` | Pass | At risk | Navigated fixture 1 → fixture 2. Handler currently falls back to success text on `null`. |
| `snapshot` | Pass | Partial | Returns useful tree + refs. Transport/API failures still collapse to generic `did not respond`. |
| `click` | Pass | Fail | `#btn` worked. `#does-not-exist` returned `Clicked`. |
| `fill` | Pass | Fail | `#name` filled successfully. `#does-not-exist` returned `Filled`. |
| `eval` | Fail | Fail | Returned generic timeout-style text. Raw cmux expects `script`, not `code`. |
| `screenshot` | Pass | Partial | Screenshot path returned successfully. Transport/API failures still need honest reporting. |
| `get_text` | Fail | Fail | Returned generic timeout-style text. cmux method is `browser.get.text`, not `browser.get_text`. |
| `get_url` | Pass | Partial | Returned correct support/file URLs. |
| `wait` | Pass | Fail | Existing selectors worked. `#does-not-exist` returned `Element found`. |
| `back` | Pass | At risk | File fixture history worked. Handler currently falls back to success text on `null`. |
| `forward` | Pass | At risk | File fixture history worked. Handler currently falls back to success text on `null`. |
| `reload` | Pass | At risk | Reloaded file fixture. Handler currently falls back to success text on `null`. |
| `press` | Pass | At risk | Sent `Tab`. Handler currently falls back to success text on `null`. |
| `scroll` | Pass | At risk | `body` scroll with selector worked. Current tool contract intentionally requires `selector`. |
| `find_role` | Pass | Partial | `role=button` returned a selector/ref successfully. |
| `is_visible` | Fail | Fail | Returned generic timeout-style text. cmux method is `browser.is.visible`, not `browser.is_visible`. |

## Problem statement

**Who:** the local user running Pi inside cmux on this machine.

**What:** `cmux_browser` is not trustworthy enough for daily use. Some actions are hard-broken, while others hide real cmux failures behind fake success messages.

**Why it matters:** browser automation is only useful if the tool contract is honest. False positives are worse than explicit failures because they mislead both the user and follow-up agent sessions.

**Evidence:** live tool exercise on 2026-03-22 plus raw socket verification against `system.capabilities` and direct browser method calls.

## Constraints inventory

- Keep scope to `cmux_browser` only.
- Optimize for the local dotfiles setup, not a generalized release.
- Do **not** broaden the tool surface without clear need.
- Preserve graceful degradation when cmux is unavailable.
- Prefer small, surgical changes in `pi-cmux` over cmux-core changes.
- Preserve the current user-facing tool action names where possible (`eval` still accepts `code`; `get_text` and `is_visible` remain action names).

## Solution space

| Option | What it does | Pros | Cons |
|---|---|---|---|
| Simplest patch | Fix only the 3 broken mappings | Fastest | Leaves false-success behavior intact; tool remains untrustworthy |
| **Balanced hardening (recommended)** | Fix broken mappings **and** make error reporting truthful; add a repeatable local smoke matrix | Restores trust without broadening scope | Small refactor in request/result handling |
| Full parity expansion | Expose the broader cmux browser API families | Powerful long-term | Unnecessary scope expansion for this local need |

## Recommendation

Take the **balanced hardening** approach:
1. Correct the existing `cmux_browser` action-to-cmux mappings.
2. Preserve cmux API errors instead of flattening them to `null`.
3. Remove optimistic success fallbacks that convert failures into fake success.
4. Commit a small, repeatable local smoke matrix using checked-in file fixtures or equivalent documented fixtures.

This keeps the current tool surface intact while making it reliable enough for follow-up implementation sessions.

## Scope & deliverables

| Deliverable | Effort | Depends On |
|---|---:|---|
| D1. Fix browser contract drift for current actions | S | - |
| D2. Make browser tool output truthful on cmux/API/transport failures | M | D1 |
| D3. Add repeatable local smoke validation + matrix documentation | S | D1, D2 |

### D1. Fix browser contract drift for current actions

Likely files:
- `extensions/tools.ts`

Required changes:
- Map `cmux_browser(action="eval", code=...)` to `browser.eval` with `{ script: ... }`.
- Map `get_text` to `browser.get.text`.
- Map `is_visible` to `browser.is.visible`.
- Keep the public action names stable; this is an internal routing fix, not a surface expansion.

### D2. Make browser tool output truthful on cmux/API/transport failures

Likely files:
- `extensions/cmux-client.ts`
- `extensions/tools.ts`

Required changes:
- Distinguish **transport failure** from **cmux API error**.
- Preserve cmux error payloads (`code`, `message`, optional `data`) through the client/tool boundary.
- Remove `result ?? "Clicked"` / `"Filled"` / `"Element found"` style fallbacks when the result is actually an error or transport null.
- Standardize browser tool output so failures are explicit and debuggable.

Recommended response model:

```ts
// Shape, not exact implementation
null                         // transport unavailable / socket timeout
{ ok: true, result: any }    // successful cmux response
{ ok: false, error: { code: string; message: string; data?: any } } // cmux API error
```

Tool formatting rules:
- `null` => explicit transport failure text
- `ok: false` => explicit cmux error text
- `ok: true` => format `result`

### D3. Add repeatable local smoke validation + matrix documentation

Likely files:
- `specs/cmux-browser-audit-and-hardening.md`
- `README.md` or a dedicated validation note
- optional local fixture files if the implementation chooses to check them in

Required changes:
- Capture the happy-path matrix for all current `cmux_browser` actions.
- Capture at least the critical negative cases:
  - missing selector for `click`
  - missing selector for `fill`
  - nonexistent selector for `wait`
  - broken actions previously fixed in D1
- Prefer `file://` fixture pages for deterministic local testing.
- Keep the validation artifact lightweight and local-first.

## Non-goals

- Exposing the full cmux browser API (`browser.get.*`, `browser.find.*`, `browser.is.*`, etc.) beyond what the current tool already advertises.
- Changing cmux-core behavior.
- Cross-machine or release-grade compatibility work.
- Adding a large test harness or build system.
- Redesigning the workspace or notification tools.

## Data model

The current ambiguity comes from overloading `null` to mean too many things. The hardened contract should separate:

- **Transport unavailable**: cmux socket cannot be reached or a request times out before any structured response.
- **cmux API error**: cmux replied with `ok: false` and an error payload.
- **Success**: cmux replied with `ok: true` and a result payload.

Internal routing contract for the existing public tool surface:

| Public tool action | Current public params | cmux method | cmux params |
|---|---|---|---|
| `eval` | `code` | `browser.eval` | `script` |
| `get_text` | `selector` | `browser.get.text` | `selector` |
| `is_visible` | `selector` | `browser.is.visible` | `selector` |

## API / interface contract

### Public tool contract to preserve

Keep these existing public action names unchanged:
- `open`
- `navigate`
- `snapshot`
- `click`
- `fill`
- `eval`
- `screenshot`
- `get_text`
- `get_url`
- `wait`
- `back`
- `forward`
- `reload`
- `press`
- `scroll`
- `find_role`
- `is_visible`

### Failure contract to enforce

For every browser action:
- Invalid params must surface as an explicit error.
- Unknown cmux methods must surface as an explicit error.
- Selector/timeouts/not_found failures must surface as explicit errors.
- Transport failures must **not** be reported as success.

Examples:
- `click("#does-not-exist")` must not render `Clicked`.
- `wait("#does-not-exist")` must not render `Element found`.
- `eval("document.title")` must return the actual title, not a generic timeout message.

## Acceptance criteria

- [ ] `eval` succeeds on the local fixture and returns `cmux-browser-fixture`.
- [ ] `get_text` succeeds on the local fixture and returns `hello` from `#status` after fill+click.
- [ ] `is_visible` succeeds on the local fixture and returns `false` for `#hidden` and `true` for a visible element.
- [ ] The previously working happy-path actions still work: `open`, `navigate`, `snapshot`, `click`, `fill`, `screenshot`, `get_url`, `wait`, `back`, `forward`, `reload`, `press`, `scroll`, `find_role`.
- [ ] `click`, `fill`, and `wait` no longer report success on nonexistent selectors.
- [ ] Browser action failures distinguish transport failure from cmux API error.
- [ ] The repo contains a lightweight local validation note or artifact documenting the pass/fail matrix and fixture flow.

## Test strategy

| Layer | What | How |
|---|---|---|
| Manual integration | Happy-path browser actions | Run the current action matrix against checked-in or documented `file://` fixtures and the Nabu Casa support page |
| Manual negative smoke | Error truthfulness | Verify missing/nonexistent selector cases for `click`, `fill`, `wait`; verify broken-action regressions for `eval`, `get_text`, `is_visible` |
| Low-level contract probe | cmux request/response semantics when behavior is ambiguous | Use a tiny direct socket script (`uv run python` or equivalent) against `CMUX_SOCKET_PATH` to inspect raw `ok/error` payloads |

## Risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---:|---|
| Fixing only the 3 broken mappings leaves false positives in place | High | High | Treat error transparency as first-class, not optional |
| Local browser state makes tests flaky | Medium | Medium | Use dedicated file fixtures and fresh browser surfaces for smoke runs |
| Scope expands into full browser parity | Medium | Medium | Keep parity expansion as an explicit non-goal |
| cmux core changes method names/semantics again | Low | Medium | Validate against `system.capabilities` + upstream docs/tests before finalizing |

## Trade-offs made

| Chose | Over | Because |
|---|---|---|
| Correctness and honesty | Minimal patch-only fix | A truthful tool is more valuable than a superficially passing one |
| Small-surface hardening | Full parity expansion | Local instructions prefer not broadening the tool surface without need |
| `file://` fixture validation | `data:` URL-only smoke tests | More deterministic on this local setup |

## Open questions

- [ ] Optional follow-up: should `wait` gain a bounded timeout parameter for better local debugging? → Owner: future implementation session

## Success metrics

- All 17 currently advertised `cmux_browser` actions have an honest, documented status on the local setup.
- The 3 currently broken actions (`eval`, `get_text`, `is_visible`) are repaired.
- Zero false-success outputs remain in the audited negative cases.
- A follow-up implementation agent can execute the local smoke matrix without rediscovering method-name or error-reporting drift.

---

## Handoff summary

1. **D1 — Fix browser contract drift** (S)
   - Depends on: -
   - Likely files: `extensions/tools.ts`

2. **D2 — Make browser failures truthful** (M)
   - Depends on: D1
   - Likely files: `extensions/cmux-client.ts`, `extensions/tools.ts`

3. **D3 — Add local smoke validation artifact** (S)
   - Depends on: D1, D2
   - Likely files: `specs/cmux-browser-audit-and-hardening.md`, `README.md`, optional fixture/docs files

**Key technical decisions**
- Preserve the existing public action names; fix routing internally.
- Separate transport failure from structured cmux API errors.
- Do not expand the browser tool surface in this pass.

**Status:** Ready for task decomposition
