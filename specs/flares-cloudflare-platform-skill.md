# Flares Cloudflare Platform Skill — Branch Completion Plan

**Status:** Implemented
**Type:** Skill refinement / branch completion
**Effort:** L
**Date:** 2026-07-14
**Branch:** `flares-cloudflare-platform-skill`
**Related:** [`specs/flare-platform.md`](./flare-platform.md)

## Problem Statement

The branch establishes useful Cloudflare MCP access and expands the `flares` skill, but the skill currently describes a broader and more speculative platform than the one we intend to build. It mixes generic document storage, events, AI, realtime, agents, queues, workflows, and deployment details before defining the stable product seams.

For the owner of this dotfiles repository, that creates three problems:

1. An agent can load the skill and infer several competing first slices.
2. Important concepts agreed during design—Flare identity, immutable revisions, deployments, activity types, the Console, and the agent CLI—are absent or underspecified.
3. Cloudflare implementation guidance is duplicated across references, increasing context cost and drift risk.

The branch also predates substantial changes on `master`. Rebasing is expected to conflict in `pi/install.sh`, `pi/README.md`, and `pi/settings.personal.json`, where `master` now materializes writable settings and runs Pi package installation through mise.

## Discovery

- The branch tip is `b3a90f7` and has no open pull request.
- The branch adds or changes ten files: six Flare skill/reference/template files and four Pi MCP integration files.
- `ai/skills/flares/SKILL.md` is 164 lines, but its nine references bring the skill tree to roughly 1,500 lines.
- A “first slice” or implementation order is repeated in `pattern.md`, `cloudflare-personal-architecture.md`, `cloudflare-native-blueprint.md`, `zero-config-api.md`, and `platform-implementation.md`.
- `zero-config-api.md` exposes generic `db` and separate write-only `events`; it does not express the agreed activity-first contract.
- `cloudflare-personal-architecture.md` and `cloudflare-native-blueprint.md` substantially overlap in topology, primitive selection, routing, and implementation order.
- The current skill advertises AI and an Agents SDK steward, conflicting with the agreed boundary: Flares are tools that humans and external agents use; there is no built-in agent.
- The personal-profile-only Cloudflare MCP boundary remains sound: MCP is an operator/infrastructure channel, not the Flare runtime data plane.

## Agreed Product and Architecture Decisions

| Area | Decision |
|---|---|
| Repository ownership | Dotfiles owns the shared skill and personal Pi MCP setup. Runtime service code belongs in a dedicated platform repository. |
| Agent boundary | Humans and external agents use Flares, the Console, and the CLI. The platform contains no built-in agent or autonomous steward. |
| First deep capability | `activity`, not generic CRUD. A stable activity envelope hides identity, validation, persistence, export, quotas, and provenance. |
| Activity types | Declared by an agent in each immutable Flare revision and validated by the platform. Runtime clients cannot invent undeclared types. |
| Lifecycle identity | A Flare is stable; revisions and deployments are immutable historical records. Activity belongs to the Flare and records its originating revision/deployment. |
| Client boundaries | Generated Flare clients use a participant-scoped Runtime API. The private Console and CLI use an owner-scoped Management API. |
| Hosting | One shared Worker hosts many immutable, framework-agnostic Flare packets. Custom per-Flare backends are outside the initial platform. |
| Storage | D1 catalogs Flares/revisions/deployments; one Durable Object with SQLite owns each Flare’s activity; R2 stores revision assets. |
| Console | Read-oriented V1: list Flares/deployments, inspect activity, open a deployment, and copy/export Markdown or JSON. |
| Agent interface | CLI-first over the Management API. A custom MCP adapter is deferred until repeated workflows justify it. |
| Global activity | Per-Flare drilldown in slice 1. An eventually consistent cross-Flare D1 projection is slice 2. |
| Lifecycle automation | No automatic archive, purge, or migration. Explicit owner actions only. |
| Deferred capabilities | AI, built-in agents, voice/files, realtime, generic mutable databases, migration tooling, invitations, and public writes. |

