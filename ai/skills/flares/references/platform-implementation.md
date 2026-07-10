# Flare Platform Implementation

Build the shared platform as a thin Cloudflare host plus generated Flare packets. Start with a vertical slice; do not build a universal app platform before one real Flare proves the loop.

## First Useful Architecture

```text
route/host -> flare-host Worker
  -> serves generated bundle from R2 or assets
  -> serves /_flare/client.js
  -> serves sanitized /_flare/manifest
  -> derives identity and role
  -> forwards state APIs to FlareObject Durable Object
  -> exports documents/events as JSON/Markdown
```

Bindings:

- `FLARE_OBJECT`: Durable Object class `FlareObject` with SQLite.
- `FLARE_BUCKET`: R2 bucket for generated bundles, uploads, exports.
- `REGISTRY_DB`: D1 database for slug/route/status/auth/expiry index.
- `FLARE_JOBS`: Queue for export/archive/invite jobs, when needed.
- `ASSETS`: Workers Static Assets for stable platform shell/SDK.

## Minimal Worker Routes

| Route | Behavior |
|---|---|
| `GET /` | Resolve current Flare by host/path and serve `index.html`. |
| `GET /assets/*` | Serve generated bundle asset. |
| `GET /_flare/client.js` | Serve stable SDK. |
| `GET /_flare/manifest` | Return sanitized manifest. |
| `GET /_flare/identity` | Return current identity, role, and capabilities. |
| `GET /_flare/db/:collection` | List documents via Durable Object. |
| `POST /_flare/db/:collection` | Validate and create document via Durable Object. |
| `GET /_flare/export.json` | Owner/admin export of manifest, documents, events, file metadata. |
| `GET /_flare/realtime` | Later: WebSocket upgrade to Durable Object. |

Keep custom per-Flare endpoints out of the first slice. Generated clients should use the fixed SDK.

## Durable Object SQLite Schema

Use one object per Flare slug (`idFromName(slug)`). Suggested tables:

```sql
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  collection TEXT NOT NULL,
  json TEXT NOT NULL,
  author TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS documents_collection_created ON documents(collection, created_at);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  json TEXT NOT NULL,
  author TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  identity_json TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quotas (
  subject TEXT NOT NULL,
  window TEXT NOT NULL,
  count INTEGER NOT NULL,
  reset_at TEXT NOT NULL,
  PRIMARY KEY(subject, window)
);
```

Validation belongs in Worker/DO code, not in the generated client only.

## Registry D1 Schema

D1 is the searchable index, not the hot write path:

```sql
CREATE TABLE IF NOT EXISTS flares (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  auth_mode TEXT NOT NULL,
  route TEXT,
  owner_email TEXT,
  capabilities_json TEXT NOT NULL,
  source_summary_json TEXT NOT NULL,
  expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

## Auth Strategy

Implement in this order:

1. `local`/owner-only draft for development.
2. `public` and `unlisted` with server-side expiry and quotas.
3. Cloudflare Access OTP for known email audiences.
4. Hybrid Access + app allowlist for per-Flare roles.
5. Custom signed invite links only after repeated need.

Cloudflare Access can prove email ownership. The Worker must still map email/session to Flare role and audience.

## AI Strategy

Defer until data/export/auth work. When enabled:

- Server-side only; no keys in client bundles.
- Prefer Workers AI or AI Gateway.
- Enforce `budgets.maxAiUsd` and log purpose/cost/latency.
- Require manifest approval for AI over private source or collected data.
- Export AI outputs with provenance.

## Wrangler Skeleton

Verify current Wrangler schema with Cloudflare docs before copying exactly:

```jsonc
{
  "name": "flare-host",
  "main": "src/index.ts",
  "compatibility_date": "2026-06-27",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",
    "run_worker_first": ["/_flare/*"]
  },
  "durable_objects": {
    "bindings": [{ "name": "FLARE_OBJECT", "class_name": "FlareObject" }]
  },
  "migrations": [{ "tag": "v1", "new_sqlite_classes": ["FlareObject"] }],
  "r2_buckets": [{ "binding": "FLARE_BUCKET", "bucket_name": "flares" }],
  "d1_databases": [{ "binding": "REGISTRY_DB", "database_name": "flare_registry" }],
  "queues": {
    "producers": [{ "binding": "FLARE_JOBS", "queue": "flare-jobs" }]
  },
  "observability": { "enabled": true }
}
```

## Implementation Order

1. Static local packet and manifest.
2. Worker route resolution and asset serving.
3. `/_flare/manifest`, `/_flare/identity`, and `/_flare/client.js`.
4. Durable Object document create/list and export.
5. D1 registry row and route lookup.
6. R2 bundle upload and versioned asset serving.
7. Access OTP/auth modes.
8. Queues/Workflows archive/export/invite jobs.
9. Realtime WebSockets.
10. AI API and steward agent.
