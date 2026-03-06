---
name: linear
description: Access Linear via local SDK-backed Pi tools (issues/projects/teams/milestones/documents) without raw GraphQL shell pipelines.
---

# Linear

Use this skill when working with Linear in Pi.

## Preferred tools

Always use these local tools first:

- `linear_issue` — issue actions: list, view, create, update, comment, start, delete
- `linear_project` — project actions: list
- `linear_team` — team actions: list
- `linear_milestone` — milestone actions: list, view, create, update, delete
- `linear_doc_get` — fetch doc by URL, slugId, UUID, or title
- `linear_doc_search` — find docs by title
- `linear_doc_create` — create doc from markdown
- `linear_doc_update` — replace/append doc markdown
- `format_list` — generic formatter for ad-hoc lists (avoid for `linear_issue` list tables; use `linear_issue format=table`)

These tools are SDK-backed and hide API/auth details.

## Auth

Set one of:

1. `LINEAR_API_KEY`
2. `LINEAR_OP_REF`
   - `op://...` secret reference (preferred)
   - or direct `lin_api_...` token (back-compat)

## Issue list options

`linear_issue` with `action: "list"` supports:

- `project` — filter by project name or id
- `states` — filter by state name(s) e.g. `["In Progress", "Todo"]`
- `assignee` — filter by id, or `"me"` for the current viewer
- `limit` — max results (default 25)
- `format` — `plain` (default) or `table` for fixed-width tabular output
- `compact` — render each result as a minimal single line (plain mode)
- `maxTitle` — truncate title width to reduce wrapping (default 54; wider values are capped for CLI readability)
- `showUrl` — include URL in output (default true; table mode always includes links)

Examples:

```
# My in-progress issues, compact
linear_issue action=list assignee=me states=["In Progress"] compact=true maxTitle=54

# Table output (URL-first blocks; clearer scan in Pi CLI)
linear_issue action=list project="inVibe Agent" assignee=me format=table showUrl=true

# All issues in a project
linear_issue action=list project="Acme Backend"
```

## Output formatting

When presenting list-heavy results to users, prefer fixed-width tables for scanability:

1. Gather data with `linear_issue` / `linear_project` / `linear_milestone`.
2. For issue tables, use `linear_issue` with `format="table"` and return that text directly.
3. Use `format_list` only for non-issue ad-hoc data where no native table mode exists.
4. In Pi CLI, present returned text as plain output (no markdown code fences, no extra indentation).

Important: Unless user requests a different format, preserve tool row layout verbatim in final response.

## Typical usage

### Compare plan doc vs implementation

1. `linear_doc_get` with doc URL
2. inspect branch/repo
3. report implemented vs gaps

### Update shared planning docs

1. `linear_doc_get` to confirm target
2. `linear_doc_update` with:
   - `mode: "replace"` for full rewrite
   - `mode: "append"` for progress updates
   - optional `expectedUpdatedAt` for conflict guard

## Fallback

No CLI fallback is maintained. Use the SDK-backed extension tools above.
