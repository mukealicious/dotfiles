# Flare Platform — Implementation Spec

**Status:** Ready for repository bootstrap and task breakdown
**Type:** Feature plan / platform architecture
**Effort:** XL
**Date:** 2026-07-14
**Working repository name:** `flare-platform`
**Related:** [`specs/flares-cloudflare-platform-skill.md`](./flares-cloudflare-platform-skill.md)

## Problem Statement

### Who

The primary owner uses coding agents to create small interactive tools and artifacts, and wants both humans and external agents to inspect the resulting deployments and activity. Participants may later use shared Flares to leave comments, answer polls, submit forms, or attach voice/files.

### What

A static artifact is easy to generate but cannot safely provide identity, durable input, deployment history, or a reusable path back into agent context. Building a custom backend for every artifact would turn each Flare into a miniature application project.

The missing product is a small shared platform with elegant seams:

- generated Flares remain thin, portable static clients;
- a stable host owns deployment, identity, activity, persistence, and export;
- a private Console gives the owner an overview of Flares, revisions, deployments, and activity;
- a CLI gives humans and external agents the same owner-facing access without a custom MCP server;
- Cloudflare MCP remains an infrastructure/operator tool rather than the activity data plane.

### Why it matters

Without the platform, agent-generated interactive artifacts either stop at local HTML or accumulate bespoke infrastructure. Useful feedback also remains trapped in a live site instead of becoming portable JSON/Markdown that an agent can bring into notes, reports, or subsequent work.

### Evidence

The design discussion established a concrete owner workflow:

1. create and deploy a purpose-specific Flare;
2. collect typed activity such as comments, poll responses, or other agent-defined inputs;
3. see the Flare and its deployment in a private Console;
4. inspect and copy/export activity;
5. let an external agent retrieve the same activity through a CLI and bring it into another system.

## Product Boundary

A Flare is a tool that humans and external agents can leverage. The platform is **not** an agent runtime and contains no built-in agent, autonomous steward, or implicit AI processing.

```text
Human or coding agent
  -> creates portable Flare packet
  -> uses owner CLI to plan/apply a deployment

Participant
  -> uses generated Flare UI
  -> Runtime API
  -> deterministic platform modules

Owner
  -> private Flare Console
  -> Management API
  -> same deterministic platform modules

External agent
  -> owner CLI
  -> Management API
  -> exports activity into notes/workflows

Cloudflare MCP
  -> docs/account/resource setup only
```

## Architecture Principles

1. **Thin generated clients.** Flare code owns presentation and purpose-specific interaction, not identity, persistence, credentials, quotas, or Cloudflare topology.
2. **Deep activity module.** Callers append and list typed activity; the module hides actor derivation, validation, ordering, idempotency, storage, and export.
3. **Stable identity, immutable history.** A Flare persists across immutable revisions and deployments. Activity records its originating revision and deployment.
4. **Logical seams before physical services.** Runtime and Management APIs have different authorization contracts but may live in one Worker until pressure proves a split useful.
5. **One shared host.** Many ordinary Flares share one Worker; each Flare’s activity is isolated in its own Durable Object.
6. **Explicit lifecycle.** No automatic archive, purge, migration, or destructive cleanup.
7. **Portable output.** Activity can always leave the platform as JSON or Markdown.
8. **External agents use ordinary tools.** The first agent interface is a CLI, not a custom MCP server.

## Proposed Solution

Build a TypeScript/pnpm Cloudflare platform with five stable modules:

- **Packet module:** validates a portable Flare packet and publishes immutable revision assets.
- **Catalog module:** owns Flare identity, revisions, deployments, routes, and explicit lifecycle state.
- **Activity module:** owns revision-declared activity schemas and per-Flare append/list/export behavior.
- **Identity module:** derives participant/owner actors and enforces Runtime versus Management authorization.
- **Presentation adapters:** generated-client SDK, private Console, and CLI.

Use one Cloudflare Worker initially. Workers Static Assets serve the stable Console and client SDK. R2 stores generated revision assets. D1 stores the global catalog. One Durable Object with SQLite per stable Flare ID stores its activity and activity schemas.

## First Vertical Slice

**Slice:** Deploy an owner-only feedback Flare, submit one typed design comment, inspect it in the private Console, and retrieve the same record as Markdown/JSON through the CLI.

**Risk proven:** A framework-independent generated client, shared Worker, D1 catalog, R2 packet, Durable Object activity store, Access identity, Console, and CLI can form one coherent path without per-Flare backend code.

**Includes:**

- one portable packet with `design.comment` activity;
- plan/apply deployment through the CLI;
- stable Flare plus revision and deployment records;
- shared Worker asset routing;
- owner-only Cloudflare Access;
- `flare.activity.append/list`;
- per-Flare Console activity drilldown;
- CLI list/show/activity output;
- one important failure path: invalid or duplicate activity submission.

**Defers:**

