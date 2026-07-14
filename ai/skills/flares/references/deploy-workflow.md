# Flare Packet and Deploy Workflow

This workflow turns a local framework-independent packet into an owner-only deployment through the platform CLI. Cloudflare MCP manages infrastructure; it does not upload activity or replace the platform Management API.

## Modes

| Mode | Meaning | V1 status |
|---|---|---|
| Local | Packet source/build output with no remote mutation. | Supported; no approval beyond the request to build. |
| Owner preview | Stable route protected for the owner through Cloudflare Access. | First hosted slice; explicit approval before apply. |
| Participant/invited | Shared with selected people. | Deferred pending auth/privacy design. |
| Unlisted/public | Bearer-link or public access. | Deferred; never describe unlisted as private. |
| Promoted | Maintained application/site outside the Flare lifecycle. | Separate engineering decision. |

## Packet

```text
flare.json
activity-schemas/
  <type>.v<version>.schema.json
dist/
  index.html
  assets/
```

Rules:

- `flare.json` follows [steering-contract.md](./steering-contract.md).
- Every activity schema is local, versioned, and referenced by the manifest.
- `dist/` is built static output; no frontend framework is required or assumed.
- Paths are relative/normalized and cannot escape the packet root.
- Symlinks, device files, hidden credentials, environment files, and custom server code are rejected.
- Packet contains no account ID, route, Access token, API key, owner email, or mutable deployment state.
- V1 packet maximum is 5 MiB.

## End-to-End Steps

1. **Frame**
   - State purpose, source summary, expected user action, and durable follow-up.
   - Decide whether the Flare can remain static or needs declared activity.

2. **Build locally**
   - Create/update `flare.json` and local activity schemas.
   - Build static assets into `dist/`.
   - Avoid external scripts, analytics, fonts, embeds, or CDNs unless approved.

3. **Validate**
   - Validate manifest/schema syntax and references.
   - Reject undeclared types, duplicate type names, unsafe paths, unsupported schema features, oversize files/payload limits, and secrets.
   - Build a canonical file index with path, size, and SHA-256.

4. **Preview**
   - Exercise the UI locally with a development adapter or fixtures matching the Runtime API.
   - Do not create a one-off Worker/backend when the shared platform is unavailable.

5. **Plan**
   - Run the platform CLI’s non-mutating plan command.
   - Review target Flare, stable route, expected active deployment, packet checksum, revision change, schemas, files, and Cloudflare resources.

6. **Approval gate**
   - Show the exact plan hash and external effects.
   - Get explicit approval before applying a hosted deployment or changing routes/Access/infrastructure.

7. **Apply**
   - Apply the exact approved plan hash and packet.
   - The platform re-hashes all files and target preconditions before activation.
   - Confirm Flare, revision, deployment, target, route, and packet identifiers.

8. **Verify and close**
   - Load bootstrap/assets, append one valid activity record, inspect it in Console, and retrieve it through CLI JSON/Markdown output.
   - Record the stable route and IDs in normal project notes if needed; never write credentials into the packet.

## CLI Contract

```bash
flare deploy <packet-dir> --plan [--flare <id-or-slug>]
flare deploy <packet-dir> --apply --approved-plan <hash> [--flare <id-or-slug>]
flare list [--status active|archived] [--json]
flare show <id-or-slug> [--json]
flare activity <id-or-slug> [--type <name>] [--since <duration>] [--format table|json|markdown]
```

Rules:

- `--plan` never mutates local or remote state.
- `--apply` is always explicit and requires the reviewed plan hash.
- Changed packet bytes or target state require a new plan.
- Retrying an already-applied hash returns the original deployment after a lost response.
- Read commands support deterministic JSON for external agents.
- CLI is a thin Management API adapter; it does not call D1, R2, Durable Objects, or Cloudflare account APIs directly.
- CLI auth uses a scoped Access service token from private environment variables or `op run`; never print/store it.

## Infrastructure Preparation

Use [cloudflare-mcp.md](./cloudflare-mcp.md) only for account/resource discovery and approved setup such as:

- inspect/create the shared Worker resources;
- inspect/create D1 and R2 resources;
- configure Access applications/policies;
- inspect routes or DNS.

Use reproducible platform-repository configuration for Worker deployment. MCP state must not be the only record of live infrastructure.

## Naming and Routes

The initial platform uses one shared host and stable path routes such as `/f/<slug>/`. Suggested resource names:

| Resource | Pattern |
|---|---|
| Worker | `flare-host` |
| Durable Object class | `FlareObject` |
| R2 bucket | `flares` or an account-qualified equivalent |
| D1 database | `flare-catalog` |
| Access application | `flare-owner` |
| Revision prefix | `flares/<flare-id>/revisions/<revision-number>/` |

Hostnames are product language, not packet state. Potential namespaces such as `ask`, `quick`, or `labs` may be chosen later, but V1 should not split infrastructure by Flare type.

## Approval Summary

Before apply, present:

```markdown
Flare: <title and stable ID/new>
Purpose/source: <one sentence each; private material called out>
Packet: <checksum, size, activity types>
Target: <owner-only route and current deployment>
Changes: <new revision/deployment and infrastructure mutations, if any>
Data: <captured activity and JSON/Markdown export>
Plan hash: <exact approved hash>
```

## Failure Handling

- State the failed stage, known cause, impact, and preserved state.
- Preserve local packet source and previous active deployment.
- Report staged D1/R2/DO state precisely; do not label partial work successful.
- Retry only through the same idempotent plan/apply contract.
- Do not broaden credentials, make the Flare public, mutate DNS, or delete staged resources to “fix” a failure.
- Cleanup, archive, purge, and rollback are explicit owner actions.
