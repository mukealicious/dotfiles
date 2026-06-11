---
name: flares
description: Create Flares: Cloudflare-native, steerable agent-generated mini-apps with zero-config APIs for data, files, AI, identity, realtime/websockets, export, and sharing. Use when the user says "make a flare" or asks to spin up a quick app/artifact/demo/dashboard/poll from context.
references:
  - references/pattern.md
  - references/cloudflare-personal-architecture.md
  - references/cloudflare-native-blueprint.md
  - references/steering-contract.md
  - references/flare-types.md
  - references/zero-config-api.md
---

# Flares

Give agents a path beyond Markdown and one-file HTML into **Flares**: small hosted mini-apps with Cloudflare-native backend primitives.

A Flare is a steerable, agent-generated lightweight web app. Generated code owns the client experience; the shared Cloudflare platform owns identity, persistence, files, AI, realtime, quotas, exports, expiry, and deployment state.

## Use This For

- Meeting follow-up Flares with synthesis, polls, comments, and export.
- Dashboards, calculators, workbenches, demos, games, and prototypes.
- Interactive explainers over transcripts, notes, repos, specs, screenshots, or datasets.
- Personal or client-facing mini-apps that need lightweight persistence or collaboration.
- Agent-created work surfaces that humans can inspect, steer, share, archive, or promote.

## Core Contract

- Start with the smallest useful Flare: static HTML/CSS/JS plus shared platform APIs.
- Keep generated Flares thin. Do not invent per-Flare backend infrastructure unless the user explicitly asks.
- Default to Cloudflare primitives: Workers Static Assets or R2 for files, Workers for API routing, Durable Objects with SQLite for per-Flare state and realtime, D1 for registry/query indexes, R2 for uploads/exports, Queues/Workflows for async lifecycle jobs, Access or signed invite gates for identity, Workers AI or AI Gateway for server-side model calls.
- Agents may create and iterate on local/private Flares autonomously when the user asks.
- **Do not publish, invite people, or expose private context without explicit user approval.**
- Keep Flares steerable: expose purpose, data captured, auth, audience, expiry, export path, capabilities, budgets, and approvals so a human or orchestrator can redirect them.
- Prefer portable durable records: Markdown, JSON, SQLite, git, R2/S3 objects.
- Make privacy claims honest: `local`, `public`, `unlisted`, `access-otp`, and `custom-invite` mean different things.

## Reading Order

| Task | Read |
|---|---|
| Understand the concept | [pattern.md](./references/pattern.md) |
| Pick a Flare shape | [flare-types.md](./references/flare-types.md) |
| Build or review platform architecture | [cloudflare-native-blueprint.md](./references/cloudflare-native-blueprint.md), then [cloudflare-personal-architecture.md](./references/cloudflare-personal-architecture.md) |
| Define steerability, safety gates, or manifest fields | [steering-contract.md](./references/steering-contract.md) |
| Implement client-facing APIs | [zero-config-api.md](./references/zero-config-api.md) |

## Workflow

1. **Name the flare job.** Is this for reading, deciding, collecting input, calculating, visualizing, playing, monitoring, or collaborating?
2. **Gather source context.** Use transcripts, notes, repo files, diffs, docs, data, screenshots, and QMD search when relevant.
3. **Choose the flare type.** See [flare-types.md](./references/flare-types.md).
4. **Choose capabilities, not infrastructure.** Static only? Data? Files? AI? Realtime? Identity? Export? Lifecycle automation? See [zero-config-api.md](./references/zero-config-api.md).
5. **Draft locally first.** Build a local preview or self-contained HTML when possible before any public deploy.
6. **Write or update the manifest.** Include the steering fields in [steering-contract.md](./references/steering-contract.md), even if some values are provisional.
7. **Steering gate.** Show the source summary, Flare behavior, data captured, auth mode, audience, expiry, and share/invite copy. Get user approval when publishing, inviting, spending meaningful resources, or exposing private context.
8. **Publish only after approval.** If publishing, record URL, source path, auth mode, expiry, platform capabilities, and any data/export location.
9. **Operate and close the loop.** If the Flare gathers data, export/summarize responses back into durable notes/tasks/decisions. Archive or promote intentionally.

## Cloudflare Native Defaults

Use this default stack unless the use case proves it needs less or more:

| Concern | Default |
|---|---|
| Host/router | One Workers app with route-aware API handling and static asset fallback |
| Static bundles | Workers Static Assets for the platform shell; R2 for generated per-Flare bundles and uploads |
| Per-Flare state | One Durable Object instance per Flare, backed by SQLite |
| Realtime | Durable Object WebSockets, with hibernation for long-lived rooms |
| Registry | D1 for searchable metadata; KV only for cache/bootstrap/config that can tolerate eventual consistency |
| Async work | Queues for background tasks; Workflows for durable multi-step lifecycle jobs |
| AI | Server-side Workers AI or AI Gateway calls with budgets and audit records |
| Identity | Cloudflare Access for owner/admin and known invitees; app-level signed gates for fine-grained per-Flare audiences |
| Observability | Workers Logs/structured events, Analytics Engine for usage metrics when needed |

Do not use the Cloudflare REST API from inside a Flare for data-path behavior when bindings or service bindings can do the work.

## Default Flare Manifest

Every Flare should have a manifest. Use this canonical shape and leave optional fields empty for local drafts:

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
  "sourceSummary": ["transcript.md", "repo: current branch"],
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

## Platform Direction

The intended personal platform is Cloudflare-first: Access and/or invite gates for auth, one Worker host/router, Workers Static Assets or R2 for Flare bundles, Durable Objects with SQLite for per-Flare state and realtime, D1 for registry/indexes, R2 for uploads/exports, Queues/Workflows for lifecycle work, and Workers AI/AI Gateway for model calls.

Read [cloudflare-native-blueprint.md](./references/cloudflare-native-blueprint.md) before implementing deployment behavior.

## Safety Checklist Before Sharing

- [ ] User approved publishing and invitation/share text, if the Flare leaves the local/private workspace.
- [ ] Audience and auth mode are explicit.
- [ ] Sensitive source material is summarized/redacted, not dumped raw.
- [ ] The Flare declares what data it stores and where exports go.
- [ ] Expiry/archive behavior is explicit, or permanence is intentional.
- [ ] Generated code has no external scripts/analytics/CDNs unless approved.
- [ ] Secrets/API keys stay server-side behind platform APIs.
- [ ] The Worker enforces auth, expiry, quotas, and capability flags server-side.

## Skill Combinations

- Use `engineering-patterns/references/thin-ai-clients.md` when an AI-heavy Flare needs a UI-vs-agent or local-vs-cloud architecture decision.
- Use `visual-deliverables` for local one-file HTML explainers before hosting.
- Use `breadboarding` when the mini-app workflow needs places/affordances/stores/wiring.
- Use `framing-doc` or `kickoff-doc` when a durable synthesis should precede the Flare.
- Use `qmd` when personal notes or a markdown vault are source context.
- Use `spec-planner` before building the Cloudflare platform, deploy CLI, or SDK.
