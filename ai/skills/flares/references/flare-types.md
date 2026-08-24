# Flare Types

## Selection Guide

Choose the smallest shape that demonstrates the intended interaction. Static Flares need no persistence. Interactive V1 Flares declare typed activity rather than a generic database.

| User intent | Shape | Example activity types | Durable follow-up |
|---|---|---|---|
| “Collect feedback on this design” | Feedback surface | `design.comment`, `design.reaction` | Review summary and change list |
| “Run a quick poll or ranking” | Poll/ranking | `poll.vote`, `ranking.submitted` | Decision note with counts/caveats |
| “Let people answer these questions” | Structured submission | `response.submitted` | JSON/Markdown response export |
| “Make this easier to understand” | Interactive explainer | Optional `explainer.comment` | Clarifications and next actions |
| “Spin up a quick dashboard” | Read-only dashboard | Optional `dashboard.annotation` | Snapshot/report |
| “Prototype this workflow” | Product/demo app | Optional `demo.feedback` | Spec decisions or promoted app |
| “Build a tiny utility” | Calculator/tool | Optional `result.saved` | Exported result or maintained tool |

## Feedback Surface

Use for transcripts, planning sessions, design reviews, RFCs, retrospectives, and stakeholder follow-up.

Good activity definitions:

```text
design.comment.v1
  body: string
  target?: string
  sentiment?: "support" | "concern" | "question"

poll.vote.v1
  optionId: string
  rationale?: string
```

Keep source material summarized and purpose-built. Do not publish a raw transcript or private repository context merely because it was input to generation.

## Poll or Ranking

Use one immutable submission per user action. Do not imply that append-only activity enforces “one final vote per person” unless the platform has an explicit projection or domain rule for that behavior.

Useful types:

- `poll.vote` for one choice;
- `poll.selection` for multiple choices;
- `ranking.submitted` for an ordered list;
- `poll.comment` for optional rationale.

The UI can show optimistic confirmation, but authoritative totals and eligibility remain server-owned concerns.

## Structured Submission

Use for short forms whose values can be represented as bounded JSON. Create one schema for the domain submission rather than a generic form-record collection.

Examples:

- `retro.response` with `wentWell`, `needsChange`, and `action`;
- `research.coding` with `sourceId`, `code`, and `note`;
- `decision.input` with `position`, `reasoning`, and `risk`.

File uploads are not part of V1. If files are essential, stop and shape a separate files capability rather than embedding base64 data in activity.

## Interactive Explainer

Keep the explainer static unless persistent feedback is genuinely useful. Good interactions include step-through flows, toggled variants, annotated diagrams, and local calculations.

If feedback is enabled, declare a narrow type such as `explainer.comment`; do not add a generic database “just in case.” Pair with `visual-deliverables`, `impeccable`, or `breadboarding` when appropriate.

## Read-Only Dashboard

Prefer a built snapshot with a visible source/freshness timestamp. V1 does not provide arbitrary platform-side ingestion or scheduled refresh.

Optional annotations can use activity, but the underlying dashboard dataset remains part of the packet or an explicitly approved future integration.

## Product / Workflow Demo

Use static or fake data to demonstrate the workflow. Activity can collect feedback on steps, copy, or decisions. Do not turn prototype state into a production database contract accidentally.

Promote a useful demo into a maintained application when it gains integrations, destructive actions, durable mutable records, or operational expectations beyond the Flare platform.

## Personal Tool

Calculators and small utilities can stay entirely client-side. Add activity only for outcomes the owner deliberately wants to retain. Do not log every interaction by default.

## Deferred Shapes

These require capability design beyond the first platform contract:

| Shape | Missing capability |
|---|---|
| Intake with attachments | Files, scanning, quotas, retention, download authorization |
| Multiplayer/live workbench | Realtime protocol, presence, reconnection, room limits |
| Editable tracker/CRM | Generic mutable records, concurrency, deletion, migration |
| Public/community form | Participant auth, abuse prevention, privacy, rate policy |
| AI workbench | Model boundary, budgets, data-use policy, provenance |
| Voice surface | Recording consent, media storage, transcription, deletion |

Do not approximate these with unbounded activity payloads or custom per-Flare backends.

## Close the Loop

After a Flare gathers activity, use the owner Console or CLI export to produce:

- purpose and audience caveats;
- response/activity count;
- patterns, disagreements, and anomalies;
- decisions confirmed;
- open questions;
- recommended next action;
- raw JSON/Markdown export location.
