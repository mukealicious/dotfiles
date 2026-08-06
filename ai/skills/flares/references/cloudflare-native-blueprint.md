# Cloudflare-Native Blueprint

This reference maps the stable [platform contract](./platform-contract.md) to Cloudflare adapters. It does not redefine product lifecycle or client APIs.

## V1 Topology

```text
Cloudflare Access
  -> shared flare-host Worker
      -> Runtime API for generated Flares
      -> Management API for Console and CLI
      -> stable Console assets
      -> immutable Flare assets from R2
      -> D1 catalog lookup
      -> per-Flare Durable Object activity calls

D1: Flare/revision/deployment-target/deployment catalog
R2: immutable revision packets
Durable Object SQLite: authoritative activity per stable Flare ID
```

Prefer one Worker initially. Logical Runtime/Management authorization boundaries do not require separate physical services.

## Primitive Map

| Need | Cloudflare primitive | V1 use |
|---|---|---|
| Host and API routing | Workers | Resolve `/f/<slug>/`, serve assets, expose Runtime and Management routes. |
| Stable Console and SDK | Workers Static Assets | Versioned platform-owned browser assets. |
| Revision packets | R2 | Immutable manifest, schemas, and `dist/` assets under revision-specific prefixes. |
| Catalog | D1 | Stable Flares, immutable revisions/deployments, stable targets, route lookup. |
| Activity authority | Durable Objects with SQLite | One named object per stable Flare ID; schemas, append/list, quotas, idempotency. |
| Owner access | Cloudflare Access | Interactive browser identity and scoped Management API service token. |
| Logs | Workers observability | Structured request/deploy/activity errors without payloads or secrets. |

Do not add KV, Queues, Workflows, Workers AI, AI Gateway, WebSockets, uploads, or per-Flare Workers to the first slice.

## Stable Routing

Use a path shape such as:

```text
/f/<slug>/
/f/<slug>/assets/*
/f/<slug>/_flare/bootstrap
/f/<slug>/_flare/activity
/api/manage/v1/*
```

D1 resolves the mutable slug to a stable Flare ID, then resolves its stable deployment target to the active immutable deployment/revision. R2 asset keys use stable IDs and revision numbers, not user-controlled raw paths:

```text
flares/<flare-id>/revisions/<revision-number>/flare.json
flares/<flare-id>/revisions/<revision-number>/activity-schemas/...
flares/<flare-id>/revisions/<revision-number>/dist/...
```

Normalize paths, reject traversal/encoded traversal, and bind every lookup to the resolved revision prefix. Generated assets from one Flare must never be able to address another prefix.

## D1 Ownership

D1 is authoritative for global metadata:

```text
flares
flare_revisions
deployment_targets
deployments
```

Key lifecycle shape:

- `flares.slug` is unique but not a storage identity;
- `(flare_id, revision_number)` and `(flare_id, packet_sha256)` are unique;
- `deployment_targets.route` is unique;
- one V1 target exists per `(flare_id, environment)`;
- `deployments.plan_hash` is unique for lost-response retry;
- `deployment_targets.active_deployment_id` is the only mutable release pointer.

Activation appends the deployment and flips the target pointer in one D1 transaction. A failed staged publication leaves the previous pointer unchanged.

## Durable Object Ownership

Address one object with `idFromName(flareId)`, never `slug`.

SQLite owns:

```text
revision_activity_types(revision_id, definitions_json, configured_at)
activity_records(
  id, revision_id, deployment_id, type, type_version,
  actor_json, payload_json, idempotency_key, request_sha256,
  created_at, supersedes_id, redacted_at
)
```

The object serializes writes for one Flare and performs append in this order:

1. replay same-key/same-hash records;
2. reject same-key/different-hash conflicts;
3. reject new writes from a superseded deployment;
4. validate against configured revision schema and quotas;
5. insert and return the authoritative record.

D1 is not the hot write path for per-Flare activity. A cross-Flare D1 feed is a later, rebuildable projection.

## R2 Ownership

R2 stores immutable revision bytes only after server-side packet verification. Publication must:

1. verify packet limit, path safety, canonical file index, and every SHA-256;
2. write to a new revision prefix;
3. configure revision activity definitions in the Durable Object;
4. activate D1 only after all required bytes/configuration exist.

Staged prefixes may remain for manual inspection after failure. V1 performs no automatic cleanup or destructive recovery.

## Access Boundary

- Access protects the owner Console, Management API, and owner-only reference Flare.
- Browser identity comes from a validated Access assertion.
- CLI uses a dedicated least-privilege Access service token scoped only to the Management API.
- Tokens live in 1Password/private environment variables, never packet files, logs, or repository config.
- Worker handlers recheck the expected Access audience and owner/automation subject.

Verify current assertion headers, service-token headers, and policy configuration in official Cloudflare docs before implementation. Missing permission fails closed.

## Cross-Flare Projection (Slice 2)

After authoritative append, record a small outbox item in the Flare Durable Object. A retryable alarm projects only summary metadata into D1 with the activity ID as an idempotency key. The Console labels feed freshness and links back to authoritative per-Flare activity.

Projection failure must not fail an already-committed activity write.

## Wrangler Starting Shape

Use [the template](../assets/templates/wrangler.flare-host.jsonc) only as a starting shape. Before implementing, verify current Wrangler schema, compatibility-date guidance, Durable Object SQLite migration syntax, Static Assets routing, R2/D1 bindings, and Access behavior against official documentation.

## Production Boundaries

- **D1:** bounded queries, cursor pagination, transactional target activation.
- **Durable Objects:** bounded payloads/results, explicit schema/config errors, no swallowed storage failures.
- **R2:** checksum verification before activation, immutable keys, normalized paths.
- **Access:** fail closed; never broaden policy after authorization errors.
- **Logs:** include request/Flare/revision/deployment identifiers, latency, status, and error code; exclude activity payloads, assertions, tokens, and cookies.

## Deferred Infrastructure

Add new primitives only with a proven capability contract:

- Queues/alarms beyond the slice-2 projection;
- R2 uploads and file scanning;
- WebSocket hibernation for realtime;
- Workers AI/AI Gateway;
- invitation email delivery;
- public abuse prevention;
- automated retention or cleanup.
