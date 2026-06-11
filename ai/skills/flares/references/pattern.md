# Flares Pattern

## Thesis

The evolution of agent outputs is moving through stages:

```text
Markdown report
  -> self-contained HTML artifact
  -> hosted interactive Flare
  -> hosted Flare with zero-config APIs
```

The important jump is not “prettier artifacts.” It is giving agents a safe, low-friction way to create **live software surfaces**: tiny apps that can save data, upload files, call AI, use identity, and coordinate people in realtime without each Flare owning backend infrastructure.

## Core Shape

```text
source context + user intent
  -> agent builds thin static client
  -> shared Cloudflare platform supplies backend primitives
  -> human or orchestrator steers scope/data/auth
  -> Flare is published/shared when approved
  -> humans or the agent use it
  -> useful state is exported/promoted to durable context
```

## What This Borrows From Shopify Quick

Shopify Quick’s durable lesson is:

- deploy a folder of static files with almost no ceremony;
- put it behind an appropriate trust boundary;
- expose a small fixed client-side API for manifest, identity, data, files, AI, realtime, and export;
- say no to custom backends per app;
- let visible working examples teach people what is possible.

For personal use, the trust boundary is weaker than company SSO, so auth and invite choices need to be explicit per Flare when shared.

## Why This Is More Than “Group Artifacts”

Group feedback is one killer use case, but the platform primitive is broader:

| Category | Examples |
|---|---|
| Collaborative artifacts | meeting follow-up, RFC feedback, polls, retros |
| Personal tools | calculators, trackers, tiny dashboards, note workbenches |
| Demos/prototypes | product mockups, toy apps, games, realtime experiments |
| Code/context explainers | architecture maps, review surfaces, repo explorers |
| Agent work surfaces | task-specific UIs the agent creates for itself and humans to co-use |
| Durable micro-sites | small permanent sites that graduate out of the ephemeral namespace |

The shared API is what makes these possible without turning each flare into a new infrastructure project.

## Product Principles

A Flare does not require a human approval loop at every step. The key property is **steerability**: an agent, human, or orchestrator can inspect what the Flare is doing, redirect it, change its data/auth/export settings, and decide whether it should remain local, be shared, or be promoted.

| Principle | Meaning |
|---|---|
| Thin generated clients | Flare code owns presentation and interaction; platform APIs own auth, persistence, realtime, files, secrets, and quotas. |
| Cloudflare-native primitives | Workers, Durable Objects, R2, D1, Queues, Workflows, Access, Workers AI/AI Gateway, and service bindings before custom backend services. |
| Fixed client API | Manifest, identity, db, events, files, AI, realtime, and export before bespoke per-Flare endpoints. |
| Steerability | The agent can build/iterate, while a human or orchestrator can inspect and redirect purpose, data, auth, audience, expiry, and exports. |
| Ephemeral by default | Most Flares should expire or archive unless intentionally promoted. |
| Portable context | Store important state/results in Markdown, JSON, SQLite, git, R2/S3 — not only in the live app. |
| Honest privacy | `public`, `unlisted`, `access-otp`, and `custom-invite` are different claims. Label them clearly. |
| Promotion path | Useful toys can graduate into permanent sites, but not every artifact deserves permanence. |

## The Unit of Work

A Flare is a generated collaboration/application packet:

```text
flare/
  manifest.json        # title, slug, purpose, auth, APIs, expiry
  index.html           # thin UI
  app.js               # interaction logic
  styles.css           # optional
  schema.json          # data/response shapes
  exports/             # generated durable outputs, if any
```

If deployed to Cloudflare, stable platform files should live in Workers Static Assets, generated Flare bundles/uploads/exports can live in R2, and mutable per-Flare state/realtime should live in a per-Flare Durable Object backed by SQLite. D1 is the registry and query index, not the hot path for per-Flare interactions.

## Namespaces

Use namespace as a product signal:

| Namespace | Meaning |
|---|---|
| `local` | draft only, not deployed |
| `ask.muke.me` | feedback, polls, meeting follow-ups, async questions |
| `quick.muke.me` | general ephemeral Flares, toys, demos |
| `labs.muke.me` | experiments worth showing repeatedly |
| apex/custom path | promoted durable site |

The exact names can change; keep the distinction between ephemeral generated surfaces and promoted durable sites.

## Good First Slice

Before building a full platform, validate the behavior with:

- a local static Flare preview;
- a tiny deploy path to one Cloudflare Worker plus Workers Static Assets/R2;
- one Durable Object SQLite shared data primitive for form/JSON submissions;
- export back to JSON/Markdown;
- manual auth/capability/expiry selection in the manifest;
- no realtime, file uploads, or AI proxy until the loop proves useful.

## Anti-Patterns

- Treating this as just a prettier Markdown renderer.
- Building custom backend code for every flare.
- Publishing raw transcripts or private repo context when a redacted synthesis would do.
- Letting the agent silently choose audience/auth/privacy for anything shared.
- Calling unlisted links private.
- Making the hosted Flare the only copy of important decisions or collected data.
- Starting with a universal app builder before proving repeated flare types.
- Routing Flare data-path writes through model calls, REST admin APIs, or public HTTP between platform Workers when bindings/service bindings are available.
- Treating D1/KV as the default per-Flare realtime state store instead of Durable Objects.
