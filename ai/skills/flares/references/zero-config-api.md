# Zero-Config API

## Purpose

Flares should not need to create databases, secrets, API keys, upload services, websocket servers, queues, workflows, or auth integrations. They should call a tiny platform SDK exposed by the host.

```html
<script src="/_flare/client.js"></script>
```

```js
const flareInfo = await flare.manifest()
const me = await flare.identity.me()
await flare.db.collection('votes').create({ choice: 'A', by: me.id })
if (flareInfo.capabilities.realtime) {
  const room = flare.realtime.room('votes')
  const unsubscribe = room.on('vote-created', event => render(event.payload))
}
```

## API Surface

| API | Use | Initial Status |
|---|---|---|
| `manifest` | Sanitized purpose, status, capabilities, auth, expiry, data policy | early |
| `identity` | Current user/session, display name/email when auth provides it | early |
| `db` | Per-Flare collections/documents or SQLite-backed tables | early |
| `events` | Append-only activity/audit/domain events, gated by `capabilities.events` | early |
| `export` | JSON/CSV/Markdown export for owner/agent | early |
| `files` | Upload/download files scoped to a Flare | later |
| `ai` | Server-side model proxy with keys hidden from clients | later |
| `realtime` | WebSockets/subscriptions/presence | later |
| `registry` | Flare metadata, expiry, admin/status | platform-only |

## Design Rules

- The SDK discovers the current Flare slug from hostname/path or manifest.
- Flare code never sees provider keys or Cloudflare credentials.
- API calls are scoped to the current Flare and current identity.
- The server enforces manifest capability flags, auth, role, expiry, quotas, and schema.
- Every write has quotas/rate limits.
- Every API has an export path so hosted state can become durable context.
- API responses should include stable error codes that generated clients can handle.
- Prefer boring JSON over clever framework coupling.
- Hide Cloudflare product details from generated clients unless the user is building the platform itself.

## Minimal SDK Sketch

```ts
type Role = 'viewer' | 'contributor' | 'owner'
type AuthMode = 'local' | 'public' | 'unlisted' | 'access-otp' | 'custom-invite'
type Status = 'draft' | 'private' | 'shared' | 'archived' | 'promoted'
type Capability = 'identity' | 'db' | 'events' | 'files' | 'ai' | 'realtime' | 'export'
type CapabilityFlags = Record<Capability, boolean>
type Identity = { mode: 'anonymous' | 'named' | 'owner'; id: string; role: Role; email?: string; name?: string }

type FlareManifest = {
  schemaVersion: number
  title: string; slug: string; purpose: string; status: Status
  sourceSummary: string[]
  capabilities: CapabilityFlags
  auth: { mode: AuthMode; audience: string[]; roles: Record<string, Role> }
  expiresAt?: string
  dataPolicy: { captured: string[]; storedIn: string[]; exports: string[]; retention?: string; aiUse?: string }
  budgets?: Partial<Record<'maxDocuments' | 'maxUploadBytes' | 'maxAiUsd', number>>
  approvals?: Record<string, boolean>
  steeringLog?: Array<{ at: string; by: string; change: string }>
}

type CreateResult<T> = T & { id: string; createdAt: string }

type RealtimeEvent<T = unknown> = {
  type: string
  payload: T
  author?: Identity
  createdAt: string
}

type Unsubscribe = () => void

type RealtimeRoom = {
  on<T>(type: string, handler: (event: RealtimeEvent<T>) => void): Unsubscribe
  send<T>(type: string, payload: T): Promise<void>
  close(): void
}

flare.manifest(): Promise<FlareManifest>
flare.identity.me(): Promise<Identity>

flare.db.collection(name: string): {
  create<T>(value: T): Promise<CreateResult<T>>
  list<T>(options?: { limit?: number; orderBy?: string }): Promise<Array<CreateResult<T>>>
  get<T>(id: string): Promise<CreateResult<T> | null>
  update<T>(id: string, patch: Partial<T>): Promise<CreateResult<T>>
  delete(id: string): Promise<void>
}

flare.events.append(type: string, value: unknown): Promise<void>
flare.realtime.room(name?: string): RealtimeRoom
flare.export.json(): Promise<object>
flare.export.markdown(): Promise<string>
```

## Data Model Defaults

For the first slice, a document collection API is easier for flares than exposing SQL directly.

Internally, a Durable Object SQLite store can keep:

```sql
collections(name TEXT PRIMARY KEY, schema_json TEXT, created_at TEXT)
documents(id TEXT PRIMARY KEY, collection TEXT, json TEXT, author TEXT, created_at TEXT, updated_at TEXT)
events(id TEXT PRIMARY KEY, type TEXT, json TEXT, author TEXT, created_at TEXT)
sessions(session_id TEXT PRIMARY KEY, identity_json TEXT, role TEXT, created_at TEXT, last_seen_at TEXT)
quotas(subject TEXT, window TEXT, count INTEGER, reset_at TEXT, PRIMARY KEY(subject, window))
```

Later, advanced Flares can opt into typed schemas or SQL views, but the default should feel like Firebase/Quick. Keep direct SQL server-side; generated clients use document APIs unless the user is explicitly building a developer-facing Flare.

## Identity Modes

| Mode | Meaning |
|---|---|
| `anonymous` | No reliable person identity; use per-session IDs and be honest in UI. |
| `named` | Cloudflare Access or invite gate has verified an email/name. |
| `owner` | The Flare owner/admin/orchestrator can export or manage state. |

For personal Flares, Cloudflare Access OTP can verify email ownership for known allowlisted recipients. Custom invite links can come later.

The platform should derive `identity.mode` and `role` server-side from Access assertions, signed invite tokens, owner session state, or anonymous session cookies. The client should not self-assign roles.

## AI API

Defer AI until data/files basics work. When added, keep it constrained:

```js
const result = await flare.ai.chat({
  messages: [{ role: 'user', content: 'Summarize these responses' }],
  purpose: 'summarize-flare-responses'
})
```

Rules:

- no model keys in client code;
- Flare-level token budgets;
- log purpose/cost/latency;
- do not send sensitive collected data to models without an explicit Flare data policy.
- route AI calls through Workers AI or AI Gateway/server-side provider bindings, not direct browser calls.

## Realtime API

Realtime is powerful but not needed for every artifact. Add when the use case needs live collaboration, games, presence, cursors, or live polling.

```js
const room = flare.realtime.room('main')
const unsubscribe = room.on('cursor', event => updateCursor(event.payload))
await room.send('cursor', { x, y })
```

Durable Objects are a natural fit because a Flare can map to one object with WebSocket connections and SQLite state together.

Realtime messages that change durable state should pass through the same validation path as HTTP writes. Presence/cursor events can stay ephemeral, but anything that should appear in exports needs a durable event/document record.

## Quotas From Day One

Even personal systems need guardrails:

- max submissions per identity/IP/time window;
- max documents per collection/Flare;
- max JSON document size;
- max files and bytes per Flare;
- max websocket connections per Flare;
- AI daily token/cost budget;
- expiry enforcement for write APIs.

Quota checks belong server-side, ideally in the Flare Durable Object so concurrent writes for the same Flare serialize naturally.

## Error Shape

Use stable error codes so agent-generated clients can recover gracefully:

```json
{
  "error": {
    "code": "capability_disabled",
    "message": "This Flare does not allow file uploads.",
    "retryable": false
  }
}
```

Recommended codes: `auth_required`, `forbidden`, `expired`, `capability_disabled`, `quota_exceeded`, `schema_invalid`, and `not_found`.
