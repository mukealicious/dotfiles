# Flare Deploy Workflow

This workflow turns a local Flare draft into a Cloudflare-hosted micro app while keeping generated clients thin and operations auditable.

## Modes

| Mode | Meaning | Allowed without approval? |
|---|---|---|
| `local` | Static draft in repo or temp dir; no network deploy. | Yes, when user asked to build. |
| `preview` | Deployed to a private/owner-only preview route or workers.dev URL. | Ask before first deploy if source context is private. |
| `unlisted` | Bearer-link access; not private. | Ask. |
| `access-otp` | Cloudflare Access verifies email/PIN for allowed audience. | Ask, including invite/audience text. |
| `public` | Public route/indexable unless blocked. | Ask explicitly. |
| `promoted` | Durable app/site with longer-term operations. | Ask and document. |

## End-to-End Steps

1. **Frame the Flare**
   - Purpose, audience, source summary, expiry, export path.
   - Choose capabilities: static, db, events, files, identity, realtime, AI, export.
   - Choose auth mode honestly; never call `unlisted` private.

2. **Create a local packet**
   - `manifest.json` with steering fields.
   - `index.html`, `app.js`, `styles.css` as a thin client.
   - `schema.json` if persisted document shapes matter.
   - Avoid external scripts/CDNs unless approved.

3. **Choose platform slice**
   - Static only: Workers Static Assets or R2 bundle behind host Worker.
   - Interactive: add Durable Object SQLite document API and export route.
   - Shared/invited: add Access or signed invite gate.
   - Large files: add R2 upload/export prefixes.
   - AI: add server-side Workers AI or AI Gateway with budgets and data policy.

4. **Verify Cloudflare APIs**
   - Use Cloudflare MCP `docs` for current Wrangler/API syntax.
   - Use MCP `search`/`execute` for account/resource discovery and setup operations.
   - Use `wrangler` for reproducible deploys from local source.

5. **Steering gate before publish**
   Show the user:
   - source summary and privacy redactions;
   - URL/route to be created;
   - auth mode and audience;
   - data captured and storage location;
   - expiry/archive/export plan;
   - Cloudflare resources to create/change;
   - whether AI sees private data.

6. **Deploy**
   - Run the smallest deploy command needed.
   - Confirm route, manifest, identity, write API, and export route.
   - Record URL and resource names in a deployment note or manifest steering log.

7. **Operate and close**
   - Export collected data to JSON/Markdown.
   - Summarize results back into durable notes/tasks/decisions.
   - Archive/delete/promote based on manifest retention.

## Resource Naming

Use stable, searchable names:

| Resource | Pattern |
|---|---|
| Worker | `flare-host` for platform, or `flare-<slug>` for early one-offs |
| Durable Object class | `FlareObject` |
| R2 bucket | `flares` or `muke-flares` |
| D1 database | `flare_registry` |
| Queue | `flare-jobs` |
| Access app | `flare-<namespace>` or route-specific name |
| R2 bundle prefix | `flares/<slug>/bundle/<version>/` |
| R2 export prefix | `flares/<slug>/exports/` |

For one-off experiments, prefer names that can later be migrated into the shared platform without breaking URLs.

## Validation Checklist

Before saying a hosted Flare is done:

- [ ] Manifest is served or included and matches deployed behavior.
- [ ] Auth/expiry are enforced server-side, not just in UI.
- [ ] Client code contains no Cloudflare credentials or model/provider keys.
- [ ] Data writes validate capability, role, expiry, schema, size, and quota.
- [ ] Export route returns all persisted documents/events/files metadata.
- [ ] Public/unlisted/access modes are labeled honestly in UI.
- [ ] `wrangler.jsonc`, migrations, and deployment notes are committed or ready for review.
- [ ] User approved any public URL, invite, DNS, or private-data AI use.

## Failure Handling

If deploy/setup fails:

- State what changed and what did not.
- Preserve local source and manifest.
- Roll back only changes made in this session and only when safe/approved.
- Record partial Cloudflare resources so the user can inspect/delete them.
- Do not retry by broadening credentials or making the Flare public.
