# Cloudflare Personal Architecture

## Target Shape

A personal Quick-like platform on `muke.me` could look like:

```text
*.quick.muke.me / ask.muke.me / labs.muke.me
  -> Cloudflare Access or Worker invite gate when needed
  -> Worker router
      -> serve generated static flare files
      -> expose /_flare/* zero-config APIs
      -> route each Flare to one Durable Object
  -> R2 for assets/uploads
  -> Durable Objects + SQLite for per-Flare state/realtime
  -> D1 or KV for registry/config
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
| Static files | Workers Assets or R2 | R2 is good for generated folders; Workers Assets is good for versioned app shell. |
| Request routing | Worker + Hono optional | Wildcard/path routing by Flare slug. |
| Per-Flare state | Durable Object SQLite | Natural “one Flare = one tiny backend brain” model. |
| Cross-Flare registry | D1 or KV | Title, slug, owner, expiry, auth mode, APIs enabled, created_at. |
| File uploads | R2 | Use per-Flare prefixes and quotas. |
| Realtime | Durable Object WebSockets | Useful for live polls/cursors/games/collab. |
| AI calls | AI Gateway / Workers AI / external model proxy | Keep provider keys server-side; likely defer initially. |
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

Start with three modes only:

1. **Local draft** — always available.
2. **Public/unlisted with expiry** — for demos/toys and non-sensitive Flares.
3. **Access OTP allowlist** — for known recipients where “email proves identity” is enough.

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

D1/KV can still hold platform registry data:

```sql
flares(slug, title, created_at, expires_at, auth_mode, status, source_hash, apis_json)
```

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

1. One Worker route serving a generated static flare shell.
2. One Durable Object class storing JSON documents in SQLite.
3. `POST`/`GET /_flare/db/:collection`.
4. `GET /_flare/export.json` protected for owner/admin.
5. Manual deploy through Wrangler or a script.
6. No realtime, uploads, AI proxy, or custom invite system yet.

## Security Defaults

- Never store model/provider keys in client Flare code.
- Rate limit writes per Flare and per identity/IP.
- Make expiry enforceable server-side, not just a UI label.
- Store raw response/data exports with clear sensitivity labels.
- Do not rely on obscurity for sensitive transcripts, private notes, repo context, or client work.
- Add a visible provenance block for shared Flares: generated from, current steward/orchestrator, auth mode, and data policy.
