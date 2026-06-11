# Zero-Config API

## Purpose

Flares should not need to create databases, secrets, API keys, upload services, websocket servers, or auth integrations. They should call a tiny platform SDK exposed by the host.

```html
<script src="/_flare/client.js"></script>
```

```js
const me = await flare.identity.me()
await flare.db.collection('votes').create({ choice: 'A', by: me.email })
flare.realtime.subscribe('votes', event => render(event))
```

## API Surface

Start small and fixed.

| API | Use | Initial Status |
|---|---|---|
| `identity` | Current user/session, display name/email when auth provides it | early |
| `db` | Per-Flare collections/documents or SQLite-backed tables | early |
| `files` | Upload/download files scoped to a Flare | later |
| `ai` | Server-side model proxy with keys hidden from clients | later |
| `realtime` | WebSockets/subscriptions/presence | later |
| `export` | JSON/CSV/Markdown export for owner/agent | early |
| `registry` | Flare metadata, expiry, admin/status | platform-only |

## Design Rules

- The SDK discovers the current Flare slug from hostname/path or manifest.
- Flare code never sees provider keys or Cloudflare credentials.
- API calls are scoped to the current Flare and current identity.
- Every write has quotas/rate limits.
- Every API has an export path so hosted state can become durable context.
- Prefer boring JSON over clever framework coupling.

## Minimal SDK Sketch

```ts
type Identity = {
  mode: 'anonymous' | 'named' | 'owner'
  email?: string
  name?: string
}

type CreateResult<T> = T & { id: string; createdAt: string }

flare.identity.me(): Promise<Identity>

flare.db.collection(name: string): {
  create<T>(value: T): Promise<CreateResult<T>>
  list<T>(options?: { limit?: number; orderBy?: string }): Promise<Array<CreateResult<T>>>
  get<T>(id: string): Promise<CreateResult<T> | null>
  update<T>(id: string, patch: Partial<T>): Promise<CreateResult<T>>
  delete(id: string): Promise<void>
  subscribe?(handlers: DbSubscriptionHandlers): () => void
}

flare.export.json(): Promise<object>
flare.export.markdown(): Promise<string>
```

## Data Model Defaults

For the first slice, a document collection API is easier for flares than exposing SQL directly.

Internally, a Durable Object SQLite store can keep:

```sql
collections(name TEXT, created_at TEXT)
documents(id TEXT PRIMARY KEY, collection TEXT, json TEXT, created_at TEXT, updated_at TEXT, author TEXT)
events(id TEXT PRIMARY KEY, type TEXT, json TEXT, created_at TEXT, author TEXT)
```

Later, advanced Flares can opt into typed schemas or SQL views, but the default should feel like Firebase/Quick.

## Identity Modes

| Mode | Meaning |
|---|---|
| `anonymous` | No reliable person identity; use per-session IDs and be honest in UI. |
| `named` | Cloudflare Access or invite gate has verified an email/name. |
| `owner` | The Flare owner/admin/orchestrator can export or manage state. |

For personal Flares, Cloudflare Access OTP can verify email ownership for known allowlisted recipients. Custom invite links can come later.

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

## Realtime API

Realtime is powerful but not needed for every artifact. Add when the use case needs live collaboration, games, presence, cursors, or live polling.

```js
const room = flare.realtime.room('main')
room.on('cursor', updateCursor)
room.send('cursor', { x, y })
```

Durable Objects are a natural fit because a Flare can map to one object with WebSocket connections and SQLite state together.

## Quotas From Day One

Even personal systems need guardrails:

- max submissions per identity/IP/time window;
- max documents per collection/Flare;
- max JSON document size;
- max files and bytes per Flare;
- max websocket connections per Flare;
- AI daily token/cost budget;
- expiry enforcement for write APIs.
