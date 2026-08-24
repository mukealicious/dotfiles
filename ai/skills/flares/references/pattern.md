# Flares Pattern

## Thesis

Flares move agent output from a document into a small live tool without turning every generated artifact into a new backend project:

```text
source context + user intent
  -> framework-agnostic static packet
  -> shared host and fixed Runtime API
  -> humans or external agents use the tool
  -> typed activity is inspected/exported through Console or CLI
  -> useful outcomes return to durable context
```

The generated client stays thin. The platform is a deep module: one small activity interface hides identity, schema validation, persistence, idempotency, quotas, provenance, and export.

## What Makes a Flare

A Flare is not merely hosted HTML. It has:

- a stable identity and purpose;
- immutable packet revisions;
- immutable deployment history behind a stable target route;
- revision-declared activity types;
- a portable static client with no provider credentials;
- owner-visible activity and export;
- explicit approval before publication or infrastructure mutation.

Humans and external agents can create and use Flares. The platform does not contain a built-in agent, steward, or autonomous lifecycle manager.

## Why Activity First

Comments, votes, rankings, form submissions, review notes, and decisions all fit one append-only envelope while retaining domain-specific schemas. A generated client needs only:

```js
await flare.activity.append('design.comment', {
  body: 'The empty state needs a clearer next action.',
  target: 'results-panel'
}, {
  idempotencyKey: crypto.randomUUID()
})
```

The platform derives actor, Flare, revision, deployment, type version, and time. This gives clients substantial behavior through a small interface and avoids prematurely exposing a generic database.

Activity-first does **not** mean every future state is append-only. Editable records, files, realtime rooms, and other capabilities should become separate modules only when repeated use proves their contracts.

## Product Principles

| Principle | Meaning |
|---|---|
| Thin generated clients | Client code owns presentation; platform APIs own trusted behavior and storage. |
| Portable packets | `flare.json`, local schemas, and built assets work independently of frontend framework. |
| Stable lifecycle identity | Redeploy creates a revision/deployment; it does not create a disconnected app or erase history. |
| Declared activity | Each revision names and schemas the input it accepts. Runtime clients cannot invent types. |
| External-agent boundary | Agents use the same inspectable CLI/Management API as other operators; there is no embedded agent. |
| Explicit lifecycle | Archive, purge, migration, publication, and promotion are owner actions, never silent timers. |
| Honest access | Owner-only, unlisted, invited, and public are distinct claims. V1 is owner-only. |
| Durable outcomes | JSON/Markdown export lets live activity become notes, tasks, and decisions. |

## Unit of Work

```text
flare/
  flare.json
  activity-schemas/
    design.comment.v1.schema.json
  dist/
    index.html
    assets/
```

The packet does not include a Worker, database migration, bucket name, Cloudflare account ID, route, token, or mutable deployment status. Those belong to the shared platform and its Management API.

## Lifecycle

```text
Flare (stable)
  -> Revision 1 (immutable packet)
      -> Deployment A (immutable publication)
  -> Revision 2 (immutable packet)
      -> Deployment B (immutable publication; stable target now points here)
  -> Activity history (append-only, records originating revision/deployment)
```

An old browser tab may retry an already-committed idempotent write, but it cannot create new activity after its deployment has been superseded.

## First Slice

The canonical slice order lives in [platform-contract.md](./platform-contract.md). Start with its owner feedback loop before adding cross-Flare feeds, participants, files, realtime, mutable records, or AI.

## Anti-Patterns

- Building custom backend code or Cloudflare resources per Flare.
- Treating Cloudflare MCP as the Runtime or Management API.
- Starting with generic CRUD, SQL, or event buses instead of one typed activity seam.
- Letting generated code submit actor, role, timestamps, scope, or type version.
- Publishing raw transcripts or private repository context when a synthesis is enough.
- Calling an unlisted link private.
- Automatically expiring, archiving, purging, migrating, or summarizing user data.
- Making the hosted Flare the only durable copy of important outcomes.
- Adding files, realtime, AI, invitations, or public writes before the owner feedback loop works.
