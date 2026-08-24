# Flare Steering Contract

## Goal

A Flare must be inspectable and redirectable without embedding mutable infrastructure state or secrets in its packet. `flare.json` describes the generated client’s purpose, activity contract, data policy, and limits. Source-review notes, approval, deployment, and access state belong to the plan/apply workflow and platform catalog.

Drafting and local iteration can proceed when requested. Publishing, routes/DNS, invitations, resource mutation, and exposure of private context require explicit approval.

## Canonical `flare.json`

```json
{
  "schemaVersion": 1,
  "slug": "design-review-follow-up",
  "title": "Design review follow-up",
  "purpose": "Collect focused comments on the proposed results experience.",
  "capabilities": {
    "activity": true
  },
  "activityTypes": [
    {
      "name": "design.comment",
      "version": 1,
      "label": "Design comment",
      "schema": "activity-schemas/design.comment.v1.schema.json"
    }
  ],
  "auth": {
    "mode": "owner-access"
  },
  "dataPolicy": {
    "captured": ["comment body", "optional interface target"],
    "exportFormats": ["json", "markdown"]
  },
  "limits": {
    "maxActivityRecords": 1000,
    "maxActivityPayloadBytes": 16384
  }
}
```

Use [the template](../assets/templates/flare.json) as a starting point.

## Field Ownership

| Field | Meaning |
|---|---|
| `schemaVersion` | Packet manifest schema version. |
| `slug` | Requested stable path name; platform validates uniqueness and format. |
| `title` | Human-readable name. |
| `purpose` | One sentence describing what users should do or learn. |
| `capabilities.activity` | Whether this revision uses the V1 activity Runtime API. |
| `activityTypes` | Revision-scoped type names, versions, labels, and local schema paths. |
| `auth.mode` | Access contract requested by the packet; V1 accepts only `owner-access`. |
| `dataPolicy.captured` | Plain-language description of every collected field. |
| `dataPolicy.exportFormats` | Owner export formats expected from Management API. |
| `limits` | Revision-requested bounds, never higher than platform ceilings. |

The platform derives stable Flare/revision/deployment IDs, owner identity, route, actor, timestamps, checksums, and live status. Do not put those mutable or environment-specific values in `flare.json`.

Source provenance and privacy review stay beside the packet in local project notes or the deployment plan. They must be presented at approval time but are not published automatically as client manifest data.

## Activity Type Definitions

Each type has:

- a stable lowercase dotted/dashed name;
- positive integer version;
- human label;
- local JSON Schema Draft 2020-12 file.

Rules:

- One version of a type name per revision.
- Published `(name, version)` semantics never change; use a new version in a later revision.
- `$ref` may target only local fragments in the same schema document.
- Remote/cross-file references and unsupported validator keywords are rejected.
- Schemas and payloads must remain within platform size/depth bounds.
- `maxActivityPayloadBytes` may lower but not exceed the 16 KiB platform ceiling.
- UI labels/help text may evolve with a new revision; server validation remains authoritative.

Example schema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "additionalProperties": false,
  "required": ["body"],
  "properties": {
    "body": {
      "type": "string",
      "minLength": 1,
      "maxLength": 4000
    },
    "target": {
      "type": "string",
      "maxLength": 200
    }
  }
}
```

## Packet and Platform State

| Packet owns | Platform catalog/plan owns |
|---|---|
| Purpose, capability, auth request | Stable Flare identity and owner subject |
| Activity type/schema declarations | Immutable revision checksum/provenance |
| Built static assets | Stable deployment target and route |
| Data-policy explanation and limits | Active deployment pointer and history |
| Requested slug | Access assertions and service-token subjects |
| - | Source/privacy review and exact approval record |

This boundary keeps packets portable and secret-free.

## Approval Gate

Require explicit owner approval before:

- applying the first or a changed hosted deployment;
- creating/changing public routes, DNS, Access applications, or policies;
- exposing transcripts, private notes, client data, repository context, or screenshots;
- adding external scripts, analytics, fonts, embeds, or CDNs;
- inviting participants or enabling public writes;
- adding paid/recurring infrastructure;
- archiving, purging, redacting, migrating, or deleting stored data.

The plan presented for approval includes:

```markdown
Flare: <title and stable ID/new>
Purpose/source: <one sentence each; private material called out>
Packet: <checksum, size, activity types and captured fields>
Target: <owner-only route and expected active deployment>
Changes: <new revision/deployment and infrastructure mutations, if any>
Data/export: <limits and JSON/Markdown formats>
Plan hash: <exact approved hash>
```

Applying requires that exact hash. Changed packet bytes or target state require a new plan.

## Revision Steering

Changes to purpose, UI, activity schema, requested access, or data policy create a new immutable revision when deployed. Do not mutate a published packet in place.

A stable Flare may accumulate many revisions/deployments while keeping one activity history. Activity records retain originating revision/deployment provenance.

## Lifecycle

V1 platform statuses describe catalog state, but no timer changes them automatically. Owner actions may later deploy a new revision, archive a Flare, apply a separately reviewed redaction/purge contract, or promote the generated tool into a maintained application.

Do not promise automatic expiration/deletion or silently run cleanup jobs.

## Future Share Gate

Participant/invite/public modes are deferred, but any future share operation must present exact audience/access, captured activity, route forwarding/indexing behavior, lifecycle, export, and share copy. Never call an unlisted/bearer URL private.

## Close the Loop

Use Console or CLI owner export to produce JSON/Markdown, then record important decisions/actions in their durable system. The live Flare should not be the only copy of consequential outcomes.
