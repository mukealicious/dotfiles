# Steering Contract

## Goal

Flares should stay open-ended without becoming opaque. A human, agent, or orchestrator must be able to inspect what the Flare is for, what it can do, what data it stores, who can access it, when it expires, and how it can be changed.

Steerability is not the same as constant approval. Drafting and local iteration can be autonomous. Sharing, inviting, spending meaningful resources, or exposing private context needs an explicit gate.

## Manifest Fields

Use this as the durable control plane shape. Local drafts can omit fields that are not known yet, but shared Flares should fill them.

```json
{
  "schemaVersion": 1,
  "title": "Design review follow-up",
  "slug": "design-review-2026-06-10",
  "status": "draft",
  "purpose": "Collect async feedback on decisions and open questions",
  "owner": {
    "name": "Mikey",
    "email": "owner@example.com"
  },
  "sourceSummary": [
    "Transcript summarized; raw transcript not published",
    "Repo context from current branch"
  ],
  "capabilities": {
    "identity": true,
    "db": true,
    "events": true,
    "files": false,
    "ai": false,
    "realtime": false,
    "export": true
  },
  "auth": {
    "mode": "local",
    "audience": [],
    "roles": {
      "owner@example.com": "owner"
    }
  },
  "dataPolicy": {
    "captured": ["votes", "comments"],
    "storedIn": ["Durable Object SQLite"],
    "exports": ["responses.json", "summary.md"],
    "retention": "archive after 14 days",
    "aiUse": "none"
  },
  "budgets": {
    "maxDocuments": 1000,
    "maxUploadBytes": 0,
    "maxAiUsd": 0
  },
  "expiresAt": "2026-06-24T00:00:00Z",
  "approvals": {
    "publish": false,
    "invite": false,
    "aiOverPrivateData": false,
    "externalScripts": false
  },
  "steeringLog": []
}
```

## Status Model

| Status | Meaning | Allowed actions |
|---|---|---|
| `draft` | Local or private build, not shareable | Generate, edit, preview, change schema. |
| `private` | Deployed but owner/admin only | Test platform APIs, export, update auth. |
| `shared` | Available to intended audience | Collect responses, operate, close loop. |
| `archived` | Read/export only or offline | Export, summarize, delete according to retention. |
| `promoted` | Graduated out of ephemeral namespace | Treat as maintained app/site with normal engineering standards. |

## Capability Flags

Capabilities are the platform contract. Generated clients may only call APIs enabled for the current Flare and viewer role.

| Capability | Enables | Default |
|---|---|---|
| `identity` | `flare.identity.me()`, role-aware UI | On when shared. |
| `db` | Document collections | On for interactive Flares. |
| `events` | Append-only activity, audit, and domain events | On when generated clients call `flare.events`. |
| `files` | Upload/download scoped R2 objects | Off until needed. |
| `ai` | Server-side model calls | Off until data policy and budget are explicit. |
| `realtime` | WebSocket rooms/presence/events | Off until live collaboration needs it. |
| `export` | Owner/admin JSON/Markdown/CSV exports | On for any persisted data. |

The Worker and Durable Object enforce capability flags. UI checks are helpful but never sufficient.

## Approval Gates

Require explicit user approval before:

- publishing outside the local/private workspace;
- inviting or emailing people;
- exposing transcripts, private notes, client data, repo context, or screenshots;
- sending collected/private data to an AI provider;
- adding third-party scripts, analytics, fonts, embeds, or CDNs;
- enabling public uploads or public write APIs;
- spending meaningful resources or adding recurring jobs.

Approval records should include who approved, what changed, when it happened, and the exact share/invite copy if applicable.

## Steering Operations

A Flare platform should support these operations as manifest changes:

| Operation | Effect |
|---|---|
| `rename` | Change title/display slug before sharing. |
| `change-purpose` | Update expected behavior and UI copy. |
| `enable-capability` | Add `db`, `files`, `ai`, `realtime`, or `export` after policy checks. |
| `change-auth` | Move `auth.mode` between `local`, `public`, `unlisted`, `access-otp`, and `custom-invite`. |
| `set-audience` | Add/remove viewers or roles. |
| `set-expiry` | Change deadline, archive date, or permanence. |
| `export-now` | Produce durable JSON/Markdown/CSV bundle. |
| `summarize` | Generate a follow-up note from exports, respecting AI policy. |
| `archive` | Freeze writes, export, and optionally delete mutable state later. |
| `promote` | Move into a permanent site/app path with maintained-source expectations. |

## Share Gate Template

Before sharing, present:

```markdown
Flare: <title>
Purpose: <one sentence>
Source used: <summary, with raw/private material called out>
Auth/audience: <mode and people/domains>
Data captured: <fields and files>
Capabilities enabled: <identity/db/files/ai/realtime/export>
Expiry/archive: <date and behavior>
Export path: <where owner can get results>
Share copy:
<subject/body/link instructions>
```

Do not call an unlisted link private. Use `unlisted` for bearer-link access, `access-otp` for Cloudflare Access one-time PIN allowlists, and `custom-invite` for app-level signed invitations.

## Close The Loop

When a shared Flare has served its purpose:

1. Export raw state into JSON and any human-readable Markdown/CSV.
2. Summarize counts, patterns, disagreements, and caveats.
3. Record decisions and next actions in the relevant durable system.
4. Archive or promote the Flare intentionally.
5. Update the manifest status and steering log.
