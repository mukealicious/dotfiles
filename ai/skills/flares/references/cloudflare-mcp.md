# Cloudflare MCP for Flares

Use Cloudflare's official API MCP server as the agent control plane for account discovery, resource setup, and deployment checks. Use Cloudflare bindings inside Workers for runtime data paths.

## Pi Setup Assumption

This dotfiles setup installs `pi-mcp-adapter` and configures:

```json
{
  "mcpServers": {
    "cloudflare-api": {
      "url": "https://mcp.cloudflare.com/mcp",
      "directTools": ["docs", "search", "execute"]
    }
  }
}
```

First use may require `/mcp reconnect cloudflare-api` and Cloudflare OAuth. If direct tools are not visible yet, use the `mcp` proxy or reconnect to warm the metadata cache.

## Tooling Model

Cloudflare's API MCP uses Code Mode:

| Tool | Use |
|---|---|
| `docs` | Search current Cloudflare developer docs. Use before relying on memory for Wrangler config, Access policies, Workers APIs, or product limits. |
| `search` | Run JavaScript over the Cloudflare OpenAPI spec to find endpoints and schemas. |
| `execute` | Run JavaScript that calls the discovered Cloudflare API endpoints through the MCP host. Credentials stay host-side. |

The server exposes the whole Cloudflare API through a tiny tool surface. Prefer it over adding product-specific MCP servers unless a repeated workflow proves it needs curated typed tools.

## When to Use MCP vs Wrangler vs Bindings

| Need | Prefer | Why |
|---|---|---|
| Inspect account, zones, Workers, D1, R2, Access apps | Cloudflare MCP | Broad authenticated read access without hand-writing REST calls. |
| Create/update Cloudflare resources from an agent session | Cloudflare MCP, after approval | Good for account-level setup and one-off admin operations. |
| Deploy Worker code from local repo | `wrangler deploy` | Keeps deploy artifact reproducible from source control. |
| Runtime reads/writes from a Flare | Worker bindings/service bindings | No Cloudflare credentials in app code; lower latency and simpler auth. |
| Large generated bundle upload | Wrangler/R2 binding or R2 API behind platform command | Avoid embedding account credentials in generated clients. |

Do not use the Cloudflare REST API from Flare client code. Do not route user submissions through MCP. MCP is an operator/admin channel, not the Flare data plane.

## Safe MCP Workflow

1. **Read docs first** for current product syntax and limits: Workers, Durable Objects SQLite, R2, D1, Access, AI Gateway, Workers AI, Queues, Workflows.
2. **Discover** account and zone IDs with MCP only when needed; do not print secrets.
3. **Plan mutations** before running them. Show resources, permissions, routes, and estimated impact.
4. **Ask approval** before creating public routes, Access policies, DNS records, paid resources, or deleting/updating existing Cloudflare resources.
5. **Execute small mutations** and verify with Cloudflare API reads plus local files.
6. **Record durable state** in repo files: `wrangler.jsonc`, migrations, manifest examples, deployment notes. MCP should not be the only source of truth.

## Useful Search Prompts

Use Cloudflare MCP `docs` for:

- "Workers Static Assets run_worker_first wrangler jsonc"
- "Durable Objects SQLite migrations wrangler new_sqlite_classes"
- "Cloudflare Access application one time PIN email allowlist API"
- "D1 migrations wrangler remote local"
- "R2 bucket binding Workers upload object"
- "Workers AI Gateway binding or REST from Worker"
- "Queues producer consumer Worker wrangler jsonc"
- "Workers routes custom domain API"

Use Cloudflare MCP `search` before `execute` when:

- finding the exact endpoint for a resource operation;
- checking required request fields;
- enumerating existing resources to avoid duplicates;
- generating a narrow call that returns only relevant fields.

## Authentication Notes

- Prefer OAuth for interactive personal use.
- For CI/automation, use scoped Cloudflare API tokens in private environment variables; never commit them.
- Use the least privilege token that can manage the selected account/zone resources.
- If an MCP call fails due to authorization, stop and report the missing permission rather than broadening scope silently.
