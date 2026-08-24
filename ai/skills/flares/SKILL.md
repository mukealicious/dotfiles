---
name: flares
description: "Create Flares: steerable, agent-generated mini-apps packaged as framework-agnostic static clients with declared activity types. Use when the user says 'make a flare' or asks for a quick app, artifact, demo, dashboard, poll, feedback surface, or interactive explainer."
references:
  - references/pattern.md
  - references/flare-types.md
  - references/platform-contract.md
  - references/zero-config-api.md
  - references/cloudflare-native-blueprint.md
  - references/deploy-workflow.md
  - references/steering-contract.md
  - references/cloudflare-mcp.md
---

# Flares

A **Flare** is a small, steerable web app generated from context and packaged as a portable static client. Generated code owns the experience. The shared platform owns identity, typed activity, validation, persistence, provenance, quotas, and export.

The first deep capability is **activity**: comments, votes, submissions, and other typed append-only input declared by each immutable Flare revision. Mutable records, files, realtime, AI, and public participation are later capabilities, not defaults.

## Boundaries

```text
Generated Flare -> Runtime API ----\
Console ---------> Management API --> shared platform domain modules
CLI -------------> Management API --/
Cloudflare MCP --> account/resource operations only
```

- Humans and external agents use Flares, the Console, and the CLI. There is no built-in platform agent.
- Generated clients never call Cloudflare APIs, MCP, storage products, or model providers directly.
- Cloudflare MCP is infrastructure-only. It is not the activity data plane.
- Runtime service code belongs in the separate platform repository described by `specs/flare-platform.md` in the dotfiles source repository, not this repository’s skill tree.

## Use This For

- Feedback, polls, rankings, comments, and structured submissions.
- Interactive explainers, review surfaces, calculators, dashboards, and demos.
- Small tools created from transcripts, notes, repos, specs, screenshots, or datasets.
- Owner-only work surfaces that may later justify broader capabilities.

## Reading Order

| Task | Read |
|---|---|
| Understand the concept | [pattern.md](./references/pattern.md) |
| Choose a useful shape and activity types | [flare-types.md](./references/flare-types.md) |
| Understand entities, lifecycle, API seams, or slice order | [platform-contract.md](./references/platform-contract.md) |
| Build generated-client interactions | [zero-config-api.md](./references/zero-config-api.md) |
| Map the contract to Cloudflare primitives | [cloudflare-native-blueprint.md](./references/cloudflare-native-blueprint.md) |
| Validate, plan, deploy, or share a packet | [deploy-workflow.md](./references/deploy-workflow.md) |
| Define the manifest, data policy, or approval gate | [steering-contract.md](./references/steering-contract.md) |
| Inspect or configure Cloudflare infrastructure | [cloudflare-mcp.md](./references/cloudflare-mcp.md) |

## Workflow

1. **Name the job.** State what someone should understand, decide, calculate, or submit.
2. **Gather and minimize context.** Prefer a purpose-built synthesis over publishing raw private source material.
3. **Choose the smallest shape.** Start static; add declared activity only when input must persist.
4. **Define activity types.** Give each type a stable name, version, label, and local JSON Schema.
5. **Build a portable packet.** Produce `flare.json`, `activity-schemas/`, and built `dist/` assets. Use [assets/templates/flare.json](./assets/templates/flare.json).
6. **Preview locally.** Keep the client framework-independent and use the Runtime API contract rather than custom backend code.
7. **Plan before applying.** Use the platform CLI for packet validation/deployment. If the platform is unavailable, stop at a valid local packet; do not invent a one-off backend.
8. **Get approval for external effects.** Publishing, routes/DNS, invitations, private-context exposure, and resource mutations require explicit approval.
9. **Close the loop.** Inspect/export activity through the Console or CLI and move important outcomes into durable notes, tasks, or decisions.

## Packet Contract

```text
flare.json
activity-schemas/
  <type>.v<version>.schema.json
dist/
  index.html
  assets/
```

The packet is deterministic and secret-free. It contains no owner credentials, Cloudflare IDs, environment-specific route, mutable deployment state, custom backend, or model keys.

## Core Rules

- A Flare has stable identity; revisions and deployments are immutable historical records.
- Activity belongs to the Flare and records the originating revision and deployment.
- Runtime clients may append only activity types declared by their revision.
- Actor, timestamps, scope, type version, and provenance are server-derived.
- `Idempotency-Key` is required for activity writes.
- The Console is owner-only and read-oriented in V1.
- External agents use the CLI first; a custom Flare MCP server is deferred.
- No automatic archive, purge, migration, or destructive cleanup.
- Do not describe unlisted URLs as private.

## Initial Platform Shape

| Concern | V1 owner |
|---|---|
| Shared routing and Runtime/Management APIs | One Worker |
| Stable Flare/revision/deployment catalog | D1 |
| Per-Flare activity authority | One Durable Object with SQLite per stable Flare ID |
| Immutable revision packets | R2 |
| Owner authentication | Cloudflare Access |
| Agent/operator access | Platform CLI over Management API |

Files, voice, generic mutable databases, realtime, AI, invitations, and public writes remain deferred until repeated use proves a narrower contract.

## Safety Before Deployment

- [ ] Source context is minimized and sensitive material is not copied unnecessarily.
- [ ] Activity types and captured fields are explicit.
- [ ] Packet contains no secrets, credentials, analytics, or unapproved external scripts.
- [ ] Target route, access mode, and Cloudflare mutations are shown before apply.
- [ ] User explicitly approved any publish, invite, DNS, or public/private-context exposure.
- [ ] Important results have a JSON or Markdown export path.

## Useful Skill Combinations

- Use `visual-deliverables` for a local one-file prototype before packetizing.
- Use `breadboarding` when the interaction or state flow needs mapping.
- Use `impeccable` for UI/UX quality.
- Use `framing-doc` or `kickoff-doc` when synthesis should precede the Flare.
- Use `spec-planner` before changing the platform contract or adding a capability module.