- cross-Flare activity feed;
- public/unlisted/invited participants;
- voice/files and other attachments;
- realtime;
- generic mutable records/database APIs;
- Console deployment mutations;
- automatic lifecycle behavior;
- migration/import;
- custom MCP;
- AI or built-in agents.

## Repository Topology

Use a pnpm workspace and project-local mise configuration:

```text
flare-platform/
  mise.toml
  package.json
  pnpm-lock.yaml
  pnpm-workspace.yaml
  wrangler.jsonc
  apps/
    host-worker/          # shared Worker, DO, bindings, runtime/manage routes
    console/              # private read-oriented Console
  packages/
    contracts/            # manifests, entities, API types, errors
    client/               # browser `flare` SDK
    cli/                  # owner/agent CLI
    packet/               # packet validation and hashing
  examples/
    feedback-flare/       # first framework-light reference packet
  migrations/
    d1/
  specs/
    flare-platform.md     # copy of this accepted plan
```

Defaults:

- Node and pnpm versions recorded in `mise.toml`.
- `packageManager` recorded in root `package.json`.
- TypeScript throughout platform packages.
- Wrangler owns local Cloudflare emulation and deployment.
- Generated Flare packets remain framework-agnostic; the first example should use the least tooling that keeps TypeScript and asset builds straightforward.
- Exact current Cloudflare config/test package syntax must be verified against official docs during repository bootstrap.

## Portable Packet Contract

```text
flare.json
activity-schemas/
  design.comment.v1.schema.json
dist/
  index.html
  assets/
```

Example `flare.json`:

```json
{
  "schemaVersion": 1,
  "slug": "design-feedback",
  "title": "Design feedback",
  "purpose": "Collect focused comments on a design",
  "capabilities": {
    "activity": true
  },
  "activityTypes": [
    {
      "name": "design.comment",
      "version": 1,
      "label": "Design comment",
      "schema": "activity-schemas/design.comment.v1.schema.json"
    }
  ],
  "auth": {
    "mode": "owner-access"
  },
  "dataPolicy": {
    "captured": ["design comments"],
    "exportFormats": ["json", "markdown"]
  },
  "limits": {
    "maxActivityRecords": 1000,
    "maxActivityPayloadBytes": 16384
  }
}
```

Packet rules:

- Paths are relative, normalized, and may not escape the packet root.
- `dist/index.html` is required.
- Every activity type references a bundled JSON Schema.
- Type names match `^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$`.
- A revision declares at most one version of any activity type name; Runtime append derives that version from the active revision.
- A type’s `(name, version)` pair is immutable after publication.
- The packet contains no secrets, credentials, owner email, environment-specific route, or mutable deployment state.
- The CLI computes a deterministic packet checksum; the platform verifies the uploaded file index before creating a revision.
- V1 limits the complete packet to 5 MiB and each declared activity schema to 64 KiB. Larger upload sessions are a later capability, not an unbounded V1 path.

### Activity schema policy

V1 accepts JSON Schema Draft 2020-12 with these platform constraints:

- `$ref` may target only a local fragment within the same schema document; remote and cross-file references are rejected.
- Schemas and submitted payloads have a maximum nesting depth of 16.
- Unsupported validator keywords fail packet validation rather than being silently ignored.
- The platform compiles every schema when planning/applying a revision; runtime writes never compile untrusted schemas on demand.
- `maxActivityPayloadBytes` may lower, but never exceed, the platform’s 16 KiB V1 ceiling.

## Core Data Model

### Contract types

```ts
type FlareStatus = "draft" | "active" | "archived";
type RevisionStatus = "staged" | "ready";
type DeploymentEnvironment = "preview";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

type Flare = {
  id: string;
  slug: string;
  title: string;
  purpose: string;
  ownerSubject: string;
  status: FlareStatus;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
};

type ActivityTypeDefinition = {
  name: string;
  version: number;
  label: string;
  schema: object;
};

type FlareRevision = {
  id: string;
  flareId: string;
  number: number;
  status: RevisionStatus;
  manifest: object;
  activityTypes: ActivityTypeDefinition[];
  bundlePrefix: string;
  packetSha256: string;
  createdBy: string;
  createdAt: string;
};

type Deployment = {
  id: string;
  flareId: string;
  revisionId: string;
  targetId: string;
  planHash: string;
  deployedBy: string;
  deployedAt: string;
};

type DeploymentTarget = {
  id: string;
  flareId: string;
  environment: DeploymentEnvironment;
  route: string;
  activeDeploymentId?: string;
  createdAt: string;
  updatedAt: string;
};

type Actor = {
  kind: "owner" | "participant" | "agent";
  subject: string;
  displayName?: string;
  email?: string;
};

type ActivityRecord = {
  id: string;
  flareId: string;
  revisionId: string;
  deploymentId: string;
  type: string;
  typeVersion: number;
  actor: Actor;
  payload: JsonValue;
  idempotencyKey: string;
  requestSha256: string;
  createdAt: string;
  supersedesId?: string;
  redactedAt?: string;
};
```

V1 records are append-only. A correction is another activity record that may reference `supersedesId`. Redaction/purge contracts are reserved but not implemented in the first slice.

