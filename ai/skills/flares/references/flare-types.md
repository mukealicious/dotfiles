# Flare Types

## Selection Guide

| User Intent | Flare Type | Typical APIs | Durable Follow-Up |
|---|---|---|---|
| “Create a follow-up synthesis + poll” | Group feedback Flare | identity, db, export | Decision note + action items |
| “Spin up a quick dashboard” | Mini dashboard | db, files, optional AI | Snapshot/report or permanent promotion |
| “Make this code/design understandable” | Interactive explainer | static, comments/export | Review summary + change list |
| “Prototype this workflow” | Product/demo app | db, identity, optional realtime | Spec decisions or promoted app |
| “Build a tiny utility” | Personal tool | db/files | Tool stays live or exports results |
| “Make it multiplayer/live” | Realtime toy/workbench | realtime, db, identity | Optional archive only |
| “Let people upload/respond” | Intake form/workbench | files, db, identity | Export package + synthesis |

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
sections:
  synthesis: 5-10 bullets max
  decisions_detected: reviewable/steerable before sharing
  open_questions: questions needing group input
  interaction: poll/ranking/comments/free response
```

## Type: Mini Dashboard

Use when an agent can turn source data into a lightweight live view: project status, personal metrics, logs, research coding progress, task burndown, or cost tracking.

Good defaults:

- read-only first;
- visible data freshness timestamp;
- export/snapshot button;
- no auto-refresh unless needed;
- clear distinction between generated summary and raw data.

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

## Type: Product / Workflow Demo

Use for small prototypes where stakeholders should feel the workflow, not read a spec.

Examples:

- mocked onboarding flow with state saved locally/platform-side;
- mini CRM/client portal demo;
- search/filter/review workbench over a static dataset;
- prompt/workflow tuner with saved variants.

Defer backend complexity. Use fake/static data or the zero-config DB until a real integration is necessary.

## Type: Personal Tool

Use for utilities you may keep around:

- calculators;
- habit/tracking tools;
- packing/checklist tools;
- tiny upload-and-transform tools;
- personal note/workflow companions.

If it becomes important or long-lived, promote it out of the ephemeral namespace and give it normal maintenance expectations.

## Type: Realtime Toy / Workbench

Use for multiplayer cursors, live polls, games, collaborative sorting, or shared timers.

Default constraints:

- small room sizes;
- rate-limited events;
- no sensitive data;
- clear reset/archive behavior;
- graceful fallback when websockets fail.

## Type: Intake / Upload Surface

Use when people need to send structured responses, attachments, screenshots, or files to the agent/operator.

Default constraints:

- file type and size limits;
- visible retention policy;
- malware/privacy caveat for downloaded files;
- export bundle for owner;
- no raw upload sharing unless reviewed.

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
