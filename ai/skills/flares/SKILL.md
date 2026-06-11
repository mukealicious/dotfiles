---
name: flares
description: Create Flares: Quick-like, steerable agent-generated mini-apps with zero-config APIs for data, files, AI, identity, realtime/websockets, and sharing. Use when the user says "make a flare" or asks to spin up a quick app/artifact/demo/dashboard/poll from context.
references:
  - references/pattern.md
  - references/cloudflare-personal-architecture.md
  - references/flare-types.md
  - references/zero-config-api.md
---

# Flares

Give agents the ability to move beyond Markdown and one-file HTML into **Flares**: small hosted mini-apps with shared backend primitives.

A Flare is a steerable, agent-generated lightweight web app with zero-config APIs for state, files, AI, identity, and realtime collaboration.

## Use This For

- Meeting follow-up Flares with synthesis, polls, comments, and response export.
- Tiny dashboards, calculators, workbenches, demos, games, and prototypes.
- Interactive explainers over transcripts, notes, repos, specs, or datasets.
- Personal or client-facing mini-apps that need lightweight persistence.
- Exploring a Shopify Quick-like platform on personal Cloudflare infrastructure.
- Turning an agent session’s output into a live surface people can use, not just read.

## Core Contract

- Start with the smallest useful Flare: static HTML/CSS/JS plus shared platform APIs.
- Keep the Flare thin: generated code owns presentation and interaction; shared platform APIs own auth, persistence, files, AI, realtime, secrets, quotas, and export. Do not invent per-Flare backend infrastructure unless the user explicitly asks.
- Agents may create and iterate on local/private Flares autonomously when the user asks.
- **Do not publish, invite people, or expose private context without explicit user approval.**
- Keep Flares steerable: expose purpose, data captured, auth, audience, expiry, and export path so a human or orchestrator can redirect them.
- Prefer portable durable records: Markdown, JSON, SQLite, git, R2/S3 objects.
- Make privacy claims honest: local, public, unlisted, invite-gated, Access-gated, or authenticated.

## Workflow

1. **Name the flare job.** Is this for reading, deciding, collecting input, calculating, visualizing, playing, monitoring, or collaborating?
2. **Gather source context.** Use transcripts, notes, repo files, diffs, docs, data, screenshots, and QMD search when relevant.
3. **Choose the flare type.** See [flare-types.md](./references/flare-types.md).
4. **Choose required platform primitives.** Static only? Data? Files? AI proxy? Realtime? Identity? See [zero-config-api.md](./references/zero-config-api.md).
5. **Draft locally first.** Build a local preview or self-contained HTML when possible before any public deploy.
6. **Steering gate.** Show the source summary, Flare behavior, data captured, auth mode, audience, expiry, and share/invite copy. Get user approval only when publishing, inviting, spending meaningful resources, or exposing private context.
7. **Publish only after approval.** If publishing, record URL, source path, auth mode, expiry, and any data/export location.
8. **Close the loop.** If the Flare gathers data, export/summarize responses back into durable notes/tasks/decisions.

## Default Flare Manifest

Every flare should have a manifest, even if informal:

```json
{
  "title": "Design review follow-up",
  "slug": "design-review-2026-06-10",
  "purpose": "Collect async feedback on decisions and open questions",
  "sourceSummary": ["transcript.md", "repo: current branch"],
  "authMode": "local|public|unlisted|access-otp|custom-invite",
  "audience": ["owner@example.com"],
  "expiresAt": "2026-06-24T00:00:00Z",
  "apis": ["identity", "db", "realtime"],
  "exports": ["responses.json", "summary.md"]
}
```

## Platform Direction

The intended personal platform is Cloudflare-first: Access for auth where appropriate, Worker wildcard/router, R2 for static assets/uploads, Durable Objects with SQLite for per-Flare state/realtime, and D1/KV for registry/config.

Read [pattern.md](./references/pattern.md) for the broader concept and [cloudflare-personal-architecture.md](./references/cloudflare-personal-architecture.md) before implementing deployment behavior.

## Safety Checklist Before Sharing

- [ ] User approved publishing and invitation/share text, if the Flare leaves the local/private workspace.
- [ ] Audience and auth mode are explicit.
- [ ] Sensitive source material is summarized/redacted, not dumped raw.
- [ ] The Flare declares what data it stores and where exports go.
- [ ] Expiry/archive behavior is explicit, or permanence is intentional.
- [ ] Generated code has no external scripts/analytics/CDNs unless approved.
- [ ] Secrets/API keys stay server-side behind platform APIs.

## Skill Combinations

- Use `engineering-patterns/references/thin-ai-clients.md` when an AI-heavy Flare needs a UI-vs-agent or local-vs-cloud architecture decision.
- Use `visual-deliverables` for local one-file HTML explainers before hosting.
- Use `breadboarding` when the mini-app workflow needs places/affordances/stores/wiring.
- Use `framing-doc` or `kickoff-doc` when a durable synthesis should precede the Flare.
- Use `qmd` when personal notes or a markdown vault are source context.
- Use `spec-planner` before building the Cloudflare platform, deploy CLI, or SDK.
