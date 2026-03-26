# cmux_browser runtime focus and web-tool boundaries

**Status:** Ready for task breakdown
**Date:** 2026-03-22
**Scope:** `pi/packages/pi-cmux` plus one small Pi-specific routing instruction in `pi/instructions/appendix.md`
**Target environment:** local Pi + cmux + pi-parallel setup in `~/.dotfiles`
**Total effort:** M

## Discovery

**Explored**
- `pi/packages/pi-cmux/extensions/tools.ts`
- `pi/packages/pi-cmux/extensions/cmux-client.ts`
- `pi/packages/pi-cmux/README.md`
- `pi/packages/pi-cmux/CLAUDE.md`
- `pi/packages/pi-cmux/package.json`
- `pi/packages/pi-cmux/cmux-guide.md`
- `pi/packages/pi-cmux/specs/cmux-browser-audit-and-hardening.md`
- `pi/instructions/appendix.md`
- `pi/README.md`
- upstream cmux browser docs/tests under `~/.dotfiles/.context/opensrc/cmux/...`

**Key findings**
- `cmux_browser` is currently described too broadly as general browser automation. It does not clearly tell the agent when to use it versus `parallel_search` / `parallel_extract` / `parallel_research`.
- The existing browser wrapper already has reliability issues documented in `specs/cmux-browser-audit-and-hardening.md`: broken action mappings (`eval`, `get_text`, `is_visible`) and misleading error handling caused by collapsing cmux API errors into `null`.
- Browser snapshot output is currently too raw and token-heavy for quick agent inspection. Large `snapshot` payloads are dumped as generic JSON and truncated late, which is a poor default for the browser’s intended runtime/debug niche.
- The dotfiles setup already has three overlapping ways to touch the web:
  - `parallel_*` tools for public web discovery/extraction/research
  - `cmux_browser` for in-app browser automation
  - `agent-browser` as a CLI available in the shell / shared docs
- `pi/instructions/appendix.md` is the correct small-scope place for a Pi-specific routing rule without polluting shared cross-harness instructions.
- Upstream cmux already supports debug-relevant browser APIs beyond the current wrapper, including:
  - `browser.console.list`
  - `browser.console.clear`
  - `browser.errors.list`
  These strengthen the runtime/debug niche without overlapping with public-web reading.

## Problem statement

**Who:** the local user running Pi inside cmux in this dotfiles setup.

**What:** Pi currently has overlapping web-facing capabilities with weak boundaries. `cmux_browser` is advertised broadly enough that an agent may reach for it during public-web reading tasks that are better served by `parallel_extract`, while the browser wrapper is still not trustworthy enough for the localhost/authenticated/runtime-debug work it should own.

**Why it matters:** when multiple tools can all "sort of" browse the web, the agent spends turns choosing, retries the wrong abstraction, and produces noisier outputs. The browser tool should be the high-fidelity runtime source of truth for localhost, session-bound pages, visual validation, DOM/JS inspection, and console/error debugging — not a second general-purpose article reader.

**Evidence:** live HN browsing work on 2026-03-22, the existing `cmux-browser-audit-and-hardening.md` findings, current `cmux_browser` descriptions in `tools.ts`, and the presence of both `parallel_*` tools and `agent-browser` in this environment.

## Constraints inventory

- Keep the solution small and Pi-native. Less routing ambiguity is more important than broader capability.
- Do not introduce hidden delegation between tools. The agent should know which tool it is using.
- Preserve `cmux_browser` as the single Pi-native browser tool; do not add another browser abstraction layer in Pi.
- Preserve graceful no-op behavior when cmux is unavailable.
- Avoid turning `cmux_browser` into a public-web extraction tool. Public reading already has `parallel_extract` and manual Obsidian Web Clipper.
- Prefer the smallest possible instruction change: one short Pi-specific routing rule, not a large policy framework.
- Avoid broad agent-browser parity expansion. Only add narrowly scoped browser features if they reinforce the runtime/debug niche.

## Solution space

| Option | What it does | Pros | Cons |
|---|---|---|---|
| Smallest possible | Fix broken mappings + truthful errors only | Restores core trust quickly | Leaves routing ambiguity and noisy snapshot defaults intact |
| **Balanced runtime-focused approach (recommended)** | Fix reliability, re-scope browser positioning, add compact runtime-oriented outputs, add a tiny Pi routing rule, and expose only debug-specific console/error actions | Clear tool boundaries without bloat; strengthens the browser where it should win | Slightly broader than a pure bugfix |
| Full web-tool orchestration | Add smart routing, new higher-level web reader abstractions, or broad agent-browser parity | Powerful in theory | Violates repo preference for small deterministic systems; increases overlap and surprise |

