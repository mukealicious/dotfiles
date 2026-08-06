# Flare Platform Contract

This reference owns stable product entities, invariants, logical API seams, repository boundaries, and slice order. Cloudflare product mapping belongs in [cloudflare-native-blueprint.md](./cloudflare-native-blueprint.md); generated-client calls belong in [zero-config-api.md](./zero-config-api.md).

## System Boundary

```text
Generated Flare -> Runtime API ----\
Console ---------> Management API --> Packet, Catalog, Identity, Activity modules
CLI -------------> Management API --/
Cloudflare MCP --> infrastructure/account operations only
```

One Worker may expose both API groups initially, but authorization and client contracts remain separate.

- **Runtime API:** participant-scoped bootstrap and activity calls used by generated clients.
- **Management API:** owner-scoped catalog, deployment, activity, and export calls used by Console/CLI.
- **Console:** owner-only, read-oriented UI over the Management API.
- **CLI:** thin Management API client for plan/apply and machine-readable inspection.
- **Cloudflare MCP:** operator channel for infrastructure discovery/setup; never the runtime data plane.

The platform has no built-in agent. External agents use the CLI, just as humans do.

## Core Entities

| Entity | Contract |
|---|---|
| Flare | Stable identity, slug, title, purpose, owner subject, status, and activity history. |
| Revision | Immutable packet manifest, activity schemas, asset prefix, checksum, and creation provenance. |
| Deployment target | Stable environment/route and pointer to its active deployment. |
| Deployment | Immutable publication of one revision to one target, including approved plan identity. |
| Activity record | Append-only typed input with server-derived actor, time, scope, type version, revision, and deployment provenance. |

A redeploy appends a revision/deployment and atomically advances the stable target pointer. It never mutates deployment history or disconnects existing Flare activity.

## Invariants

- Stable IDs, not mutable slugs, address per-Flare storage.
- Revisions and deployments become immutable after publication.
- A revision declares at most one version of each activity type name.
- Runtime clients cannot invent activity types or submit actor/scope/time/type version.
- New writes from a superseded deployment are rejected with `deployment_superseded`.
- A previously committed same-key/same-request retry returns its original record even after redeploy.
- Reusing an idempotency key with different normalized input returns `idempotency_conflict`.
- No automatic archive, purge, migration, expiry mutation, or destructive cleanup.
- Packets are deterministic, bounded, framework-agnostic, and contain no secrets or environment state.

## Activity Contract

Every revision carries local JSON Schemas for its declared activity types:

```text
name: design.comment
version: 1
schema: activity-schemas/design.comment.v1.schema.json
```

The platform validates schemas when planning/applying a revision and validates payloads before append. V1 constraints:

- JSON Schema Draft 2020-12;
- local-fragment `$ref` only; no remote or cross-file references;
- one version per type name in a revision;
- 64 KiB maximum schema document;
- 16 KiB maximum activity payload;
- maximum schema/payload nesting depth of 16;
- unsupported validator keywords fail packet validation.

Activity is the first deep capability, not a claim that all future state is append-only. Mutable records, files, realtime, and AI require separate future contracts.

## Packet Boundary

```text
flare.json
activity-schemas/
  <type>.v<version>.schema.json
dist/
  index.html
  assets/
```

V1 limits the complete packet to 5 MiB. Paths are normalized and cannot escape the root. The file index is canonical and includes path, byte size, and SHA-256. See [steering-contract.md](./steering-contract.md) for manifest fields.

## Domain Modules

| Module | Small public surface | Complexity hidden |
|---|---|---|
| Packet | validate, plan, publish | path safety, schema compilation, limits, checksums, staged recovery |
| Catalog | list/get, deployment history, activate | stable targets, revision numbering, route uniqueness, lifecycle invariants |
| Identity | runtime actor, owner assertion | Access assertions, service-token headers, subject normalization |
| Activity | configure revision, append, list, export | validation, idempotency, quotas, cursor pagination, Markdown formatting |

API handlers and the CLI stay thin adapters around these modules.

## Runtime API

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/_flare/bootstrap` | Sanitized manifest, activity declarations, actor, SDK-managed deployment context |
| `POST` | `/_flare/activity` | Append `{ type, payload }` with `Idempotency-Key` and deployment context |
| `GET` | `/_flare/activity` | Cursor-paginated activity visible to the current actor |
| `GET` | `/_flare/client.js` | Pinned framework-independent SDK |

Generated clients do not use owner exports or catalog/deployment operations.

## Management API

| Method | Route group | Purpose |
|---|---|---|
| `GET` | `/api/manage/v1/flares*` | Catalog, detail, deployment history |
| `GET` | `/api/manage/v1/flares/:id/activity*` | Authoritative activity and JSON/Markdown export |
| `POST` | `/api/manage/v1/deployments/plan` | Validate packet metadata and return non-mutating changes plus `planHash` |
| `POST` | `/api/manage/v1/deployments/apply` | Revalidate bounded packet and apply the exact approved plan idempotently |

A plan hash binds packet bytes, target ID, and expected active-deployment pointer. Retrying an already-applied hash returns the original deployment; changed bytes or target state require a new plan.

## Storage Ownership

| Data | Authority |
|---|---|
| Flare/revision/target/deployment catalog | D1 |
| Per-Flare activity and revision activity definitions | One Durable Object with SQLite per stable Flare ID |
| Immutable revision manifest/schemas/assets | R2 |
| Cross-Flare recent-activity projection | D1 in slice 2, eventually consistent and rebuildable |

The per-Flare Durable Object is authoritative for activity. A future global feed is a projection, never a second write authority.

## Identity and Access

V1 is owner-only. Cloudflare Access protects the Console, Management API, and reference Flare.

- Browser Console uses interactive owner identity.
- CLI uses a dedicated least-privilege Access service token loaded from 1Password/private environment variables.
- Management handlers recheck authorization server-side.
- Generated clients cannot assign roles or actors.
- Public participants, invitations, anonymous writes, and app-level roles are deferred.

## Slice Order

1. **Owner feedback loop:** packet deploy, stable host, `design.comment`, private Console drilldown, CLI JSON/Markdown retrieval.
2. **Cross-Flare recent activity:** idempotent, eventually consistent D1 projection.
3. **Participants:** only after an explicit auth/privacy/abuse design.
4. **Capability modules:** files, mutable records, realtime, AI, or voice only when repeated use justifies each contract.

## Repository Boundary

This dotfiles repository owns:

- the `flares` skill and packet templates;
- conceptual Cloudflare adapter guidance;
- personal-only Cloudflare MCP setup.

The dedicated platform repository owns:

- Worker, Console, and CLI code;
- domain modules and SDK;
- D1 migrations and Durable Object schemas;
- Wrangler live configuration;
- tests, deployment automation, and operations.

Do not place runnable platform service code in dotfiles.
