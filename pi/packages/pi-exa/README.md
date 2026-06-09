# pi-exa

Pi extension that adds `exa_search`, a low-friction Exa web search tool for coding agents.

## Setup

Create an Exa API key, then store it outside dotfiles:

```fish
set -Ux EXA_API_KEY "..."
```

In Pi, run `/exa-setup` to confirm the key is visible.

## Tool policy

Use `exa_search` first for ordinary web discovery, coding docs, API examples, and quick current lookups. Keep Parallel available for deep research, enrichment, and Parallel-specific extraction.

Canonical Exa API reference for coding agents: https://docs.exa.ai/reference/search-api-guide-for-coding-agents