### D1 catalog

D1 is authoritative for global metadata, not activity payloads:

```sql
CREATE TABLE flares (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  purpose TEXT NOT NULL,
  owner_subject TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT
);

CREATE TABLE flare_revisions (
  id TEXT PRIMARY KEY,
  flare_id TEXT NOT NULL,
  revision_number INTEGER NOT NULL,
  status TEXT NOT NULL,
  manifest_json TEXT NOT NULL,
  activity_types_json TEXT NOT NULL,
  bundle_prefix TEXT NOT NULL,
  packet_sha256 TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(flare_id, revision_number),
  UNIQUE(flare_id, packet_sha256)
);

CREATE TABLE deployments (
  id TEXT PRIMARY KEY,
  flare_id TEXT NOT NULL,
  revision_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  plan_hash TEXT NOT NULL UNIQUE,
  deployed_by TEXT NOT NULL,
  deployed_at TEXT NOT NULL
);

CREATE TABLE deployment_targets (
  id TEXT PRIMARY KEY,
  flare_id TEXT NOT NULL,
  environment TEXT NOT NULL,
  route TEXT NOT NULL UNIQUE,
  active_deployment_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(flare_id, environment)
);
```

`deployment_targets` owns the stable route and current release pointer. `deployments` remains an append-only history, so redeploying a Flare can reuse `/f/<slug>/` without mutating or duplicating route ownership.

Use application-level foreign-key validation if current D1/SQLite deployment practices make cross-table foreign keys operationally awkward; do not silently accept dangling IDs.

### Durable Object SQLite

One object is addressed by stable Flare ID, never mutable slug:

```sql
CREATE TABLE revision_activity_types (
  revision_id TEXT PRIMARY KEY,
  definitions_json TEXT NOT NULL,
  configured_at TEXT NOT NULL
);

CREATE TABLE activity_records (
  id TEXT PRIMARY KEY,
  revision_id TEXT NOT NULL,
  deployment_id TEXT NOT NULL,
  type TEXT NOT NULL,
  type_version INTEGER NOT NULL,
  actor_json TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  request_sha256 TEXT NOT NULL,
  created_at TEXT NOT NULL,
  supersedes_id TEXT,
  redacted_at TEXT
);

CREATE INDEX activity_records_created
  ON activity_records(created_at, id);
CREATE INDEX activity_records_type_created
  ON activity_records(type, created_at, id);
```

The Activity module hashes the normalized deployment context, type, payload, and actor subject, then handles append in this order:

1. If the idempotency key already exists with the same request hash, return the original record even if that deployment has since been superseded.
2. If the key exists with a different request hash, return `idempotency_conflict`.
3. If the key is new but its deployment context is no longer active, return `deployment_superseded`.
4. Validate type/version/payload against the configured immutable revision definitions and insert.

This preserves safe retries without allowing new writes from stale tabs. Listing uses an opaque cursor derived from `(created_at, id)`, not offset pagination.

### R2 revision assets

```text
flares/<flare-id>/revisions/<revision-number>/flare.json
flares/<flare-id>/revisions/<revision-number>/activity-schemas/...
flares/<flare-id>/revisions/<revision-number>/dist/...
```

Revision prefixes are immutable. Old revisions remain until an explicit future purge operation. Cleanup is not automatic.

## Deep Module Interfaces

| Module | Caller-facing interface | Knowledge hidden |
|---|---|---|
| `PacketService` | `validate(packet)`, `publish(packet, target?)` | path safety, schema resolution, file limits, checksums, R2 keys, staged deploy recovery |
| `CatalogService` | `listFlares()`, `getFlare()`, `getDeployments()`, `activateRevision()` | D1 schema, revision numbering, stable deployment targets, route uniqueness, lifecycle invariants |
| `ActivityService` | `configureRevision()`, `append()`, `list()`, `export()` | DO IDs, SQLite, JSON Schema validation, actors, ordering, idempotency, cursors |
| `IdentityService` | `resolveRuntimeActor()`, `requireOwner()` | Access assertions, session details, role mapping, sanitized identity |
| Runtime API | `bootstrap`, `activity.append`, `activity.list` | routing, active deployment resolution, storage products, credentials |
| Management API | catalog/deployment/activity reads plus packet publication | D1/DO/R2 topology, owner authorization, export formatting |
| CLI | `deploy`, `list`, `show`, `activity` | HTTP auth/session mechanics, pagination, output formatting |

The deletion test should hold: removing one of these modules would force its hidden rules into multiple callers.

## API Contracts

All errors use:

```json
{
  "error": {
    "code": "activity_schema_invalid",
    "message": "The submitted design.comment payload is invalid.",
    "retryable": false,
    "requestId": "req_..."
  }
}
```

Initial stable codes:

- `auth_required`
- `forbidden`
- `flare_not_found`
- `deployment_not_found`
- `deployment_superseded`
- `activity_type_unknown`
- `activity_schema_invalid`
- `activity_limit_exceeded`
- `idempotency_conflict`
- `packet_invalid`
- `revision_conflict`
- `deployment_partial_failure`