## Recommendation

Take the **balanced runtime-focused approach**.

Keep exactly one Pi-native browser tool: `cmux_browser`. Narrow its role to **live rendered/runtime work**:
- localhost apps
- authenticated/session-bound pages
- visual inspection
- DOM/JS/runtime debugging
- browser console / page error inspection

Everything else should stay where it already fits best:
- `parallel_search` / `parallel_extract` / `parallel_research` own **public web discovery, reading, and synthesis**
- `bash` / `curl` own **APIs, raw files, and exact transport**
- Obsidian Web Clipper remains a **manual personal-capture workflow**, not an agent abstraction

This recommendation keeps the system simple:
1. harden the browser wrapper so it is trustworthy
2. make its outputs fit runtime debugging instead of article reading
3. teach the agent one tiny deterministic rule about tool boundaries
4. avoid adding another browser stack inside Pi

## Scope & deliverables

| Deliverable | Effort | Depends On |
|---|---:|---|
| D1. Harden `cmux_browser` contract and failure model | M | - |
| D2. Make browser output compact and runtime/debug-oriented | S | D1 |
| D3. Add narrowly scoped console/error browser actions | S | D1 |
| D4. Re-scope docs/tool descriptions and add a tiny Pi routing rule | S | D1 |
| D5. Update local validation docs for the new runtime-focused contract | S | D1, D2, D3, D4 |

### D1. Harden `cmux_browser` contract and failure model

Likely files:
- `pi/packages/pi-cmux/extensions/tools.ts`
- `pi/packages/pi-cmux/extensions/cmux-client.ts`
- `pi/packages/pi-cmux/specs/cmux-browser-audit-and-hardening.md`

Required changes:
- Implement the fixes already identified in `cmux-browser-audit-and-hardening.md`:
  - `eval` → `browser.eval` with `{ script }`
  - `get_text` → `browser.get.text`
  - `is_visible` → `browser.is.visible`
- Preserve structured cmux API errors instead of flattening everything to `null`.
- Remove optimistic browser success fallbacks (`Clicked`, `Filled`, `Element found`, etc.) when the underlying call actually failed.
- Keep existing public action names stable for current actions.

### D2. Make browser output compact and runtime/debug-oriented

Likely files:
- `pi/packages/pi-cmux/extensions/tools.ts`

Required changes:
- Special-case browser snapshot formatting so the default tool output is compact and useful for agent inspection.
- Default `snapshot` presentation should prioritize:
  - `title`
  - `url`
  - `ready_state`
  - accessibility tree (`snapshot`)
  - optional short note about refs / page text availability
- Do **not** dump full `page.html` into normal tool output.
- Keep screenshot output compact too: surface path/URL metadata when available, but omit inline `png_base64` from normal tool output.
- Keep truncation safeguards, but apply them to the compact representation first.

### D3. Add narrowly scoped console/error browser actions

Likely files:
- `pi/packages/pi-cmux/extensions/tools.ts`
- optional helper formatting in `pi/packages/pi-cmux/extensions/tools.ts`

Required changes:
- Add a minimal set of runtime-debug-only actions:
  - `console_list` → `browser.console.list`
  - `console_clear` → `browser.console.clear`
  - `errors_list` → `browser.errors.list`
- Position these as debug helpers, not general browsing features.
- Do not expand into broader agent-browser parity families.

### D4. Re-scope docs/tool descriptions and add a tiny Pi routing rule

Likely files:
- `pi/packages/pi-cmux/extensions/tools.ts`
- `pi/packages/pi-cmux/README.md`
- `pi/packages/pi-cmux/CLAUDE.md`
- `pi/packages/pi-cmux/package.json`
- `pi/instructions/appendix.md`

Required changes:
- Update `cmux_browser` tool description to say clearly:
  - use for localhost, authenticated pages, visual inspection, DOM/JS/runtime debugging
  - prefer `parallel_*` tools for public-web reading and synthesis
  - prefer `bash` / `curl` for APIs and raw file fetching
- Add one short Pi-specific routing note in `pi/instructions/appendix.md`.
- Add a Pi-specific preference to use `cmux_browser` rather than shelling out to `agent-browser` for live browser work inside Pi.
- Reword package docs to describe `cmux_browser` as **live browser/runtime control**, not generic article-reading automation.

