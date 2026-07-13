# pi-exa

Pi extension that adds `exa_search`, a low-friction Exa web search tool for coding agents.

## Setup

Create an Exa API key, then store it outside dotfiles:

```fish
set -Ux EXA_API_KEY "..."
```

In Pi, run `/exa-setup` to confirm the key is visible.

## Tool policy

Use Parallel Turbo first for ordinary web discovery and quick current lookups. Keep `exa_search` for semantic discovery, obscure technical/code material, broader multilingual search, and fallback verification when Parallel results are thin or contradictory.

Canonical Exa API reference for coding agents: https://docs.exa.ai/reference/search-api-guide-for-coding-agents