### Runtime API

Route group: `/_flare/*`, scoped from the current deployment route.

| Method | Route | Contract |
|---|---|---|
| `GET` | `/_flare/bootstrap` | Sanitized manifest, declared activity types, current actor, and an SDK-managed deployment context |
| `POST` | `/_flare/activity` | Append `{ type, payload }`; requires `Idempotency-Key` and the bootstrap-derived deployment context; server derives identity/time/scope fields |
| `GET` | `/_flare/activity?type=&cursor=&limit=` | Cursor-paginated activity visible to the current actor |
| `GET` | `/_flare/client.js` | Pinned browser SDK compatible with the bootstrap schema version |

Browser SDK:

```ts
flare.bootstrap(): Promise<FlareBootstrap>;
flare.identity.me(): Promise<Actor>;
flare.activity.append<T>(
  type: string,
  payload: T,
  options: { idempotencyKey: string }
): Promise<ActivityRecord>;
flare.activity.list<T>(options?: {
  type?: string;
  cursor?: string;
  limit?: number;
}): Promise<{ items: ActivityRecord[]; nextCursor?: string }>;
```

Generated Flare code does not choose actor, timestamp, Flare ID, revision ID, deployment ID, or type version. The SDK automatically sends the deployment context returned by bootstrap. If the stable route has been redeployed since that context was issued, the platform returns `deployment_superseded`; the client reloads instead of writing old-schema activity into the new deployment.

### Management API

Route group: `/api/manage/v1/*`, owner-scoped and protected independently from Runtime routes.

| Method | Route | Contract |
|---|---|---|
| `GET` | `/api/manage/v1/flares` | Cursor-paginated Flare catalog with active deployment summary |
| `GET` | `/api/manage/v1/flares/:id` | Flare detail and latest revision/deployment |
| `GET` | `/api/manage/v1/flares/:id/deployments` | Immutable deployment history |
| `GET` | `/api/manage/v1/flares/:id/activity` | Authoritative per-Flare activity, cursor-paginated |
| `GET` | `/api/manage/v1/flares/:id/activity/export?format=json\|markdown` | Portable owner export |
| `POST` | `/api/manage/v1/deployments/plan` | Validate manifest, schemas, canonical file index, and packet hash; return a non-mutating plan plus `planHash` |
| `POST` | `/api/manage/v1/deployments/apply` | Accept the bounded multipart packet and approved `planHash`; revalidate, publish, and activate idempotently |

The first Console uses only `GET` routes. The first CLI uses both read routes and explicit plan/apply deployment routes.

#### V1 packet transport

`plan` sends JSON containing the manifest, activity schema documents, canonical file index (`path`, `size`, `sha256`), packet SHA-256, optional target Flare, target ID, and expected active-deployment pointer. The server returns the exact proposed changes and a deterministic `planHash` over both packet bytes and target preconditions without writing state.

`apply` sends the approved `planHash` plus the same packet as bounded multipart data. The server first checks for an existing deployment with that unique `planHash`; if found, it returns the original successful result even if the response to the first apply was lost. Otherwise it rebuilds the canonical index, hashes every file, verifies the expected target pointer, recomputes the plan, and rejects any mismatch before writing R2. This binds the applied bytes and release target to the plan a human reviewed without adding mutable server-side plan state.

### CLI

```text
flare deploy <packet-dir> --plan [--flare <id-or-slug>]
flare deploy <packet-dir> --apply --approved-plan <hash> [--flare <id-or-slug>]
flare list [--status active|archived] [--json]
flare show <id-or-slug> [--json]
flare activity <id-or-slug> [--type <name>] [--since <duration>] [--format table|json|markdown]
```

Rules:

- `--plan` never mutates local or remote state.
- `--apply` requires the approved plan hash and fails if packet bytes or remote target state changed after planning.
- Retrying an already-applied plan hash returns the original deployment; it does not fail merely because that apply advanced the target pointer.
- Machine formats write only payload to stdout; diagnostics go to stderr.
- Commands return non-zero on partial/failed operations and identify what was preserved.
- The CLI never uses Cloudflare account credentials for runtime/catalog access. It authenticates to the Management API with one dedicated, least-privilege Access service token loaded from private environment variables or 1Password CLI; it never stores or prints that token.

## Hosting and Routing

V1 uses path routing under one configured platform host:

```text
<platform-host>/console                  -> private Console
<platform-host>/f/<slug>/                -> active Flare revision
<platform-host>/f/<slug>/assets/*        -> revision assets from R2
<platform-host>/f/<slug>/_flare/*        -> Runtime API
<platform-host>/api/manage/v1/*          -> Management API
```

A custom/wildcard subdomain model can be added later without changing stable Flare IDs. The exact DNS hostname is deployment configuration and requires explicit approval; the route contract is path-based in V1.

Runtime route resolution:

1. normalize slug and asset path;
2. resolve the stable deployment target and its active deployment/revision from D1;
3. reject archived/missing Flare routes;
4. route `/_flare/*` to deterministic API handlers;
5. serve static assets from the immutable R2 revision prefix;
6. never expose bucket keys or Durable Object IDs to the client.

## Deployment Transaction and Failure Behavior

Cloudflare bindings do not provide one transaction spanning R2, D1, and Durable Objects. `PacketService.publish()` therefore uses an idempotent staged sequence:

1. return the existing deployment immediately if the unique approved plan hash was already applied;
2. validate packet, canonical file index, and expected target pointer locally and server-side;
3. write immutable revision assets to a new R2 prefix;
4. create/reuse a D1 `staged` revision keyed by Flare ID and packet checksum;
5. configure the Flare Durable Object with immutable activity type definitions;
6. in one D1 transaction, append the immutable deployment keyed by plan hash, flip the stable target’s active-deployment pointer, and mark the revision `ready`;
7. return the active route and exact resource IDs.

On failure:

- the previously active deployment remains active;
- staged R2/D1 state is reported rather than silently deleted;
- retrying the same packet checksum is idempotent;
- the CLI states what changed, what did not, and the manual recovery path;
- no retry broadens permissions or makes the route public.

A repair/purge command is not part of V1. During early development, partial staged resources are inspected and handled deliberately.

## Identity and Authorization

V1 is owner-only:

- Cloudflare Access protects the Console, Management API, and reference Flare route.
- The browser Console uses the owner’s interactive Access identity.
- The CLI uses a separate Access service token accepted only by the Management API policy. The token is stored outside the repo and injected with private environment variables or `op run`.
- `IdentityService` validates user assertions or service-token headers server-side and maps both to explicit owner/automation subjects.
- Browser clients cannot assign roles or actor fields.
- Management authorization is checked again inside API handlers; hiding Console routes is insufficient.
- Access/account/DNS setup is an operator action through Cloudflare MCP or Cloudflare configuration, with explicit approval before mutation.

Repository bootstrap must verify the current Cloudflare Access service-token headers and policy configuration against official documentation before hosted setup. Missing permission fails closed; the implementation must not broaden the Access policy automatically.

Later participant modes are adapters behind `IdentityService`; they do not change `ActivityRecord`.

## Console Scope

### Index

Display:

- title and slug;
- Flare status;
- active revision number;
- active preview route;
- deployment timestamp.

Actions:

- open Flare;
- navigate to detail.

### Detail

Display:

- purpose and manifest summary;
- immutable revision/deployment history;
- cursor-paginated activity;
- type, actor, timestamp, and generic safe payload rendering.

Actions:

- filter by activity type;
- copy selected activity as Markdown or JSON;
- copy/export the current filtered set;
- open the active Flare.

V1 does not publish, redeploy, archive, redact, purge, or edit schemas from the Console.

## Breadboard

### Operator stories

1. **Create/deploy:** A human or coding agent in a local workspace validates a Flare packet, shows a deployment plan, receives approval, and creates an owner-only deployment.
2. **Collect/review:** The owner submits a design comment in the deployed Flare, opens the Console, selects that Flare, and sees the authoritative activity.
3. **Agent handoff:** An external agent runs the CLI, retrieves Markdown/JSON activity, and uses that output as context elsewhere.

### Places

| # | Place | Description |
|---|---|---|
| P1 | Author workspace | Local packet source/build output and CLI used by a human or coding agent. |
| P2 | Deployed Flare | Purpose-specific generated client served from an immutable revision. |
| P3 | Flare Console index | Private list of Flares and active deployment summaries. |
| P4 | Flare Console detail | Private deployment history and per-Flare activity view. |
| P5 | Runtime API | Participant-scoped Worker route group for bootstrap and activity. |
| P6 | Management API | Owner-scoped Worker route group used by Console and CLI. |

### UI affordances

| # | Place | Component | Affordance | Control | Wires Out | Returns To |
|---|---|---|---|---|---|---|
| U1 | P1 | CLI | deployment plan | command | -> N1 | -> U2 |
| U2 | P1 | CLI | rendered plan/result | display | - | <- N1, <- N2 |
| U3 | P2 | Feedback form | comment input and submit | submit | -> N3 | - |
| U4 | P2 | Feedback form | accepted/error state | display | - | <- N3 |
| U5 | P3 | Catalog | Flare/deployment rows | display | - | <- N6 |
| U6 | P3 | Catalog row | open Flare | click | -> P2 | - |
| U7 | P3 | Catalog row | inspect detail | click | -> P4 | - |
| U8 | P4 | Deployment panel | revision/deployment history | display | - | <- N7 |
| U9 | P4 | Activity panel | activity list and type filter | load/filter | -> N8 | <- N8 |
| U10 | P4 | Activity panel | copy/export Markdown or JSON | click | -> N9 | <- S5 |

### Code affordances

