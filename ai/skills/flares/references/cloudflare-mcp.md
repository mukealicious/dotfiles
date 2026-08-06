# Cloudflare MCP for Flares

Cloudflare's official API MCP server is an **infrastructure/operator channel**. Generated clients use the Runtime API; Console and CLI use the Management API. Never route Flare activity through MCP.

## Pi Setup

This dotfiles setup installs `pi-mcp-adapter` only in the personal Pi profile and manages:

```json
{
  "mcpServers": {
    "cloudflare-api": {
      "url": "https://mcp.cloudflare.com/mcp",
      "lifecycle": "lazy",
      "directTools": ["docs", "search", "execute"]
    }
  }
}
```

First use may require `/mcp reconnect cloudflare-api` and Cloudflare OAuth. Credentials remain outside this repository.

## Tool Surface

| Tool | Use |
|---|---|
| `docs` | Verify current Cloudflare docs, product limits, Wrangler syntax, Access behavior, and migration requirements. |
| `search` | Query the Cloudflare OpenAPI description to find exact resource endpoints/schemas. |
| `execute` | Make a narrow authenticated account/resource call after discovery and required approval. |

The tiny Code Mode surface is intentional; do not add broad product-specific MCP schemas unless repeated operations justify them.

## Channel Selection

| Need | Use |
|---|---|
| Current Cloudflare documentation | MCP `docs` |
| Inspect account, Workers, D1, R2, Access, routes, or DNS | MCP `search` then narrow `execute` |
| Create/change account resources | MCP after explicit plan and approval |
| Deploy reproducible Worker/platform code | Platform repository and Wrangler |
| Validate/deploy a Flare packet | Flare CLI over Management API |
| Read/export Flare activity | Flare CLI or Console |
| Runtime activity append/list | Generated-client Runtime API |
| Worker access to D1/R2/Durable Objects | Cloudflare bindings |

Do not call Cloudflare REST or MCP from generated client code. Do not give packet authors Cloudflare credentials.

## Safe Workflow

1. Read current official docs before relying on remembered syntax or limits.
2. Discover only the account/zone/resource identifiers needed for the operation.
3. Inspect existing resources to avoid duplicates.
4. Present mutations, permissions, routes, access impact, and expected cost.
5. Ask before creating/updating/deleting resources, DNS/routes, Access policies, or public surfaces.
6. Execute the smallest approved mutation and verify with a read.
7. Record reproducible state in the platform repository (`wrangler.jsonc`, migrations, deployment docs); MCP must not be the only source of truth.

## First-Slice Documentation Checks

Use `docs` to verify current guidance for:

- Workers Static Assets and `run_worker_first` routing;
- Durable Objects with SQLite and `new_sqlite_classes` migrations;
- D1 local/remote migrations and transactions;
- R2 Worker bindings and object metadata;
- Cloudflare Access assertion validation;
- Access service-token headers and Management API policy scoping;
- Worker custom routes/domains and path routing;
- Workers observability/logging configuration.

Queues, Workflows, Workers AI, AI Gateway, WebSockets, uploads, and public-write protection are outside the initial platform setup.

## Authentication and Failure

- Prefer OAuth for interactive personal MCP use.
- Use least-privilege private tokens only where OAuth is unsuitable; never commit or print them.
- The Flare CLI's Access service token is separate from Cloudflare account-management credentials.
- If authorization fails, report the missing permission and stop. Do not broaden scope or make a route public automatically.
- If a mutation partially succeeds, report exactly what changed and preserve identifiers for manual inspection. Do not perform destructive cleanup without approval.
