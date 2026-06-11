# Good Local AGENTS.md Example

This example shows the target level of specificity for a nested `AGENTS.md`.
It is intentionally concrete: product shape, data contracts, implementation
boundaries, key files, and verification are all named.

```md
# Search Suggestions Panel

This folder implements the typeahead suggestions panel shown beneath the global
search input. It owns suggestion rendering, keyboard navigation, local ranking,
and the adapter from search API responses into suggestion view models.

The panel is user-visible on every page with global search, so regressions here
can break navigation, accessibility, and perceived search quality.

## What It Looks Like

A floating panel with three vertical regions:

1. **Query actions** — submit current text, clear query, recent query shortcuts
2. **Suggestion list** — ranked entity/document suggestions with icon, title, and metadata
3. **Footer action** — optional “view all results” link when the backend has more matches

`SearchSuggestionsPanel` renders the panel shell and keyboard focus ring. Rows
are normal list items rendered by `SuggestionRow`; do not special-case row layout
inside the adapter.

## Data Model

```text
SearchSuggestResponse              API response
  query: string
  suggestions[]: SearchSuggestion  raw backend results
  hasMore: boolean

SuggestionViewModel                UI contract
  id: string                       stable key; also used for aria-activedescendant
  title: string
  subtitle?: string
  icon: SuggestionIcon
  destination: RouteLocation
  rankReason?: string              debug-only tooltip in development
```

Adapter rule: UI code reads only `SuggestionViewModel`. If the API adds fields,
map them in `searchSuggestionsAdapter.ts` rather than passing raw response data
through React components.

## Invariants

- Arrow keys must cycle through visible suggestions without moving browser focus
  out of the search input.
- `id` must remain stable across re-renders for the same API result.
- Empty, loading, and error states must keep the panel mounted so screen-reader
  announcements remain consistent.
- Do not persist raw suggestion responses; only recent query strings are stored.

## Key Files

| File | Role |
|---|---|
| `SearchSuggestionsPanel.tsx` | Panel shell, ARIA wiring, keyboard event delegation |
| `SuggestionRow.tsx` | Visual row treatment for all suggestion types |
| `searchSuggestionsAdapter.ts` | API response → `SuggestionViewModel[]` mapping |
| `useSearchSuggestions.ts` | Debounced fetch, cancellation, loading/error state |
| `recentQueriesStore.ts` | Local recent-query persistence; no raw result storage |
| `SearchSuggestionsPanel.test.tsx` | Keyboard navigation and ARIA behavior |

## Common Changes

| Task | Start here | Verify with |
|---|---|---|
| Add a suggestion type | `searchSuggestionsAdapter.ts` then `SuggestionRow.tsx` | `pnpm test SearchSuggestionsPanel` |
| Change keyboard behavior | `SearchSuggestionsPanel.tsx` | `pnpm test SearchSuggestionsPanel -- --runInBand` |
| Change API fields | `searchSuggestionsAdapter.ts` | adapter tests + typecheck |
| Adjust visual spacing | `SuggestionRow.tsx` | storybook visual check |

## Gotchas

- Debounce and request cancellation live in `useSearchSuggestions`; do not add
  timers in render components.
- `recentQueriesStore.ts` intentionally stores only query text. Storing result
  payloads would create stale/private data risks.
- The “view all results” footer appears only when `hasMore` is true and the query
  is non-empty.
- The search input owns actual DOM focus. The panel uses `aria-activedescendant`,
  not roving tab index.

## Boundaries

- Safe to edit: panel rendering, adapter mapping, tests, local stories.
- Ask first: API response shape, analytics events, persistence behavior.
- Do not edit directly: generated API types under `src/generated/`; update the
  API schema and regenerate instead.

## Related Context

| File | Load when |
|---|---|
| `../AGENTS.md` | Need app-wide frontend conventions or test commands |
| `../../api/AGENTS.md` | Changing search API contracts |
| `docs/accessibility/search.md` | Changing keyboard or screen-reader behavior |
```

## Why This Is Good

- It starts with ownership and impact, not generic advice.
- It describes the user-facing shape so agents can reason beyond filenames.
- It names the data contract and where translation belongs.
- It states invariants that are easy for edits to break.
- The key-file table explains roles rather than listing everything.
- Common tasks point to both starting files and verification commands.
- Boundaries say where to ask and what not to edit directly.
- Related context tells agents what to load next only when needed.