| # | Place | Component | Affordance | Control | Wires Out | Returns To |
|---|---|---|---|---|---|---|
| N1 | P1 | CLI | `planDeployment()` | command | -> N4 | -> U2 |
| N2 | P1 | CLI | `applyDeployment()` | approved command | -> N5 | -> U2 |
| N3 | P2 | Browser SDK | `activity.append()` | call | -> N10 | -> U4 |
| N4 | P6 | Packet module | `validatePlan()` | request | -> S1, -> S3 | -> N1 |
| N5 | P6 | Packet/Catalog modules | `publishRevision()` | request | -> S2, -> S3, -> N11 | -> N2 |
| N6 | P6 | Catalog module | `listFlares()` | request | -> S3 | -> U5 |
| N7 | P6 | Catalog module | `getDeploymentHistory()` | request | -> S3 | -> U8 |
| N8 | P6 | Activity module | `listActivity()` | request | -> S4 | -> U9 |
| N9 | P4 | Console formatter | `formatActivity()` | click | -> S5 | -> U10 |
| N10 | P5 | Runtime handler | `appendActivity()` | request | -> N12 | -> N3 |
| N11 | P6 | Activity module | `configureRevision()` | call | -> S4 | -> N5 |
| N12 | P5 | Activity module | `append()` | call | -> S4 | -> N10 |

### Data stores

| # | Place | Store | Description | Wires Out | Returns To |
|---|---|---|---|---|---|
| S1 | P1 | Flare packet | Manifest, activity schemas, and built static assets. | -> N4, -> N5 | - |
| S2 | P6 | R2 revision prefix | Immutable manifest/schema/static assets for each revision. | - | -> deployed asset routing |
| S3 | P6 | D1 catalog | Flare, revision, deployment, and route metadata. | - | -> N4, -> N5, -> N6, -> N7 |
| S4 | P5/P6 | Flare Durable Object SQLite | Activity schemas and authoritative append-only records. | - | -> N8, -> N11, -> N12 |
| S5 | P4 | Clipboard/download | Owner-selected Markdown or JSON export. | - | -> U10 |

## Vertical Slice Roadmap

| # | Slice | Mechanism | Demo |
|---|---|---|---|
| V1 | Owner feedback loop | Packet deploy, shared host, Access identity, typed activity, Console drilldown, CLI retrieval | “Deploy the feedback packet, submit a comment, see it in Console, and retrieve the same record with the CLI.” |
| V2 | Cross-Flare recent activity | Durable projection outbox plus idempotent D1 activity summary projection | “Submit activity to two Flares and see both appear shortly afterward in one Console feed.” |
| V3 | Shared participants | Identity adapter for one explicitly chosen participant mode | “An approved non-owner submits activity with a server-derived actor.” |
| V4 | Attachments and voice | Separate file capability with R2 objects referenced by activity | “Submit an activity record with a bounded attachment and export its metadata.” |
| V5 | Explicit lifecycle commands | Owner CLI archive and later explicit purge with plan/apply semantics | “Archive a Flare without deleting history, then verify writes are blocked and exports remain available.” |
| V6 | Mutable records, only if proven | Separate document/record capability rather than overloading activity | “A concrete Flare updates current state without making generated clients understand event reduction.” |

### V2 projection contract

Per-Flare activity remains authoritative. To add the global feed:

1. append activity and a projection-outbox row in the same Durable Object SQLite transaction;
2. schedule a Durable Object alarm;
3. idempotently upsert a minimal activity summary into D1;
4. remove/mark the outbox row only after success;
5. retry failed alarms without duplicating projection rows.

The global feed may lag by seconds. Opening an item always reads authoritative detail through `ActivityService`.

## Scope and Ordered Deliverables

| Deliverable | Effort | Depends On |
|---|---:|---|
| D1. Bootstrap pnpm/mise workspace, Wrangler app, contracts package, test harness, and local bindings | M | - |
| D2. Implement packet schema, validator, canonical file index, checksum, and reference feedback packet | M | D1 |
| D3. Implement D1 catalog schema and `CatalogService` for Flare/revision/deployment reads | M | D1 |
| D4. Implement R2 revision publication and shared static routing with staged failure behavior | L | D2, D3 |
| D5. Implement `ActivityService` and Flare Durable Object schema/configure/append/list/export | L | D1, D2 |
| D6. Implement Runtime bootstrap/activity routes and browser SDK | M | D4, D5 |
| D7. Implement owner Management API and plan/apply deployment path | L | D3–D5 |
| D8. Implement read-oriented Console index/detail/copy/export path | L | D7 |
| D9. Implement CLI deploy/list/show/activity commands | L | D2, D7 |
| D10. Integrate owner-only Cloudflare Access and verify hosted preview after explicit approval | M | D6–D9 |
| D11. Add end-to-end tests, structured errors/logs, recovery documentation, and first-slice demo script | M | D6–D10 |

D2–D5 may proceed partly in parallel after D1, but V1 is complete only when D6–D11 demonstrate the end-to-end loop.

## Non-Goals