## Recommendation

Rebase the branch, preserve its narrow personal Cloudflare MCP integration, and refactor the `flares` skill around one canonical platform contract. Use progressive disclosure so each reference owns one kind of knowledge:

```text
SKILL.md
  -> pattern.md                    concept and activation
  -> flare-types.md                use-case selection
  -> platform-contract.md          entities, seams, lifecycle, slices
  -> zero-config-api.md            generated-client Runtime API
  -> cloudflare-native-blueprint.md Cloudflare storage/topology adapters
  -> deploy-workflow.md            packet/deploy/share workflow
  -> steering-contract.md          manifest, approvals, data policy
  -> cloudflare-mcp.md              operator/infrastructure channel
```

Replace `platform-implementation.md` with `platform-contract.md`. Remove `cloudflare-personal-architecture.md` after moving its unique namespace and auth guidance into `deploy-workflow.md` and `cloudflare-native-blueprint.md`. This passes the deletion test: removing the overlapping references should reduce complexity rather than spread it to callers.

The skill should describe stable behavior and boundaries. The dedicated platform repository should own executable Worker code, D1 migrations, Durable Object schemas, Console code, CLI code, tests, and the live Wrangler configuration.

## First Vertical Slice for This Branch

**Slice:** An installed Pi agent can load one coherent Flare contract, distinguish operator MCP from runtime APIs, create a valid activity-first Flare packet, and identify the separate platform implementation plan.

**Risk proven:** The skill can guide an agent toward the agreed platform shape without requiring service code or loading contradictory references.

**Includes:** Rebase, canonical contract, updated workflow/reference routing, activity-first templates, personal-only MCP installation, and validation through projected runtime skills.

**Defers:** Cloudflare resource creation, hosted deployment, platform repository bootstrap, Console/CLI implementation, and all public/shared Flare behavior.

## Target Skill Contracts

### Flare packet

```text
flare.json
activity-schemas/
  <type>.v<version>.schema.json
dist/
  index.html
  assets/
```

The packet is portable and framework-agnostic. It contains built static assets, a manifest, and revision-scoped activity schemas. It contains no Cloudflare credentials, model keys, or custom backend code.

### Core entities

- **Flare:** stable identity, purpose, owner, status, and activity history.
- **Revision:** immutable packet, manifest, schemas, checksum, and creation provenance.
- **Deployment:** an immutable publication of a revision to a stable environment/route target; the target pointer determines which deployment is active.
- **Activity record:** append-only typed input associated with a Flare, revision, deployment, and server-derived actor.

### Logical API boundaries

```text
Generated Flare -> Runtime API -> platform domain modules
Console ---------> Management API -> same domain modules
CLI -------------> Management API -> same domain modules
Cloudflare MCP --> account/resource operations only
```

One Worker may host both route groups initially. The logical authorization boundary must not depend on separate physical services.

## Scope and Deliverables

| Deliverable | Effort | Depends On |
|---|---:|---|
| D1. Rebase onto `master` and resolve Pi configuration conflicts using current materialized-settings/mise conventions | M | - |
| D2. Rewrite `SKILL.md` around the agreed core contract and task-based reading order | M | D1 |
| D3. Replace `platform-implementation.md` with a canonical `platform-contract.md` | M | D2 |
| D4. Consolidate Cloudflare topology/auth guidance and remove `cloudflare-personal-architecture.md` duplication | M | D3 |
| D5. Rewrite `zero-config-api.md`, `pattern.md`, `flare-types.md`, `deploy-workflow.md`, and `steering-contract.md` around activity-first semantics | L | D3 |
| D6. Update packet/manifest and minimal Wrangler templates; remove Queue/AI/Agents assumptions | S | D4, D5 |
| D7. Reapply and verify personal-profile-only Cloudflare MCP setup against current Pi installer behavior | M | D1 |
| D8. Run skill, shell, JSON, installer, projection, and diff validation | S | D2–D7 |

