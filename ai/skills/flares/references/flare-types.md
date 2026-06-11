# Flare Types

## Selection Guide

| User Intent | Flare Type | Typical Capabilities | Cloudflare Bias | Durable Follow-Up |
|---|---|---|---|---|
| "Create a follow-up synthesis + poll" | Group feedback Flare | identity, db, export | DO SQLite for responses, D1 registry, optional Access OTP | Decision note + action items |
| "Spin up a quick dashboard" | Mini dashboard | manifest, db, files, optional AI | R2 for snapshots/files, DO for annotations, D1 for registry | Snapshot/report or permanent promotion |
| "Make this code/design understandable" | Interactive explainer | static, optional db/export | Workers Static Assets/R2 bundle, DO only if comments are enabled | Review summary + change list |
| "Prototype this workflow" | Product/demo app | db, identity, optional realtime | DO for workflow state, Access/private deploy first | Spec decisions or promoted app |
| "Build a tiny utility" | Personal tool | db/files/export | DO for state, R2 for files, private owner deploy by default | Tool stays live or exports results |
| "Make it multiplayer/live" | Realtime toy/workbench | realtime, db, identity | DO WebSockets + SQLite; small rooms and hibernation | Optional archive only |
| "Let people upload/respond" | Intake form/workbench | files, db, identity, export | R2 uploads, DO metadata/quotas, Access/invite gate | Export package + synthesis |

## Type: Group Feedback Flare

Use for transcripts, call notes, planning sessions, design reviews, stakeholder meetings, RFCs, retros.

Recommended structure:

```yaml
title: <meeting/spec name> follow-up
audience: <people/team/email list>
source_context:
  - transcript or notes used
  - repo/docs used, if any
identity: named | anonymous | pseudonymous
expires: <date/time>
capabilities:
  identity: true
  db: true
  events: true
  export: true
sections:
  synthesis: 5-10 bullets max
  decisions_detected: reviewable/steerable before sharing
  open_questions: questions needing group input
  interaction: poll/ranking/comments/free response
```

Cloudflare defaults:

- Store votes/comments as documents/events in the Flare Durable Object.
- Store only registry/search metadata in D1.
- Use Access OTP allowlists or explicit invite gates for named feedback.
- Export JSON/Markdown before archiving.

## Type: Mini Dashboard

Use when an agent can turn source data into a lightweight live view: project status, personal metrics, logs, research coding progress, task burndown, or cost tracking.

Good defaults:

- read-only first;
- visible data freshness timestamp;
- export/snapshot button;
- no auto-refresh unless needed;
- clear distinction between generated summary and raw data.

Cloudflare defaults:

- Use R2 for source snapshots and exported report bundles.
- Use the Durable Object only for annotations, saved filters, comments, and lightweight mutable state.
- Use Workflows only when refresh/summarize/publish is a durable multi-step lifecycle.

## Type: Interactive Explainer

Use when context includes a codebase, architecture, process, decision tree, or dataset that needs interaction.

Interactions:

- step-through flow;
- toggles for variants;
- annotated diagram;
- hover/click details;
- “what is unclear?” comments;
- “which path should we take?” poll.

Pair with `visual-deliverables` for one-file HTML quality and `breadboarding` for workflow maps.

Cloudflare defaults:

- Keep it static unless comments, votes, or saved views are explicitly useful.
- If comments are enabled, use the same `db` and `export` capabilities as group feedback Flares.

## Type: Product / Workflow Demo

Use for small prototypes where stakeholders should feel the workflow, not read a spec.

Examples:

- mocked onboarding flow with state saved locally/platform-side;
- mini CRM/client portal demo;
- search/filter/review workbench over a static dataset;
- prompt/workflow tuner with saved variants.

Defer backend complexity. Use fake/static data or the zero-config DB until a real integration is necessary.

Cloudflare defaults:

- Deploy private first.
- Use DO SQLite for prototype state rather than provisioning a separate database.
- Promote to a normal maintained app only after the workflow stabilizes.

## Type: Personal Tool

Use for utilities you may keep around:

- calculators;
- habit/tracking tools;
- packing/checklist tools;
- tiny upload-and-transform tools;
- personal note/workflow companions.

If it becomes important or long-lived, promote it out of the ephemeral namespace and give it normal maintenance expectations.

Cloudflare defaults:

- Prefer private owner access.
- Use R2 only when the tool handles files or produces durable artifacts.
- Add a clear export path before relying on it for real personal data.

## Type: Realtime Toy / Workbench

Use for multiplayer cursors, live polls, games, collaborative sorting, or shared timers.

Default constraints:

- small room sizes;
- rate-limited events;
- no sensitive data;
- clear reset/archive behavior;
- graceful fallback when websockets fail.

Cloudflare defaults:

- Use one Durable Object room per Flare.
- Store only durable events/results needed for replay/export; keep cursors/presence ephemeral.
- Enforce message quotas in the Durable Object.

## Type: Intake / Upload Surface

Use when people need to send structured responses, attachments, screenshots, or files to the agent/operator.

Default constraints:

- file type and size limits;
- visible retention policy;
- malware/privacy caveat for downloaded files;
- export bundle for owner;
- no raw upload sharing unless reviewed.

Cloudflare defaults:

- Store uploaded blobs in R2 under a per-Flare prefix.
- Store file metadata and quota counters in the Durable Object.
- Use Queues for asynchronous file processing/export bundling.
- Require stronger auth for uploads than for read-only demos.

## Invite / Share Copy Template

```markdown
Subject: Quick input/request: <Flare title>

I used an agent to create a small Flare for <purpose>:

<link>

What to do:
1. <primary action>
2. <secondary action>
3. <deadline/expiry>

Privacy/data: <named/anonymous/public/unlisted/access-gated>. The Flare stores <data captured> and exports to <durable location>.
```

## Close-the-Loop Prompt

When a Flare gathers data, ask the agent to produce:

```markdown
Using the Flare manifest, source context, and exported Flare data, create a concise follow-up note with:
- what the Flare was for;
- response/usage count and audience caveats;
- consensus, patterns, or important outputs;
- disagreements or anomalies;
- decisions confirmed;
- open questions;
- recommended next action;
- appendix with raw/export location.
```