- A universal application builder or per-Flare custom backend runtime.
- A built-in agent, Agents SDK steward, autonomous action loop, or generic AI proxy.
- A custom MCP server for Flare data.
- Public, unlisted, invite-link, or arbitrary-email participant auth in V1.
- Global activity feed in V1.
- Generic CRUD/document database in V1.
- File uploads, voice, realtime, notifications, analytics, workflows, or queues in V1.
- Automatic expiry, archive, cleanup, purge, migration, or data copying.
- Console-based deployment or lifecycle mutation.
- Custom domains/wildcard subdomains beyond the one approved platform host.

## Acceptance Criteria

### Packet and deployment

- [ ] A framework-independent feedback packet validates locally and server-side.
- [ ] `flare deploy <dir> --plan` reports intended Flare/revision/route/resource changes without mutating state.
- [ ] Applying requires the exact approved `planHash`; changed packet bytes or target state force a new plan.
- [ ] The server re-hashes every multipart packet file before any revision asset is published.
- [ ] Applying a new packet creates one immutable revision and one deployment through an idempotent path.
- [ ] Retrying an already-applied `planHash` after a lost response returns the original deployment without changing the target again.
- [ ] Reapplying the same packet checksum does not create duplicate revisions.
- [ ] Redeploying a changed packet creates a new revision/deployment, atomically repoints the stable route, and preserves prior activity and deployment history.
- [ ] A failed deployment leaves the previously active deployment working and reports staged state precisely.

### Runtime and activity

- [ ] The generated Flare contains no Cloudflare credentials, storage names, Durable Object IDs, or model keys.
- [ ] A valid `design.comment` payload is stored with server-derived Flare, revision, deployment, actor, and timestamp fields.
- [ ] An undeclared activity type or schema-invalid payload receives a stable non-retryable error.
- [ ] Retrying the same `Idempotency-Key` returns the original result without a duplicate record.
- [ ] Reusing an idempotency key with different normalized input returns `idempotency_conflict`.
- [ ] Retrying a previously successful same-key/same-request append after redeploy still returns its original record.
- [ ] Activity schemas reject remote `$ref`s, unsupported keywords, and over-limit schema/payload depth or size.
- [ ] An old browser tab receives `deployment_superseded` after redeploy and cannot write under the new revision until reloaded.
- [ ] Per-Flare activity listing is cursor-paginated and deterministic.

### Console and CLI

- [ ] The owner-only Console lists the reference Flare and its active deployment from D1.
- [ ] The Console detail page shows immutable deployment history and authoritative activity from the Durable Object.
- [ ] The Console copies selected/filtered activity as valid Markdown or JSON.
- [ ] `flare activity <slug> --format markdown|json` returns the same records visible in the Console.
- [ ] The CLI authenticates through a dedicated least-privilege Access service token loaded outside the repository; logs and errors never reveal it.
- [ ] The Console exposes no publish, archive, purge, schema-edit, or AI action in V1.

### Safety and lifecycle

- [ ] Runtime and Management routes enforce distinct server-side authorization contracts.
- [ ] No Cloudflare account mutation, DNS change, Access policy, or hosted deploy occurs without explicit owner approval.
- [ ] No job automatically archives, purges, migrates, summarizes, or otherwise mutates a Flare.
- [ ] Activity can be exported before any future destructive lifecycle action exists.

## Test Strategy

| Layer | What | How |
|---|---|---|
| Unit | Packet paths, type-name rules, manifest/schema resolution, canonical checksums | Table-driven tests against valid and malicious packet fixtures |
| Unit | Activity schema validation, cursor encoding, idempotency, Markdown formatting | Public module interfaces with deterministic actors/time |
| Unit | Catalog lifecycle invariants | Test revision numbering, stable target uniqueness, and atomic active-deployment pointer changes |
| Integration | Worker ↔ D1/R2/DO bindings | Cloudflare-supported local test pool with production-shaped migrations/bindings |
| Integration | Staged deployment failure | Inject failure after R2, D1, and DO steps; assert previous deployment survives and retry is idempotent |
| Integration | Runtime/Management authorization | Valid owner assertion, missing assertion, wrong subject, and client-forged actor fields |
| Integration | CLI service-token authorization | Valid scoped token, missing headers, wrong Access audience, and secret-redaction checks |
| Browser E2E | Feedback submission and Console review | Launch local stack, submit comment, navigate Console, copy/export result |
| Browser E2E | Stale deployment context | Keep an old tab open, redeploy, assert append is rejected with reload guidance |
| Browser E2E | Lost activity response across redeploy | Commit an append, drop its response, redeploy, and assert the same-key retry replays the original record |
| CLI E2E | Plan/apply/list/show/activity | Run packaged CLI against local Management API and assert stdout/stderr/exit codes |
| CLI E2E | Lost apply response | Commit an apply, drop its response, retry the same plan hash, and assert the original deployment is returned |
| Hosted smoke | Access-protected preview | After approval, verify route, identity, append/list, Console, CLI, and previous-revision history |

Tests should cross the same public seams as real callers. Mock only true external boundaries such as Access assertions and time; use local Cloudflare bindings for D1/R2/DO behavior.

