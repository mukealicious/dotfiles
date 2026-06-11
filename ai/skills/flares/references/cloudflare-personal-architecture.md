# Cloudflare Personal Architecture

## Target Shape

A personal Quick-like platform on `muke.me` could look like:

```text
*.quick.muke.me / ask.muke.me / labs.muke.me
  -> Cloudflare Access or Worker invite gate when needed
  -> Worker router
      -> serve platform assets and generated Flare bundles
      -> enforce manifest capabilities, auth, quotas, and expiry
      -> expose /_flare/* zero-config APIs
      -> route each Flare to one Durable Object
  -> Workers Static Assets for stable platform shell/SDK/admin UI
  -> R2 for generated bundles/uploads/exports
  -> Durable Objects + SQLite for per-Flare state/realtime/quotas
  -> D1 for registry/search/reporting indexes
  -> KV only for cache/bootstrap/config that can tolerate eventual consistency
  -> Queues/Workflows for export, invite, summarize, archive, promote
```

The exact hostname is product language:

| Hostname | Product Meaning |
|---|---|
| `quick.muke.me` | general ephemeral Flares, demos, toys, tools |
| `ask.muke.me` | group questions, polls, meeting follow-ups, feedback |
| `labs.muke.me` | experiments worth showing repeatedly |
| promoted custom path/domain | long-lived sites with normal maintenance expectations |

## Suggested Cloudflare Primitives

| Need | Primitive | Notes |
|---|---|---|
| Static platform files | Workers Static Assets | Versioned SDK, admin UI, local preview shell, SPA fallback. |
| Generated bundles | R2 | Good for many per-Flare folders without changing Worker config per app. |
| Request routing | Worker + Hono optional | Wildcard/path routing by Flare slug; `/_flare/*` runs Worker code first. |
| Per-Flare state | Durable Object SQLite | Natural "one Flare = one tiny backend brain" model. |
| Cross-Flare registry | D1 | Title, slug, owner, expiry, auth mode, capabilities, status, created_at. |
| Cache/bootstrap/config | KV | Only for low-critical values where eventual consistency is acceptable. |
| File uploads/exports | R2 | Use per-Flare prefixes, content validation, retention, and quotas. |
| Realtime | Durable Object WebSockets | Useful for live polls/cursors/games/collab; use hibernation when needed. |
| Async work | Queues | Export bundles, notifications, ingestion, cleanup. |
| Lifecycle orchestration | Workflows | Publish, invite, wait for deadline, summarize, archive, promote. |
| AI calls | AI Gateway / Workers AI / external model proxy | Keep provider keys server-side; gate private-data use and budget. |
| Agentic steering | Agents SDK | Optional steward/operator, not the deterministic data path. |
| Auth | Cloudflare Access or custom Worker gate | See auth modes below. |
| Deploy | future `flare deploy` tool | Upload files, set manifest, print preview/publish URLs. |

## Auth and Invite Modes

For a personal, non-org platform, auth is the main design fork.

| Mode | Use When | Pros | Limits |
|---|---|---|---|
| Local preview | Drafting/review | No leak risk; easiest | Not collaborative. |
| Public/unlisted | Low-risk toy/demo | Frictionless | Not private; link can be forwarded. |
| Cloudflare Access OTP with email allowlist | Inviting known people by email | Cloudflare emails a one-time code; no account setup for guests | Audience management means updating Access policy/app or adding app-level checks. |
| Access with personal IdP | Mostly self/private admin | Stronger login for owner | Not suitable for arbitrary invitees unless they share IdP rules. |
| Custom signed invite links | Fine-grained per-Flare invites | Per-Flare roles/expiry, works with any email flow | You build email sending, token storage, abuse handling, and identity semantics. |
| Hybrid Access + app allowlist | Semi-private Flares with known people | Access proves email ownership; app controls Flare audience | More implementation work but likely best long-term. |

Cloudflare Access supports one-time PIN login: approved users enter email, receive a short-lived PIN, and sign in without an external IdP. Access policies can include specific emails or email domains. Do not configure OTP as “any valid email” unless the Flare is intentionally open to anyone who can receive email.

## Practical Recommendation

Start with four modes only:

1. **Local draft** — always available.
2. **Private owner/admin deploy** — deployed behind Access or owner gate for testing platform APIs.
3. **Public/unlisted with expiry** — for demos/toys and non-sensitive Flares.
4. **Access OTP allowlist** — for known recipients where "email proves identity" is enough.

Defer custom invitations until repeated use proves that per-Flare audience management matters.

## Per-Flare State Model

Map each Flare slug to one Durable Object:

```text
flare: lunch-poll-2026-06-10
  Durable Object id: lunch-poll-2026-06-10
  owns:
    - documents/collections
    - responses/comments/votes
    - file metadata
    - websocket room, if live
    - rate-limit counters
```

This keeps the mental model simple and avoids a central database becoming the hot path.

D1 holds platform registry data:

```sql
flares(slug, title, created_at, expires_at, auth_mode, status, source_hash, capabilities_json)
```

KV can cache sanitized bootstrap manifests or per-host route hints, but it should not be authoritative for writes, roles, approvals, or mutable Flare state.

## Worker Routing Sketch

```text
GET  /                         -> serve Flare index.html
GET  /assets/*                 -> serve Flare assets
GET  /_flare/client.js         -> SDK
POST /_flare/db/:collection    -> write current Flare's collection
GET  /_flare/db/:collection    -> list current Flare's collection
POST /_flare/files             -> upload to current Flare's R2 prefix
GET  /_flare/export.json       -> owner/admin export
GET  /_flare/realtime          -> websocket upgrade to Flare DO
```

## First Implementation Slice

1. Local manifest and static preview.
2. One Worker host serving platform assets and generated Flare bundles.
3. One Durable Object class storing JSON documents/events in SQLite.
4. `GET /_flare/manifest` and `GET /_flare/identity`.
5. `POST`/`GET /_flare/db/:collection` with capability, schema, expiry, role, and quota checks.
6. `GET /_flare/export.json` protected for owner/admin.
7. R2 upload for bundles and exports; D1 registry row for slug/status/auth/capabilities.
8. Manual deploy through Wrangler or a script.
9. No realtime, uploads, AI proxy, custom invite system, or Agents SDK steward until the loop is proven.

## Security Defaults

- Never store model/provider keys in client Flare code.
- Rate limit writes per Flare and per identity/IP.
- Make expiry enforceable server-side, not just a UI label.
- Store raw response/data exports with clear sensitivity labels.
- Do not rely on obscurity for sensitive transcripts, private notes, repo context, or client work.
- Add a visible provenance block for shared Flares: generated from, current steward/orchestrator, auth mode, and data policy.
- Enforce capability flags in the Worker and Durable Object; generated UI checks are not enough.
- Prefer service bindings between platform Workers over public HTTP calls when the platform splits into multiple services.
