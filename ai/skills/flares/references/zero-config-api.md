# Generated-Client Runtime API

## Purpose

Generated Flares use one small, framework-independent SDK. They do not provision storage, handle Cloudflare credentials, submit trusted identity fields, or call the owner Management API.

```html
<script src="./_flare/client.js"></script>
```

```js
await flare.activity.append('design.comment', {
  body: 'The empty state needs a clearer next action.',
  target: 'results-panel'
}, {
  idempotencyKey: crypto.randomUUID()
})
```

Activity is the first deep capability. The SDK stays small while the platform hides identity, schema lookup, validation, persistence, idempotency, quotas, provenance, and export.

## V1 Surface

```ts
type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

type Actor = {
  kind: 'owner' | 'participant' | 'agent'
  subject: string
  displayName?: string
}

type ActivityTypeDefinition = {
  name: string
  version: number
  label: string
}

type ActivityRecord = {
  id: string
  flareId: string
  revisionId: string
  deploymentId: string
  type: string
  typeVersion: number
  actor: Actor
  payload: JsonValue
  createdAt: string
}

type FlareBootstrap = {
  title: string
  purpose: string
  activityTypes: ActivityTypeDefinition[]
  actor: Actor
}

flare.bootstrap(): Promise<FlareBootstrap>
flare.identity.me(): Promise<Actor>

flare.activity.append<T>(
  type: string,
  payload: T,
  options: { idempotencyKey: string }
): Promise<ActivityRecord>

flare.activity.list(options?: {
  type?: string
  cursor?: string
  limit?: number
}): Promise<{ items: ActivityRecord[]; nextCursor?: string }>
```

The SDK holds an opaque deployment context from bootstrap and sends it automatically. Generated code does not choose Flare ID, revision ID, deployment ID, actor, timestamp, or type version.

## HTTP Mapping

| SDK call | Runtime route |
|---|---|
| `flare.bootstrap()` | `GET ./_flare/bootstrap` |
| `flare.identity.me()` | `GET ./_flare/bootstrap` (current actor projection) |
| `flare.activity.append()` | `POST ./_flare/activity` |
| `flare.activity.list()` | `GET ./_flare/activity?type=...&cursor=...&limit=...` |

Activity append sends:

```json
{
  "type": "design.comment",
  "payload": {
    "body": "The empty state needs a clearer next action.",
    "target": "results-panel"
  }
}
```

`Idempotency-Key` is a required header. Deployment context is an SDK-managed header or token returned by bootstrap; application code must not construct it.

## Runtime Rules

- Type must be declared by the active immutable revision.
- The platform derives the declared type version.
- Payload is validated against that revision’s compiled JSON Schema.
- Payloads are bounded; V1 platform maximum is 16 KiB.
- Listing is cursor-based and deterministic; generated code must not assume offset pagination.
- A new write from an old deployment returns `deployment_superseded`; reload/bootstrap before retrying with a new key.
- A same-key/same-request retry returns the original record, including after redeploy.
- A same-key/different-request retry returns `idempotency_conflict`.
- Authorization, quotas, and schema checks are enforced server-side.

## Error Shape

```json
{
  "error": {
    "code": "activity_schema_invalid",
    "message": "The submitted design.comment payload is invalid.",
    "retryable": false,
    "details": {
      "field": "body"
    }
  }
}
```

Stable V1 codes:

- `auth_required`
- `forbidden`
- `flare_not_found`
- `revision_not_found`
- `deployment_not_found`
- `deployment_superseded`
- `activity_type_unknown`
- `activity_schema_invalid`
- `activity_limit_exceeded`
- `idempotency_conflict`
- `rate_limited`
- `internal_error`

Generated clients should show actionable copy for non-retryable errors and avoid blind retries. The platform must not return success-shaped fallbacks after failed writes.

## Actor Semantics

Actor is server-derived from the authenticated request boundary. The client may display returned identity but cannot assign `kind`, `subject`, role, email, or display name.

V1 is owner-only. The `participant` and `agent` actor kinds reserve a stable envelope for later access designs and CLI-authored activity; they do not imply that public writes or embedded agents exist.

## Owner Operations Are Separate

Generated clients do not receive these Management API capabilities:

- catalog and deployment history;
- packet plan/apply;
- authoritative owner export;
- archive, purge, redaction, schema edit, or access-policy mutation.

The Console and CLI own those workflows through the Management API.

## Deferred Capability Modules

Do not expose placeholder methods for capabilities that are not implemented. Add each as a separate reviewed module only when its domain contract is proven:

| Future module | Must define first |
|---|---|
| Mutable records | concurrency, authorization, deletion, migration, export |
| Files | upload authorization, types/sizes, scanning, retention, download policy |
| Realtime | durable vs ephemeral messages, reconnect, ordering, room quotas |
| AI | provider boundary, budgets, private-data policy, provenance, failure behavior |
| Voice | consent, recording/transcription storage, retention, deletion |

There is no core `flare.db`, `flare.events`, `flare.ai`, or generic custom-endpoint escape hatch in V1.