### D5. Update local validation docs for the new runtime-focused contract

Likely files:
- `pi/packages/pi-cmux/specs/cmux-browser-audit-and-hardening.md`
- `pi/packages/pi-cmux/specs/cmux-browser-runtime-focus-and-web-routing.md`
- optional fixture docs in package `README.md`

Required changes:
- Preserve the existing action audit, but add the new runtime/debug contract:
  - browser is not the preferred public-web reader
  - snapshot formatting is compact by default
  - console/errors smoke checks are documented if D3 ships
- Keep validation local-first with deterministic `file://` fixtures where possible.

## Non-goals

- Adding a new high-level “smart web tool” that chooses between parallel and browser automatically.
- Turning `cmux_browser` into a public-web content extraction or summarization tool.
- Removing `agent-browser` from the broader dotfiles repo or shared skills.
- Exposing the full cmux browser API or chasing full agent-browser parity.
- Changing `parallel_search`, `parallel_extract`, or `parallel_research` implementations.
- Modifying cmux core.

## Data model

### Internal cmux request contract

Use an explicit three-state result model for v2 requests:

```ts
null
// transport unavailable / socket timeout / no structured response

{ ok: true, result: any }
// successful structured cmux response

{ ok: false, error: { code: string; message: string; data?: any } }
// structured cmux API failure
```

### Public browser action surface

Existing public actions remain stable:
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

Scoped debug additions:
- `console_list`
- `console_clear`
- `errors_list`

### Snapshot output contract

Default formatted snapshot output should contain:

```ts
{
  title?: string;
  url?: string;
  ready_state?: string;
  snapshot?: string; // accessibility tree text
  refs_count?: number;
  page_text_excerpt?: string; // optional, short excerpt only
}
```

Raw `page.html` remains internal / omitted from normal tool output.

## API / interface contract

### Tool routing contract

`cmux_browser` description should explicitly encode:
- **Use `cmux_browser` for:** localhost, authenticated pages, visual inspection, DOM/JS/runtime debugging, browser console/error inspection.
- **Prefer `parallel_*` for:** public-web search, extraction, and synthesis.
- **Prefer `bash` / `curl` for:** APIs, raw files, and exact transport.
- **Prefer `cmux_browser` over shelling out to `agent-browser` inside Pi** when the job is live browser interaction.

### Failure contract

For every browser action:
- invalid params surface as explicit parameter errors
- cmux `ok:false` responses surface as explicit cmux errors
- transport failures surface as transport failures
- no failed action is rendered as success text

### New debug action routing

| Public action | cmux method |
|---|---|
| `console_list` | `browser.console.list` |
| `console_clear` | `browser.console.clear` |
| `errors_list` | `browser.errors.list` |

## Acceptance criteria

- [ ] `eval`, `get_text`, and `is_visible` work against the local fixture flow described in `cmux-browser-audit-and-hardening.md`.
- [ ] `click`, `fill`, and `wait` no longer report success for nonexistent selectors.
- [ ] Browser tool failures distinguish transport failure from structured cmux API error.
- [ ] `snapshot` output on a large public page is compact enough to inspect without dumping raw `page.html` into the main tool output.
- [ ] `screenshot` output omits inline `png_base64` in normal tool output while still surfacing useful file/path metadata when available.
- [ ] `cmux_browser` tool description explicitly positions the browser as a localhost/auth/visual/runtime-debug tool and explicitly points public reading to `parallel_*` tools.
- [ ] `pi/instructions/appendix.md` contains a short Pi-specific web-tool routing rule.
- [ ] Pi-specific instructions prefer `cmux_browser` over shelling out to `agent-browser` for live browser work.
- [ ] If D3 ships, `console_list` returns emitted console entries and `errors_list` returns page error entries on a local debug fixture.
- [ ] If D3 ships, `console_clear` clears emitted console entries on the local debug fixture.

## Test strategy

| Layer | What | How |
|---|---|---|
| Manual integration | Existing browser happy-path and negative-path matrix | Re-run the local fixture matrix from `cmux-browser-audit-and-hardening.md` after D1 |
| Manual integration | Snapshot compactness on noisy public pages | Open HN or another large public page and verify compact text output avoids raw `page.html` dumps |
| Manual integration | Runtime-debug actions | Use a local `file://` fixture that emits `console.log` and a JS error, then verify `console_list`, `console_clear`, and `errors_list` |
| Low-level contract probe | cmux request semantics | Use a direct socket script to verify structured `ok/result/error` handling for selected browser actions |
| Docs sanity | Routing clarity | Review tool descriptions + Pi appendix together to ensure there is one unambiguous rule for public reading vs runtime browser work |