## File-Level Change Map

| Path | Planned change |
|---|---|
| `ai/skills/flares/SKILL.md` | Keep under 200 lines; narrow headline; route tasks to canonical references; state no built-in agent; name Runtime/Management/MCP boundaries. |
| `ai/skills/flares/references/pattern.md` | Reframe the pattern around portable packets, activity, external agents, and a separate Console. Remove AI/realtime as default platform promises. |
| `ai/skills/flares/references/flare-types.md` | Express comments, polls, and submissions as revision-declared activity types. Mark files/realtime/mutable state as later capability modules. |
| `ai/skills/flares/references/platform-implementation.md` | Rename to `platform-contract.md`; replace implementation duplication with entities, invariants, API seams, lifecycle, and slice order. |
| `ai/skills/flares/references/cloudflare-native-blueprint.md` | Own Cloudflare adapter choices: shared Worker, DO activity authority, D1 catalog, R2 packet assets, and slice-2 activity projection. |
| `ai/skills/flares/references/cloudflare-personal-architecture.md` | Delete after relocating unique host/auth guidance. |
| `ai/skills/flares/references/zero-config-api.md` | Make `flare.activity.append/list` the first client API. Separate future capability modules and remove core `flare.ai`, generic `flare.db`, and `flare.events`. |
| `ai/skills/flares/references/deploy-workflow.md` | Define packet validation, revision creation, owner-only first deploy, approval gate, and framework-independent build output. |
| `ai/skills/flares/references/steering-contract.md` | Add stable Flare/revision/deployment fields and activity type definitions. Preserve explicit publish/invite gates and non-automatic lifecycle. |
| `ai/skills/flares/references/cloudflare-mcp.md` | Retain operator-only guidance; remove AI/Queue/Workflow prompts from the initial path; point runtime work to the platform API. |
| `ai/skills/flares/assets/templates/manifest.json` | Replace with `flare.json`; use `activity` capability and revision-declared activity schemas; remove AI budgets and generic DB/event flags. |
| `ai/skills/flares/assets/templates/wrangler.flare-host.jsonc` | Keep only first-slice bindings: Static Assets, DO, D1, and R2. No Queue, Workflow, AI, or per-Flare Worker template. |
| `pi/install.sh` | Resolve against current materialized settings; manage `mcp.json` only for personal; install `pi-mcp-adapter` through mise using current package conventions. |
| `pi/settings.personal.json` | Add `npm:pi-mcp-adapter` without reverting current local package paths or model/runtime settings. |
| `pi/mcp.json` | Keep one lazy official Cloudflare Code Mode server and its narrow `docs`, `search`, `execute` surface. |
| `pi/README.md` | Document personal-only MCP alongside current writable-settings and package-install behavior. |

## Non-Goals

- Implementing the shared Worker, Console, CLI, schemas, migrations, or tests in dotfiles.
- Creating or mutating Cloudflare resources.
- Publishing a Flare or changing DNS/routes.
- Building a custom Flare MCP server.
- Designing migration/import tooling.
- Adding embedded agents, Agents SDK state, autonomous actions, or a generic AI proxy.
- Solving public participant authentication, uploads, voice, realtime, or general mutable application state.
- Touching `streamdeck/layouts/workspaces.local.json`.

## Acceptance Criteria

