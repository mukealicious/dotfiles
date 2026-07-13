## Pi Appendix

- Use Parallel `web_search` in `turbo` mode first for ordinary public-web discovery, factual lookups, news, and documentation.
- Retry `web_search` with `mode: "basic"` when Turbo returns thin context; reserve `advanced` for complex multi-hop retrieval.
- Use `exa_search` for semantic discovery, obscure technical/code material, broader multilingual search, or verification when Parallel results are thin or contradictory.
- Use `deep_research` for broad synthesis, `web_fetch` for public pages that need extraction, and `batch_enrich` for structured multi-entity enrichment.
- Use `bash`/`curl` for known URLs, APIs, raw files, localhost, and downloads.
- Keep paid-search calls bounded: start with 1-3 targeted searches and fetch only high-value sources.