## Local validation notes

- Checked-in fixture pages for the runtime/debug smoke flow live under `pi/packages/pi-cmux/fixtures/cmux-browser/`.
- Use the `index.html` fixture for `eval`, `get_text`, `is_visible`, `console_list`, `console_clear`, and `errors_list`.
- Use `page-2.html` for navigate/back/forward smoke coverage.
- For compact snapshot validation, compare the fixture snapshot with a noisy public page and verify normal tool output surfaces `title`, `url`, `ready_state`, `snapshot`, and optional `page_text_excerpt` without dumping raw `page.html`.
- For screenshot validation, verify normal tool output keeps `path` / `url` metadata (when present) and replaces inline `png_base64` with an omission summary instead of the raw body.

## Risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---:|---|
| Too much routing instruction creates new noise | Medium | Medium | Keep policy to a few lines in `pi/instructions/appendix.md` and a short tool description note |
| Compact snapshot formatting hides data needed in some sessions | Medium | Medium | Keep refs and key metadata visible; only suppress raw HTML in default text output |
| Adding console/error actions becomes a wedge for broader API expansion | Medium | Medium | Explicitly limit expansion to console/errors only and keep full parity as a non-goal |
| Browser/public-reading boundaries drift across docs | Medium | Low | Update tool description, package docs, and Pi appendix in the same change set |

## Trade-offs made

| Chose | Over | Because |
|---|---|---|
| One Pi-native browser tool | Multiple overlapping browser workflows inside Pi | Deterministic routing is more valuable than optionality |
| Explicit routing guidance | Hidden auto-delegation | Predictability and debuggability matter more than cleverness |
| Runtime/debug specialization | General public-web reading support in the browser | `parallel_*` already owns public reading better |
| Small debug-specific expansion | No runtime-specific additions at all | Console/errors strengthen the browser’s distinct niche without overlapping with `parallel_*` |

## Open questions

- [ ] Should a future pass add a `snapshot_full` / debug-mode escape hatch for raw browser payloads? → Owner: future implementation session
- [ ] Should `cmux_browser` eventually expose `browser.highlight` once the runtime/debug contract is stable? → Owner: future implementation session

## Success metrics

- Public web reading tasks rarely need `cmux_browser`; agents default to `parallel_extract` / `parallel_search` for those flows.
- Localhost/authenticated/visual debugging tasks can be completed in Pi without shelling out to `agent-browser`.
- Zero false-success outputs remain in the audited negative browser cases.
- Browser snapshot outputs become materially smaller and easier to scan in agent transcripts.
- Browser console/error inspection becomes available through the Pi-native tool surface.

---

## Handoff summary

1. **D1 — Harden `cmux_browser` contract and failure model** (M)
   - Depends on: -
   - Likely files: `extensions/tools.ts`, `extensions/cmux-client.ts`, `specs/cmux-browser-audit-and-hardening.md`

2. **D2 — Make browser output compact and runtime/debug-oriented** (S)
   - Depends on: D1
   - Likely files: `extensions/tools.ts`

3. **D3 — Add narrowly scoped console/error browser actions** (S)
   - Depends on: D1
   - Likely files: `extensions/tools.ts`

4. **D4 — Re-scope docs/tool descriptions and add a tiny Pi routing rule** (S)
   - Depends on: D1
   - Likely files: `extensions/tools.ts`, `README.md`, `CLAUDE.md`, `package.json`, `pi/instructions/appendix.md`

5. **D5 — Update local validation docs** (S)
   - Depends on: D1, D2, D3, D4
   - Likely files: `specs/cmux-browser-audit-and-hardening.md`, this spec, optional fixture docs

**Key technical decisions**
- Keep `cmux_browser` as the single Pi-native browser tool.
- Public web reading belongs to `parallel_*`; live rendered/runtime inspection belongs to `cmux_browser`.
- Add only a tiny Pi-specific routing rule rather than a broad instruction framework.
- Allow one narrow browser API expansion — console/errors — because it reinforces the runtime/debug niche.

**Status:** Ready for task decomposition