- [x] The branch is rebased onto current `master` without regressing writable Pi settings, mise execution, current package paths, or model configuration.
- [x] `SKILL.md` remains under 200 lines and routes each task to one authoritative reference.
- [x] The skill defines Flare, revision, deployment, activity record, Runtime API, Management API, Console, CLI, and MCP boundaries.
- [x] No core workflow advertises a built-in agent, Agents SDK steward, or AI capability.
- [x] Generated-client examples use `flare.activity.append/list`; no active guidance uses `flare.events` or generic `flare.db` as the first persistence seam.
- [x] The packet template is framework-agnostic and declares revision-scoped activity types.
- [x] Only the personal Pi profile loads `pi-mcp-adapter` and receives the managed `mcp.json`.
- [x] Work and compatibility profiles do not retain a managed Cloudflare MCP symlink.
- [x] Platform implementation code is explicitly owned by the separate repository plan.
- [x] All internal Markdown links resolve and duplicated first-slice guidance has one canonical owner.

## Validation Plan

| Layer | Command/check | Expected result |
|---|---|---|
| Rebase | `git rebase master` plus conflict review | Pi changes preserve current `master` behavior and personal-only MCP additions |
| Shell | `sh -n pi/install.sh` | No syntax errors |
| JSON | `jq empty pi/mcp.json pi/settings.personal.json ai/skills/flares/assets/templates/flare.json` | Valid JSON |
| Skill structure | `ai/skills/build-skill/scripts/validate_skill.sh ai/skills/flares` | Skill/frontmatter/link checks pass |
| Projection | `./ai/install.sh` | Runtime projections point to the source skill |
| Pi install | `./pi/install.sh` | Personal MCP config/package present; work/agent MCP config absent |
| Content audit | `rg 'flare\.events\|flare\.db\|Agents SDK\|built-in agent' ai/skills/flares` | Only explicit historical/deferred cautions remain |
| Diff hygiene | `git diff --check` | No whitespace errors |
| Worktree safety | `git status --short` | Unrelated Stream Deck local file remains untouched |

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---:|---:|---|
| Rebase accidentally restores obsolete Pi settings/package behavior | High | High | Resolve conflicts from `master` outward; separately reapply only personal MCP concerns; run installer assertions. |
| Consolidation removes useful auth or namespace guidance | Medium | Medium | Inventory unique sections before deleting references and move each to an explicit owner. |
| Activity-first wording overclaims that all future Flare state is append-only | Medium | Medium | State that activity is the first deep capability; mutable records remain a separate future capability. |
| Skill becomes a platform specification dump | Medium | Medium | Keep `SKILL.md` procedural and under 200 lines; push stable contracts into one task-routed reference. |
| Wrangler template drifts from Cloudflare schema | Medium | Medium | Label it as a starting shape and require current Cloudflare docs verification before implementation. |
| MCP is mistaken for the activity data plane | Low | High | Repeat the operator/runtime boundary in `SKILL.md`, `cloudflare-mcp.md`, and deploy guidance without duplicating implementation detail. |

## Trade-offs Made

| Chose | Over | Because |
|---|---|---|
| Activity-first contract | Generic document database as the initial API | It proves comments, polls, and submissions through one deep module with less client reasoning. |
| Separate platform repository | Worker/Console code inside dotfiles | Service lifecycle, tests, deployments, and dependencies need independent ownership and locality. |
| CLI-first agent access | Custom MCP data adapter | The CLI is composable, inspectable, testable, and does not add another protocol surface prematurely. |
| Canonical contract + Cloudflare adapter reference | Several overlapping architecture guides | Progressive disclosure works only when each fact has one owner. |
| Explicit manual lifecycle | Automatic expiration/archive/purge jobs | The owner requested no silent lifecycle mutation. |

## Open Questions

None blocking. Hostname, public auth modes, files, mutable state, and custom MCP are intentionally deferred to later platform slices.

## Success Metrics

- A coding agent can explain the whole platform boundary after loading `SKILL.md` plus at most one architecture reference.
- Two independent agents produce compatible activity-first Flare packets from the same prompt.
- The skill never causes an agent to route activity through Cloudflare MCP or invent a per-Flare backend.
- Installing the branch changes only the personal Pi profile’s MCP surface.
- The platform repository can implement its first vertical slice without re-deciding product boundaries.
