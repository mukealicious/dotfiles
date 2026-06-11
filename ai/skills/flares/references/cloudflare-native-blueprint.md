# Cloudflare Native Blueprint

## Architecture Bias

Build Flares as a capability platform, not a per-app backend generator.

```text
agent/user intent
  -> generated Flare bundle and manifest
  -> Flare host Worker
      -> serves assets
      -> enforces auth, expiry, quotas, capabilities
      -> exposes /_flare/* SDK APIs
      -> routes mutable state and realtime to one Flare Durable Object
  -> R2 for generated bundles, uploads, and exports
  -> D1 for searchable registry and reporting indexes
  -> Queues/Workflows for lifecycle jobs
  -> Workers AI or AI Gateway for model calls
```

The generated client should never know Cloudflare credentials, provider API keys, storage bucket names, registry table names, or Durable Object IDs. It calls the platform SDK; the Worker maps the request to the current Flare.

## Primitive Map

| Need | Cloudflare primitive | Default use |
|---|---|---|
| Host and API routes | Workers | One platform Worker routes host/path to a Flare and handles `/_flare/*`. |
| Static platform shell | Workers Static Assets | Good for the stable host app, SDK, admin UI, and SPA fallback. |
| Generated Flare bundles | R2 or Workers Static Assets | Use R2 for many generated per-Flare folders; use Workers Static Assets for versioned platform files. |
| Per-Flare mutable state | Durable Objects with SQLite | One named object per Flare stores documents, events, sessions, quotas, and room state. |
| Realtime/collaboration | Durable Object WebSockets | Same object that owns state coordinates live clients. Use hibernation when rooms can sit idle. |
| Registry/search/admin lists | D1 | Global index of Flare metadata, status, owner, auth mode, expiry, and exports. |
| Bootstrap/cache/config | KV | Only for low-critical cached manifests or config that tolerates eventual consistency. |
| Uploads/exports | R2 | Store under `flares/{slug}/uploads/` and `flares/{slug}/exports/`. |
| Background jobs | Queues | Export generation, notifications, ingestion, thumbnailing, cleanup fanout. |
| Long-running lifecycle | Workflows | Publish, invite, summarize, promote, archive, retention, approval waits. |
| AI/model calls | Workers AI or AI Gateway | Server-side only, with budgets, purpose logging, and data-policy checks. |
| Identity/admin gate | Cloudflare Access | Owner/admin and known-email gates. Inspect verified identity server-side. |
| Per-Flare invitations | Worker signed tokens | Fine-grained roles, expiry, and audience rules after Access-only modes prove limiting. |
| Abuse prevention | Turnstile, Rate Limiting, DO counters | Add to public or intake Flares; always enforce server-side write limits. |
| Observability | Workers Logs, Analytics Engine | Structured events for publish/share/write/export/AI usage. |

## Core Topology

Prefer one platform Worker at first:

```text
GET  /                         -> resolve Flare, serve index/static bundle
GET  /assets/*                 -> serve Flare asset from R2 or ASSETS binding
GET  /_flare/client.js         -> serve pinned SDK
GET  /_flare/manifest          -> sanitized manifest/bootstrap
GET  /_flare/identity          -> current viewer/role/capabilities
POST /_flare/db/:collection    -> validated document write
GET  /_flare/db/:collection    -> validated document list
GET  /_flare/export.json       -> owner/admin export
GET  /_flare/realtime          -> websocket upgrade to Flare Durable Object
```

Split into service-bound Workers only when the platform has real pressure:

- a public host Worker for read/API routing;
- an admin Worker for deploy, publish, and registry operations;
- an AI Worker with tighter secrets and budgets;
- a workflow/queue Worker for lifecycle tasks.

Use service bindings between Workers instead of public HTTP calls.

## Durable Object Model

Use `idFromName(slug)` for the first slice so the mental model stays simple:

```text
flare: design-review-2026-06-10
  Durable Object:
    documents(collection, id, json, author, created_at, updated_at)
    events(id, type, json, author, created_at)
    sessions(session_id, identity_json, role, created_at, last_seen_at)
    quotas(subject, window, count, reset_at)
```

Rules:

- Durable Object SQLite is the source of truth for interactive per-Flare state.
- D1 is not the hot path for votes/comments/cursors. Use it for registry and reporting indexes.
- KV is not the source of truth for mutable Flare data.
- R2 holds large blobs and export artifacts; DO SQLite stores metadata and references.
- WebSocket messages should validate against capability flags and write through the same object when they change durable state.

## Lifecycle Jobs

Use Queues for short background fanout:

- create export bundle;
- send notification/invite jobs;
- process upload metadata;
- append analytics/audit events;
- cleanup expired R2 prefixes after archive.

Use Workflows when state must survive retries, waits, approvals, or multi-step progress:

- publish a Flare after approval;
- invite audience and wait for deadline;
- summarize responses using AI after expiry;
- promote a Flare into a permanent app/site;
- archive, export, and delete mutable state according to retention.

Keep Workflow steps idempotent. Store external side-effect IDs in D1 or the Flare Durable Object.

## Agents SDK Fit

Use the Agents SDK when the platform itself needs a steerable operator, not for every basic CRUD Flare.

Good fits:

- a per-Flare steward that tracks instructions, state, unresolved questions, and steering log;
- a background agent that turns exported responses into summaries and follow-up drafts;
- a human-in-the-loop approval flow for publish/invite/private-data AI use;
- scheduled nudges, expiry checks, and promotion suggestions;
- MCP/tool access for connecting Flares back to notes, Linear, GitHub, or repo context.

Avoid putting core data-path writes behind model behavior. User submissions, votes, comments, uploads, and exports should be deterministic Worker/DO code.

## Wrangler Shape

Keep generated Flare code out of platform config. The platform has stable bindings:

```jsonc
{
  "name": "flare-host",
  "main": "src/index.ts",
  "compatibility_date": "2026-06-11",
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
    "producers": [{ "binding": "FLARE_JOBS", "queue": "flare-jobs" }],
    "consumers": [{ "queue": "flare-jobs" }]
  },
  "observability": { "enabled": true }
}
```

Verify exact Wrangler schema and current compatibility-date practice against Cloudflare docs before implementation.

## First Platform Slice

Build in this order:

1. Local Flare manifest and static preview.
2. Worker host with `/_flare/manifest`, `/_flare/identity`, and asset serving.
3. One `FlareObject` with SQLite-backed document collections.
4. `POST`/`GET /_flare/db/:collection` with server-side capability, expiry, schema, and quota checks.
5. Owner/admin `/_flare/export.json`.
6. R2 upload of generated Flare bundle plus D1 registry row.
7. Public, unlisted, and access-otp modes.
8. Queue export job and archive path.
9. Realtime WebSocket room.
10. AI API and Agents SDK steward only after data/export/auth are stable.

## Non-Negotiables

- Bindings over REST API calls from Workers.
- Deterministic server code for auth, writes, exports, quotas, and expiry.
- No secrets or model keys in generated clients.
- Expiry and auth enforced server-side.
- Export path for every persisted data type.
- Manifest and steering log updated for every publish/share/promotion decision.
- Observability for publish, share, write, export, AI, archive, and error events.
