# pi-exa

Pi 0.99.1+ extension that adds `exa_search`, a thin direct Exa API adapter for coding agents.

## Setup

Create an Exa API key, then store it outside dotfiles:

```fish
set -Ux EXA_API_KEY "..."
```

In Pi, run `/exa-setup` to confirm the key is visible.

## Tool policy

Use Parallel Turbo first for ordinary web discovery and quick current lookups. Keep `exa_search` for semantic discovery, obscure technical/code material, broader multilingual search, and fallback verification when Parallel results are thin or contradictory.

Canonical Exa API reference for coding agents: https://docs.exa.ai/reference/search-api-guide-for-coding-agents

## Native results and audit decision

Retained after the Pi 0.99.1 audit: the inspected official MCP search schema does
not expose all six existing search types (`auto`, `fast`, `instant`, `deep-lite`,
`deep`, `deep-reasoning`). This package keeps all content modes, domain filters,
freshness controls and result/text limits. No MCP server is enabled by it.

`exa_search` stays directly exposed under its existing name. Its native
`outputSchema` describes `structuredContent`: the complete API response, including
all requested text, highlights, summaries and extra provider metadata. Codemode
receives that object, not the short model-facing excerpts or UI-only `details`:

```javascript
const response = await tools.exa_search({ query: "example", contentMode: "text" });
return response.results.map(({ url, text }) => ({ url, text }));
```

Model-visible text honors the requested content mode without the former 800-character truncation, so restricted researchers do not need codemode to recover requested text.
Failures (including invalid JSON/response shapes) are native tool errors and
reject in codemode; they are not reported as empty search results. Cancellation
is passed to HTTP requests, and an already-cancelled call makes no request.

## Offline validation

From this package directory, with the repository's existing Pi development peers:

```sh
node --test test/*.test.mjs
```

Tests mock HTTP; no API key, paid request, MCP connection or dependency install is
needed. The neighboring Parallel package also tests both adapters through Pi's
actual native loader, codemode and tool allowlists.