## Production Boundaries

| Concern | Contract |
|---|---|
| Idempotency | Activity stores a normalized request hash with each key; same key/same request replays, while same key/different request conflicts. Deployment stores a unique approved plan hash so lost-response retries replay the original result; revisions still deduplicate by Flare ID and packet checksum. |
| Partial failure | Deployment is staged and retryable; the previous active revision remains authoritative until final activation. |
| Validation | Packet, path, activity type, JSON Schema, payload size, and record-count limits are server-enforced. |
| Authorization | Browser identity and CLI service tokens are validated server-side; generated clients never choose actor/role/scope fields and secrets never enter packets/logs. |
| Pagination | Catalog and activity use bounded cursor pagination. No “load all” API path. |
| Observability | Every response has a request ID; structured logs identify Flare/revision/deployment without logging private payloads. |
| Recovery | Errors state what changed, impact, preserved state, staged resources, and the safe next command. |
| Cost/capacity | One ordinary Flare maps to one DO and bounded R2/D1 records; a single unusually hot Flare is treated as a separate scaling problem. |

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---:|---:|---|
| First slice is still large across five Cloudflare surfaces | High | High | Keep one activity type, one auth mode, one route shape, one Console view, and one failure path; cut polish before cutting real integration. |
| Cross-store deployment leaves staged artifacts | Medium | Medium | Immutable prefixes, staged D1 state, checksum idempotency, precise errors, no automatic destructive cleanup. |
| Dynamic schemas make Console rendering unsafe or unreadable | Medium | Medium | Escape all content, render a bounded generic JSON fallback, and keep purpose-specific rendering inside the generated Flare. |
| Activity becomes an accidental universal database | Medium | High | Keep append-only semantics explicit and add a separate mutable-record capability only when a concrete Flare requires it. |
| Access setup blocks local progress | Medium | Medium | Complete local identity-adapter tests first; gate hosted Access/DNS work as the final approved integration step. |
| Shared Worker routing leaks assets across Flares | Low | High | Resolve stable IDs server-side, normalize paths, bind R2 prefixes to immutable revision IDs, and test traversal/cross-Flare requests. |
| Stable route redeploy lets an old tab submit against the wrong schema | Medium | High | SDK sends bootstrap deployment context; reject superseded deployment writes and require reload. |
| CLI automation token becomes an overpowered Cloudflare credential | Low | High | Use a dedicated Access service token scoped only to the Management API, inject through 1Password/private env, redact headers, and fail closed. |
| CLI becomes a second business-logic implementation | Medium | Medium | Keep CLI as a thin Management API adapter; domain behavior stays server-side. |
| Global feed pressure causes premature dual writes | Medium | Medium | Defer to V2; use a durable outbox projection while preserving DO authority. |

## Trade-offs Made

| Chose | Over | Because |
|---|---|---|
| One shared Worker | One Worker per Flare | Lower deployment/operations overhead; per-Flare DOs provide state isolation and natural horizontal distribution. |
| Activity-first API | Generic CRUD database | Comments, polls, and submissions fit one deep append/list/export capability and prove the core loop. |
| Stable Flare + immutable revisions/deployments + mutable target pointer | Treating each deploy as a new app or mutating deployment history | Preserves provenance while one stable route can advance atomically. |
| D1 catalog + DO activity | Central D1 activity table | Per-Flare ordering, future realtime, quotas, and isolation fit the DO ownership model. |
| Per-Flare activity in V1 | Immediate global feed | Avoids dual-write/projection machinery before the core path is proven. |
| Eventually consistent D1 projection in V2 | Distributed synchronous writes | Keeps authoritative writes reliable while allowing a responsive cross-Flare overview. |
| Owner CLI | Custom MCP | Works for humans and agents with a smaller, testable interface and no additional protocol server. |
| Portable packet | Prescribed frontend framework | Generated Flares can use the simplest tool appropriate to their UI without changing the host contract. |
| Explicit plan/apply | Implicit deployment | Supports human approval and makes agent-driven mutations reviewable. |
| No automatic lifecycle | Scheduled archive/purge | Matches owner intent and avoids silent loss. |

## Open Questions

None block repository bootstrap or V1 task breakdown. Later slices must separately shape participant auth, attachment scanning/retention, mutable records, explicit purge semantics, and any custom MCP adapter before implementation.

## Success Metrics

- A human or agent can create and validate a feedback Flare packet without knowing Cloudflare storage topology.
- One approved CLI operation deploys the packet to the shared host and reports a stable Flare/revision/deployment identity.
- A submitted comment appears immediately in that Flare’s Console detail and can be retrieved through the CLI.
- Redeploying presentation code does not fork or lose activity history.
- The generated client, Console, and CLI contain no duplicated storage/auth/lifecycle logic.
- No platform behavior depends on a model call or built-in agent.
- The first implementation teaches whether activity, Console, and external-agent retrieval are valuable before files, realtime, global feeds, or mutable databases are built.
