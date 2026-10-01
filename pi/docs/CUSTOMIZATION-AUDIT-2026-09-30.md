> **Historical archive — not current authority.** This is the complete audit as it stood before the compact current contract. Its recommendations, package/feature claims, validation receipts, and implementation state were not reconciled after later changes. Read [`../CUSTOMIZATION-AUDIT.md`](../CUSTOMIZATION-AUDIT.md) for current decisions; use this archive only as historical evidence.

# Native-first Pi customization audit

Reviewed 2026-09-29 against installed **Pi 0.99.1**. Findings below describe the
audit baseline; implementation progress is tracked separately here. Preserve the
in-progress consolidation, custom resources, credentials, histories, and user-owned work.

## Current decision: retire custom handoff — 2026-09-30

The operator chose native conversation controls, codemode tool composition and
upstream subagent workflows instead of the custom handoff product. This decision
supersedes the handoff-retention recommendations and receipts below.

Removed `extensions/handoff.ts`, `lib/handoff-connections.ts`, their dedicated
tests, the shared `ai/skills/handoff/` skill and watch entry. Updated Mu Mode to
continue approved work in place, respect explicit checkpoints and use native
resume without prescribing the retired commands. No replacement orchestrator,
backlink reader, compatibility command or custom workflow state machine was added.
`subagent` remains model-only; its own workflow scripts, not codemode, coordinate
children. Codemode remains for ordinary tool composition.

Only exact installer-owned extension/library links are retired. Existing handoff
documents, connection files and custom session entries remain historical data;
there is no longer automatic continuation or a custom backlink UI. Unmanaged
files/links and original profiles are preserved. The removed dirty source and
tests were saved to `~/.pi/backups/handoff-retirement-20260930T161047.tar.gz`.

Validation: 132 remaining owned native/extension/migration/policy/web tests and
11 watchlist tests passed; both Pi/AI installer suites, configured TypeScript and
diff hygiene passed. Dedicated tests of the retired handoff behavior were removed
with that implementation. Installer coverage now verifies removal of exact managed
links and preservation of historical connection data and unmanaged entries.

Applied through the AI projection installer and narrowly removed the two exact
managed handoff extension/library links; did not run the dependency-rebuilding Pi
installer. Fresh installed loaders at repo, nested `pi/` and `/private/tmp` report
9 extensions, 46 skills and zero diagnostics; the retired commands/tools/skill are
absent and upstream `subagent` remains available. Restart the current Pi session
to discard its already-loaded handoff tools. No provider calls or commits.

The separately identified projection-path, installer false-success and live
`npm ci` issues remain follow-up work; this removal does not claim to fix them.

## Upstream-first follow-through — 2026-09-30

This section supersedes older preservation decisions for Parallel, Mitsupi and
skills below. The operator approved delegated implementation and explicitly
accepted upstream Parallel's narrower interface rather than maintaining unused
research/enrichment capabilities.

| Surface | Adopted decision | Deleted complexity / retained exception |
|---|---|---|
| Parallel | Unchanged `HazAT/pi-parallel@75d933b86d304c2e7beab25c5429fd497b8cc36f`, version 3.0.0 | Retired CLI process/poll/temp-output machinery, research/enrichment, extra search controls, full structured results and fork-specific tests. Two direct HTTP tools remain. |
| Mitsupi | Native Git package `mitsuhiko/agent-stuff@0865c849befd2021490679f96a8dee58c84ac857`, manifest still 1.6.0 | Removed the shortcut patch now implemented upstream. Exact ref/origin and patch context verified by installer. Only files/todos and eight existing skills selected. |
| Mermaid | Frozen skill and validator from `mitsuhiko/agent-stuff@b7c45d67c634d361d67340789a02f64ffb9e16f1` under `ai/skills/mermaid/` | Upstream deleted it; preserve the previously selected capability verbatim with Apache license instead of silently losing it or patching Mitsupi. Shared projection now owns this portable snapshot. |
| `/fast` | Keep reviewed npm 1.1.1 and three policy patches unchanged | Reproduced spending-consent/trust/allowlist/config-failure protections remain necessary; no replacement fork or artificial consolidation. |
| `bro`, `grilling`, `domain-modeling` | `dmmulroy/.dotfiles@7c086fe40c01bf494aea7184da2eb7aaf7b7dff4` | Upstream instructions, with provenance metadata only (domain skill also normalizes trailing blank line). ADR and context-map material removed rather than restored as a compatibility fork. |
| `implement` | Retired | Shared operating instructions already own ordinary implementation. Removed wrapper, watch entry and live references. |
| `post-mortem` | `walterra/agent-tools@a678024a6fa7a765cd83997b3153f2eebb588d58` | Upstream workflow with narrow portable authoring-location and fetch-tool wording. Approval checkpoint retained. |
| TDD, handoff, Exa | No implementation change in this wave | Methodology, continuation/backlinks and Exa API capabilities are distinct decisions, not silently replaced. |

### Review and integration

Four isolated writers and two read-only reviewers ran in workflow
`c0fbcdd1-c346-41d7-a912-9a3536d2c06d`; the parent integrated baseline-relative
changes without reverting the dirty checkout. Runtime-managed writer/reviewer
reports remain in that workflow's session artifacts.

Accepted review findings were corrected: remove duplicate/unfiltered Mitsupi
selection risk, use real source settings in installer fixtures, remove retired
research tools from the researcher, preserve batch-review provenance, reconcile
live skill/documentation references, and execute Parallel HTTP-boundary tests.
The proposed context-map compatibility guard was not adopted: it would restore
intentionally retired upstream scope; repository-local conventions remain the
owner of existing document layouts. Parent identity checks also corrected the
skill candidate to the actual current upstream text instead of an adapted old
snapshot. No upstream implementation patch was needed for Parallel.

Installed-resource checks caught Mermaid's upstream removal, which the writers'
file-count checks missed. The package boundary test now verifies every explicitly
selected resource exists; AI installer tests verify Mermaid projection and the
absence of the retired implementation wrapper.

### Acceptance and preservation

- **169 owned native/extension/migration/policy/web tests passed**, zero failures
  or skips; **11 watchlist tests passed**. Five shell suites and configured Pi
  TypeScript check passed. Prior full subagents-suite results below are historical,
  not rerun in this wave; its implementation was not changed.
- Parallel source was recursively compared against its exact archive; only local
  provenance differs. Skill source comparisons exclude provenance metadata and
  trailing whitespace. Mermaid's two files match its historical Git revision.
- Real Pi 0.99.1 loader tests execute upstream Parallel with disposable credentials
  and mocked HTTP: supported request shapes, auth failures, cancellation, invalid
  JSON/shapes and partial extraction. Native Exa/codemode coverage was relocated
  rather than discarded with the mixed CLI fixture.
- Native pinned-Git installation was exercised first in a disposable agent
  directory, then through the real owning installers. Reinstallation recognizes
  the already-applied safety patches. Native npm dependency installation prunes
  peer-only lockfile entries in the installed Git checkout; the only implementation
  deltas there are the two declared Mitsupi patches.
- Installed discovery in the repo, nested `pi/` and external `/private/tmp`
  reports **10 extensions, 47 skills, zero loader/skill diagnostics**. Exactly one
  Mermaid skill and one curated Mitsupi Git selection; no retired research tools
  or implementation wrapper. Every selected Mitsupi resource exists.
- Credential/MCP/model/fast/Parallel-auth paths are hash-checked across installation;
  runtime-owned preferences are preserved. Old npm package files, original
  profiles, histories and previous rollback backups are retained, not selected or
  deleted by the migration. No consolidation or priority-retirement rerun.
- Removed automatic Parallel CLI download and its doctor requirement; existing
  CLI and auth files remain untouched. `/parallel-setup` can configure an API key.
- Rollback inputs: `~/.pi/backups/pi-parallel-before-upstream-3-20260930.tar.gz`
  and `~/.pi/backups/settings-before-upstream-adoption-20260930.json`.
  The affected source baseline is also retained in
  `~/.pi/backups/upstream-adoption-source-baseline-20260930.tar.gz`.
- No live web-provider jobs, credential refreshes, model requests in acceptance
  tests, commits or pushes. Authorized subagents did use models. Mermaid rendering
  and its on-demand npm/Chromium downloads were not run.

Restart Pi to replace the previously loaded tool schemas and skill paths. The
five remaining package patch files cover two Mitsupi safety concerns and three
fast policy concerns; this is not a claim that every skill/extension in the
repository has now been reviewed or made upstream-identical.

## Unchanged upstream adoption — 2026-09-30

**Current decision supersedes all fork-specific preservation plans and guarantees
below.** Adopted `pi-subagents@0.74.0` at reviewed revision
`b6bda32f03b7f549623bc404c9be14dca298ddc4`, unchanged. We own source selection,
installation and supported configuration; upstream owns implementation and its
matching skill. No resolver, trust, lifecycle, managed-link or async patches were
transplanted. Earlier sections are historical, not guarantees for this release.

### Cutover and configuration

- Checked for active detached runner processes before replacement; none found.
  Preserved the complete outgoing dirty vendor tree before replacing it:
  `~/.pi/backups/pi-subagents-before-0.74.0-20260930T130849.tar.gz`.
- Every upstream file matches the pinned source archive. `VENDORED_FROM.md` is
  the only added source file; production `node_modules/` contains the four exact
  runtime dependencies. Retained upstream tests and lockfile unchanged.
- Removed obsolete surrounding tests for the fork's CLI prompt builder, native
  delegated resolver and saved-trust policy. Kept native tool restrictions and
  orchestration exposure tests independent of the retired builder. Added two
  small manifest/configuration/host-child checks; no replacement resolver tests.
- Source settings select the matching `pi-subagents` skill, excluding optional
  package prompts and council skill from native automatic loading. Supported
  settings override scout to read-only Luna and worker to Luna. The source-owned
  researcher uses Sol and explicitly loads the existing Exa/Parallel providers;
  the existing read-only Sol `review` remains. Other builtins keep upstream
  defaults, including the distinct, write-capable `reviewer`.
- Existing installers already support upstream's manifest, lockfile, dependency
  installation and agent projection; no new installation framework was needed.
  Extended installer tests for selected resources, personal override preservation
  and the researcher projection. Ran both owning installers successfully.
- Accepted upstream semantics: foreground SDK sessions, detached background
  runner, upstream terminal/drain lifecycle, custom skill discovery that can see
  native-filtered package skills, and project-agent discovery without native
  trust input. Child execution forwards parent trust instead of the old fork's
  alternate-cwd saved-trust lookup. Manual-only skills are filtered on injection.
  Do not claim the old trust/discovery parity or managed-link protections.
- Upstream workflow/schema/configuration conventions replace the old ones.
  Historical saved chains/runs remain on disk, without compatibility promises.
  Separate handoff extensions, receipts, original profiles and migration rollback
  remain untouched. Restart Pi before delegation; this session loaded the old
  extension schema before the source-linked replacement.

### Fresh acceptance

| Gate | Result |
|---|---|
| Pinned source identity | Recursive comparison clean, excluding provenance and installed dependencies |
| Upstream unit, declared Pi 0.87.0 dev toolchain | **3,527 passed, 12 skipped, zero failures** |
| Upstream integration, declared dev toolchain | **1,144 passed, 7 skipped, zero failures** |
| Owned native/extension/migration/policy/web/host seams, Pi 0.99.1 | **233 passed, zero failures/skips** |
| Watchlist | **11 passed** |
| Total completed matrix | **4,915 passed, 19 skipped, zero failures** |
| Shell suites | All five: Pi launcher/installer, shared AI installer, Herdr installer, Hammerspoon startup |
| TypeScript | Configured Pi check and unchanged upstream's full check with declared dev dependencies passed |
| Actual Pi 0.99.1 child API | Real upstream child factory creates/disposes scout and researcher SDK sessions; exact tool allowlists, named web providers and models verified; no prompts submitted |
| Installed resources | Repo, nested `pi/`, external `/private/tmp`, each untrusted: 10 extensions, 48 skills, zero loader errors or skill diagnostics; matching upstream skill selected |
| Installed roles | Discovery confirms scout/worker Luna, researcher/review Sol; restricted roles have expected tools and researcher provider paths |
| Runtime preservation | Five protected config files byte-identical across installation: auth, MCP auth/config, models and fast preferences. Resource filters verified after native local package installs. Original personal/work and consolidation rollback directories remain present |
| Diff hygiene | `git diff --check` passed |

Test harness corrections, not source fixes: first full unit attempt exceeded a
120-second tool timeout; a bounded-concurrency rerun exposed fixture failures
caused by `PI_OFFLINE`, long macOS socket paths, path canonicalization and narrow
rendering of those long paths. All disappeared with `PI_OFFLINE` unset and
`TMPDIR=/private/tmp`. npm's full dev install also required the disposable copy's
directory to be named `pi-subagents`, rather than the archive's SHA-suffixed name.
No upstream implementation or tests were changed to achieve passing results.

Skips cover opt-in native-SDK fixtures, platform-specific cases and six opt-in
live external-CLI smoke tests. The full upstream suites used their own declared
dependencies in a disposable copy; they are not a full Pi 0.99.1 compatibility
claim. Actual-host evidence covers loader, source-owned configuration, tool
exposure and child creation/disposal, not real model streaming, live provider
responses, interactive TUI or every detached recovery path. No paid/model calls,
global upgrades, real-home consolidation, priority retirement, commits or pushes.
OAuth/MCP connectivity was not re-probed; earlier connection evidence below is
historical. No whole-history hash comparison was performed in this cutover.

## Historical fork work (superseded)

## Async discovery integration review — complete

Reviewed manager rendering, management writes, detached step preparation and the
executor's async result boundary. Fixed three confirmed integration defects:

- Await detached preparation before annotating fork results and handling errors.
  Previously the executor passed a promise to `withForkContext`, losing fork
  metadata and bypassing its error-result conversion on discovery rejection.
- Validate chain skill discovery before writing a newly created chain. A broken
  declared package manifest previously left a chain file despite a failed call.
- Render explicit skill-preview errors/unavailable names rather than throwing
  out of the manager's resolved view. Injection still rejects manual-only skills;
  the renderer does not weaken that policy or inject rejected content.

Four focused assertions reproduced the failures before the fixes (including
both detached error conversion and fork metadata); retained coverage adds three
new tests and strengthens the existing detached parallel test. Fresh offline
validation with mise Node 24: **560 passed, zero failures/skips** — 289 subagent
unit, 262 integration, and nine native discovery/path tests. Configured Pi
TypeScript and `git diff --check` passed. This is a focused integration pass,
not a rerun of the historical whole-repository matrix below.

No live installation, model requests, migration, credentials/history changes,
commits or pushes. Lifecycle sharing and portable skill-projection simplification
remain unimplemented; no supervisor or native discovery replacement was added.

## Native-first simplification — delegated discovery complete

The user approved native semantics rather than preserving incidental resolver
behavior. Replaced the 896-line delegated resolver with a roughly 125-line adapter
around public `DefaultPackageManager.resolve` and `loadSkills`.

- Native Pi now owns package identity/version checks, resource ordering, filters,
  globs, ignores, canonical-path deduplication, names and frontmatter eligibility.
  Deleted the parallel implementations, metadata/content caches and direct
  `ignore` dependency. Manifest and lockfile agree without installing anything.
- The adapter retains only delegation policy: explicit project trust and agent
  directory, no installation or extension execution, cwd fallback, actionable
  malformed-manifest errors, and manual-only rejection at injection time.
- Missing/mismatched packages are skipped via the native missing-source callback
  with a diagnostic (native offline mode skips them before that callback).
  Malformed skills are unavailable, following native eligibility, rather than
  creating special parse-error sentinels. No stale installed-version fallback.
- Callers await discovery. Detached step preparation preserves sequential order
  and parallel task indexing. The manager renders its already-discovered catalog
  instead of starting async discovery during rendering; injection rechecks files.
- Removed the old 46-case native-parity suite and replaced the large filesystem
  fallback suite with two local input/output-policy tests. Native traversal and
  filter implementation details are no longer our duplicate test contract.
  Five focused native integration tests cover no-install/no-extension execution,
  version mismatch, malformed manifest, trust/manual-only/content changes, and
  cwd fallback. Existing role, path, profile, management, recovery, interruption,
  and detached integration tests remain.

Fresh acceptance: **809 tests passed, zero failures/skips** (250 native/extension/
policy/migration/web/path, 288 subagent unit, 260 integration, 11 watchlist).
All five shell suites, configured Pi TypeScript, focused strict `skills.ts`, and
`git diff --check` passed. A broader ad-hoc package check remains non-clean,
including UI/key-name types, optional message types and host peer resolution;
configured typechecking is not a package-wide type-safety claim.

Read-only installed comparisons matched all **42 native model-eligible skills**
by name and exact file path from repository, nested, and external working
locations, each trusted and untrusted. This is the current eligible inventory,
not a claim that the earlier historical total of 48 remains unchanged. No live
installer, consolidation, credentials/history mutation, model calls, commits or
pushes. Restart Pi to reload the source-linked package. Lifecycle supervisor and
cross-harness projection architecture are unchanged by this slice.

## Previous priority slice and discovery proof gate (resolved above)

Implemented the first approved slice after the full-validation/research branch:

- `/fast` is now the sole **managed** priority authority. Removed the tracked Astra
  `models.json` baseline and installer bootstrap. `/mode` remains model/thinking
  selection only; existing fast state, persistence and ordered allowlists survive.
- Added explicit `retire-astra-priority.mjs`, separate from installation and the
  profile migration. It removes only Astra's `service_tier: "priority"`, preserves
  every unrelated field, refuses non-regular files and backup conflicts, and
  saves exact original bytes before atomic replacement. Future installer runs
  leave deliberate user model overrides untouched.
- Applied that retirement to `~/.pi/agent/models.json`; exact rollback copy is
  `~/.pi/agent/models.json.before-fast-only`. Six protected configuration files
  were byte-identical across application. All **4,624** inventoried session files
  remained present without size reduction (not a whole-history byte comparison).
  Personal/work originals and the prior native-consolidation backup remain.
- Native offline payload tests prove on/off behavior through Astra → Sol → an
  unsupported Luna → Astra switches, without resetting preference or making HTTP
  calls. Restart Pi or reselect the model to discard an already-loaded override.

The next slice reached a **material compatibility gate**, not an installation
blocker. `test-native-skill-discovery.mjs` proves public
`DefaultPackageManager.resolve(() => "skip")` plus `loadSkills` can discover local
skills without package installation or extension evaluation, even with
`PI_OFFLINE` unset. It also reproduces two differences from our existing contract:

| Case | Current delegated resolver | Native read-only candidate |
|---|---|---|
| Installed npm 1.0.0, configured pin 1.2.3 | Uses installed skills; existing fallback test requires this | Skips the incompatible package without installing |
| Malformed explicitly declared package manifest | Throws an actionable error | Silently discovers conventional skills, with no diagnostic |

Do not silently weaken the preservation tests or enable automatic installation.
**Recommended decision:** adopt native skipping of mismatched pinned packages,
with an explicit diagnostic, and retain a thin malformed-manifest preflight.
At this checkpoint the version-mismatch behavior still needed approval. Production
`skills.ts`, its synchronous callers and existing parity assertions were unchanged;
the subsequent approved replacement is recorded above.
Lifecycle sharing and portable-projection cleanup have not started; the handoff
explicitly permits stopping at a material proof-gate failure.

Fresh validation after this slice: **877 tests passed, zero failures/skips**
(248 native/extension/policy/migration/web/path, 358 subagent unit, 260 integration,
11 watchlist). All five shell suites, configured Pi TypeScript, focused strict
`skills.ts`, shell syntax and `git diff --check` passed. Node 24 was invoked by
absolute mise-managed path; watchlist used Bun. No live installation, real-home
consolidation, provider/model requests, paid service jobs, commits or pushes.
OAuth/MCP/loader status was not rerun; its previous evidence below remains
historical. Broad runner strict diagnostics remain outside this slice.

## Fresh full-validation continuation (before simplification)

Re-executed the offline matrix against the current checkout; these are fresh
results, not the historical acceptance counts below. No implementation regression
was reproduced and no implementation changes were needed.

| Gate | Fresh result |
|---|---|
| Native/extension/policy/migration | 134 passed |
| Web adapters and path resolution | 106 passed |
| Subagent unit | 358 passed |
| Subagent integration | 260 passed |
| Watchlist (Bun) | 11 passed |
| Total | **869 passed, zero failures/skips** |
| Shell suites | Pi launcher/installer, shared AI installer, Herdr installer and Hammerspoon startup: all five passed |
| TypeScript | Configured Pi check and focused strict `skills.ts` check passed |
| Runner-wide strict check | Still fails with six diagnostics: optional depth, agent source union, streaming promise result, child event record, optional attention state and missing agent-core type resolution |
| Installed resources | Source-owned settings match after normalizing native relative package paths; managed extension/prompt/theme links point to source |
| Native loader | Repo, nested and external cwd, each trusted/untrusted: **10 extensions, 48 skills, zero extension errors or skill diagnostics** |
| Authentication | OpenAI `auth check --no-refresh`: ready; stored credential type is OAuth |
| Native MCP | Invibe (12), Linear (76), GitHub (45), Mobbin (3), Pencil (5): connected; status only, no tool invocations |
| Preservation | Original personal/work directories, migration marker and rollback directory remain present |

Validation runner notes: the ambient shell resolves Node 26, while mise declares
Node 24. Integration tests require Node 24's `--experimental-transform-types`;
invoking npm through mise still selected ambient Node in this environment. Running
the test command directly with `NODE="$(mise which -C ~/.dotfiles node)"` and
`"$NODE"` avoids that ambiguity. Watchlist tests require `mise exec -- bun test
ai/watch.test.ts`, not Node. The focused strict check requires
`--typeRoots ./pi/node_modules/@types` to avoid unrelated ancestor Node typings;
it passes with the same strict/Bundler/ES2022 flags as the configured check.
Initial wrong-runtime/type-root attempts were corrected and rerun, not hidden by
changes to tests or production code.

No real-home migration, installation, model requests, paid service jobs, credential
overwrite, commits or pushes were performed. Migration preservation/conflict and
installer idempotence checks ran in disposable fixtures. This pass confirms backup
presence, not a new byte-for-byte history snapshot. Live provider responses,
billing, interactive TUI/terminal resizing and OS preview apps remain untested in
this pass; earlier interactive evidence below is historical. The broad strict
TypeScript failures remain a known limitation, not a clean package-wide gate.

## Remaining review findings — patched and verified

The five follow-up finding groups are now fixed, including the additional
package-discovery cases found during implementation review. Earlier verification
sections below remain historical; current acceptance is bounded by these checks.

| Finding | Current fix and regression evidence |
|---|---|
| Malformed fast configuration roots | Separate pinned `config-root` patch rejects arrays, null, numbers, booleans and strings rather than inheriting active global policy. Untrusted project files remain ignored. Installer covers previous patch revisions, idempotence, and failure in the final staged patch without partial installation. |
| Incomplete enrichment | Compare returned rows against array input and any reported submission count. CSV requires a positive reported count. Unknown/mismatched completeness rejects in native codemode, preserving received rows and recovery IDs. |
| Lost partial reports | Parsed CLI failure payloads survive on `ParallelCliError` and in research/enrichment error details, including terminal statuses and nonzero exits. No automatic resubmission. |
| Delegated package skills | Match convention discovery, manifest glob ordering/hidden paths, bare-relative sources, object versus string specs, invalid manifest fields and empty manifests/filters. Autoload-disabled deltas reserve only touched files; the user package retains its native registration position. **46 native-loader parity tests** plus existing trust/filtering regressions. |
| Interrupted-step accounting | Cooperative interruption yields non-successful attempts/results, paused steps and `subagent.step.paused` events in both sequential and parallel runners. No fallback retry, queued launch or false completion. |

- **869 tests pass, no skips:** 134 native/extension/migration, 106 web/path,
  358 subagent unit, 260 integration and 11 watchlist tests.
- All five shell suites, configured Pi typecheck, focused strict skills check and
  `git diff --check` pass. An additional runner-wide strict check still reports
  errors outside this slice (promise/event/activity typing, agent serializer/source
  typing and the agent-core type import); it is not a clean package-wide typecheck.
- Independent read-only reviews covered the fixes; package review follow-ups were
  reproduced against the native loader, fixed and added to the parity suite.
- Installed with `pi/install.sh`. Fresh loader: **10 extensions, 48 skills, zero
  errors/collisions**; delegated projections verified across three cwd values and
  both trust states. The installed fast package passes its offline regressions.
- **13 configuration files are byte-identical**, including native Astra models,
  credentials and fast choices. All **4,517** snapshotted history/artifact files
  remain intact; one active session appended normally. No real-home migration,
  live research/enrichment/priority requests or billing checks were performed.
- Start a fresh Pi process to use the updated extension code.

## Native-priority follow-up (historical; superseded by `/fast` ownership above)

Before these fixes, the user chose to implement native Astra priority configuration.
`pi/models.json` now bootstraps a writable model override requesting priority for
`openai/gpt-6-astra`; existing model files and later user edits are preserved.
The fast extension remains installed, and `/fast off` cannot disable this native
override. Offline native-payload tests cover setting/removing it without HTTP.
This setting is independent of the fast-extension policy fixes above and does not
verify live billing.

## Earlier reopened findings — implementation verification

The earlier completion claim was too strong: independent review reproduced eight
failure groups not covered by the passing baseline. These groups now have fixes
and offline regressions against Pi **0.99.1**, including follow-up review failures.
Installed through `ai/install.sh` and `pi/install.sh`. Start a fresh `pi` process;
this retired-profile session retains its old loaded extension schemas.

| Finding | Fix and regression boundary |
|---|---|
| Parallel interruption | Per-child interrupt registry, late-registration interruption, no queued launches after pause; real detached runner with two active children and one queued task |
| Malformed fast allowlists | Reject present-but-invalid policy, preserve valid/empty lists, clear active/cached eligibility after failed refresh; real pinned extension, no provider requests |
| Lost submission IDs | Capture bounded research/enrichment IDs before full response validation; schema-failure fixtures retain IDs without polling or resubmission |
| Delegated skill parity | Native collision order, frontmatter names/description eligibility, Git-root ancestor discovery, nested collections and ignore rules; 38 native-loader parity cases plus existing trust/filter/projection tests |
| Migration preservation | Personal > work > old agent preferences and fast fallback, custom prompts, source-owned selectors and explicit legacy-provider/trust cutover; disposable homes and conflict rollback tests |
| Incomplete web results | Validate rows/counts and terminal reports; retain partial data in details, reject incomplete results through actual codemode, use fourth-argument native error rendering context |
| Status overlay | Implement cache-free `invalidate()` and call native TUI invalidation in regression |
| Local handoff document | Route selection remains first; require readable absolute `localDocument` report, recheck before navigation, carry path into summary/prompt/receipt; missing/invalid/removed document tests |

### Reopened-slice verification

- **840 tests pass, no skips:** 118 native/extension/policy, 90 web, 350 subagent
  unit, 259 integration, 8 migration, 4 path and 11 watchlist tests.
- All five shell suites, configured Pi typecheck, focused strict skill-resolver
  typecheck and `git diff --check` pass. Configured typecheck still does not cover
  the entire subagent package; no claim that its pre-existing broad errors vanished.
- Independent read-only reviews found stale fast cache, codemode failure transport,
  native renderer context and recursive/ignored skill gaps; all reproduced paths
  were fixed and covered. The installer also tests pristine/isolation-only/current
  patch stacks and refuses unknown contexts or runtime-dependency failure.
- `ignore@7.0.8` is a direct subagent dependency, not an import from Pi's private
  dependency tree. Refreshed the stale lockfile; production install has only
  `ignore` and `jiti`, with host libraries retained as wildcard peers.
- Fresh installed loader: **10 extensions, 48 skills, zero errors/collisions**.
  Verified new local-document schema and delegated Pi projections from three cwd
  values with trust both enabled and disabled. Installed fast tests also pass.
- All **4,508** snapshotted history/artifact paths remain; **4,346 JSONLs** retain
  their original byte prefixes (two active sessions appended normally). Twelve
  protected configuration files are byte-identical across review/installation.
  Native auth changed during reviewer startup, before installation; a separately
  hashed installer rerun confirmed it was unchanged by that run. No originals,
  backups or credentials were restored/overwritten to hide normal runtime changes.
- No paid research/enrichment/priority calls or real-home migration rerun. Actual
  live provider responses/billing and interactive terminal resizing were not
  exercised; response fixtures, native renderer arguments and native invalidation
  cover the relevant contracts without those external actions.

The disposition table and verification below retain the earlier baseline/history.

| Area | Final disposition |
|---|---|
| Prompt/resource isolation | Native child flags, saved/session trust and native tool allowlists; explicit empty allowlists stay empty |
| Skills | Native exclusion plus delegated resolver parity; Pi projections win over Codex symlinks, including trusted/untrusted and alternate cwd cases |
| Editor/modes | Native editor plus a small four-preset `/mode` extension and existing shortcuts; custom borders/history scanning/store retired |
| Edit/context/BTW | Native edit, footer/session diagnostics; incompatible overrides removed |
| Review/answer/UV/whimsical | Read-only native `/review` prompt/shared reviewer; other optional extensions retired |
| Fast | Pinned upstream 1.1.1 plus narrow isolation/persistence patch; explicit allowlists unchanged, failed saves cannot enable priority or prevent session disable |
| Files/todos | Retained; safe filenames/rename handling, waited diff cleanup, destructive GC opt-in only in trusted projects |
| Web | Retained direct Exa/Parallel controls and research/enrichment; native schemas, complete structured output, CSV handling, partial failures, bounded cancellation and recoverable job IDs |
| Delegation | Native host paths/peers and allowlists; model-only orchestration tools; duplicate discovery/jiti logic removed |
| Detached execution | Retained supervisor, claims, cancellation, persistence and handoff receipts: RPC alone is not equivalent |
| Other orchestration | Retained management, chains, intercom and worktrees; no evidence justified deleting their behavior |
| Lifecycle/notifications | Native settled lifecycle and recovery semantics; TUI-only notifications |
| Settings/migration | Runtime preferences preserved; retired launchers, aliases and intercepted commands removed; obsolete vendored-fast watch entry removed |

### Previous baseline verification

- **771 passing tests**, no skips: 105 native/extension/policy, 79 web, 312
  subagent unit, 257 subagent integration, 3 migration, 4 path and 11 watchlist.
- Configured Pi typecheck, all five installer/launcher/Hammerspoon shell suites,
  and `git diff --check` pass. A broader ad-hoc strict check of test imports
  encounters existing errors in `agent-serializer.ts` and `agents.ts`; those
  unrelated files were left untouched.
- Live installed loader: **10 extensions, 48 skills, no errors or collisions**;
  native edit/bash, model-only orchestration and native `/review` verified.
  Actual delegated skill resolution also verified from three cwd values with
  trust both enabled and disabled.
- Disposable Pi 0.99.1 TUI: all four presets, Ctrl+Space cycling, native mode
  selector/cancel, `/fast status` and clean exit verified with a fake API key.
  The owned smoke-test tab and temporary agent directory were removed.
- Installation preserved **8 protected configuration files byte-for-byte**,
  including priority state/allowlist and existing credentials/modes, all **4,335
  existing history files** without removal/truncation, and native preferences.
- No paid research, enrichment or priority test calls. Live provider responses,
  actual billing, OS file-preview apps and Ctrl+Shift+M terminal encoding were
  not exercised; shortcut registration and file-app arguments have automated
  coverage. Installed Parallel CLI 0.9.3 flags were checked via local help.

## Implementation history (earlier slices)

- Completed child prompt isolation: native `--no-context-files`, `--no-skills`,
  and `--name` replace the forced prompt-runtime extension and its environment
  plumbing. Explicit agent/skill instructions remain intact in append and replace
  modes. `test-native-prompts.mjs` exercises all eight inheritance/mode combinations
  through the installed CLI parser, resource loader and actual session prompt.
  Validation: 294 unit + 247 integration + 43 native/extension tests passed,
  along with the Pi typecheck and `git diff --check`. No model calls were made.
- Completed native project-trust gating for subagent discovery, management,
  skill injection/cache, UI discovery and child execution. Current-directory
  decisions use `ctx.isProjectTrusted()`; alternate directories use native saved
  decisions/global defaults, never implicit inheritance of session-only approval.
  Every child receives `--approve` or `--no-approve`, including detached runners.
  User definitions remain available when project trust is declined.
- Completed host peer cleanup while validating trust: removed private Pi/TUI and
  TypeBox runtime dependencies; all host peers use `*`. Declared `jiti` explicitly
  because detached runners previously depended on its accidental transitive
  installation. Local development modules now resolve the installed Pi 0.99.1.
- Completed settled lifecycle handling in foreground and detached execution:
  the five-second exit drain starts only on `agent_settled`, not assistant stop.
  Successful native recovery clears earlier assistant errors; unrecovered errors
  cannot become success merely because the process exits zero. Regression tests
  cover a six-second continuation, successful retry, terminal error and a child
  hanging after settlement in both execution paths.
- Notifications now run only on native `agent_settled` in TUI mode outside Herdr,
  use the last assistant on the active branch, and strip terminal control bytes.
- Previous full validation: 303 unit + 257 integration + 54 native/extension + 4
  path tests passed (618 total, no skips), plus Pi typecheck and `git diff --check`.
- Completed skill-projection isolation: reproduced all 37 collisions, then paired
  explicit registration of `~/.dotfiles/.agents/skills` with its narrowly scoped
  native exclusion. Pi 0.99.1 applies global exclusions only to global resources;
  registering this directory disabled before autodiscovery is necessary. No Codex
  files were changed. Actual Pi projection paths/content now win for all 37 skills
  from the repository root, nested `pi/` cwd and an external cwd, with no collisions.
  `test-native-skills.mjs` covers symlinked projections, provider-specific content,
  external skills, unrelated project `.agents/skills`, and local `.pi/skills`.
- Quarantined incompatible Mitsupi `/btw` by removing only its positive allowlist
  entry. Nine selected package skills, remaining extensions and intentional
  prompt-editor/files patches are preserved; installer assertions cover this.
- This slice passed 57 native/extension tests, three migration tests, Pi typecheck,
  Pi installer/launcher and AI projection shell suites, and `git diff --check`.
  Full subagent suites were not rerun because no subagent code changed. No model
  calls or live installers were run; writable installed settings still need the
  normal `pi/install.sh` refresh before a fresh Pi process uses these settings.
- Correctness slice complete.
- Retired Mitsupi's `edit` override and `/context` from the positive allowlist.
  Native `edit` now owns the one-file `edits[]` contract; footer, `/session` and
  startup diagnostics own usage/resource reporting. Loaded-skill highlighting,
  cross-file batch preflight, positional matching and Codex patch syntax are not
  retained. Source documentation and installer assertions reflect the removal.
  `test-native-edit.mjs` validates original-content matching, all-or-nothing file
  changes on invalid edits, ambiguous/overlapping rejection and serialized
  concurrent same-file edits against the installed native tool. Validation:
  64 native/extension + three migration tests, installer/launcher/AI projection
  shell suites, typecheck and diff checks passed. No live installer or model calls;
  subagent suites were not rerun because this slice changes no subagent code.
- User approved replacing the custom editor while retaining four presets and
  selection/cycling shortcuts. Completed `extensions/modes.ts`: `/mode`,
  `Ctrl+Shift+M` and `Ctrl+Space` use native model/thinking APIs and dialogs.
  The current preset is derived from actual native state, including both Astra
  depths, with no startup override, custom editor, filesystem reads, prompt
  changes, separate persistence or provider fallback. Selection errors and native
  thinking clamping are reported; overlapping/busy changes are rejected.
- Removed prompt-editor from the allowlist, both editor patches, their fixture,
  and mode-file validation/materialization. The files-shortcut patch remains.
  Custom borders, `/mode store`, project overrides and cross-session input-history
  scanning are intentionally retired. Existing mode files, inactive installed
  editor code and session histories remain untouched; installer tests verify this.
- Editor slice validation: 80 native/extension + three migration tests, Pi
  installer/launcher and AI projection shell suites, typecheck, shell syntax and
  diff checks passed. Installed Pi's real loader registered `/mode` and both
  shortcuts without errors. No model requests, live installer runs or interactive
  terminal smoke test; subagent suites were not rerun (no subagent changes).
- Subsequent review, fast/web/delegation and migration slices are complete;
  see the final disposition and verification above.

## Direction

Prefer **native configuration → small policy extensions → optional workflow
extensions**. Do not replace one large customization framework with another.
Native transport is not proof of equivalent service features. Delete a layer
only after naming its remaining behavior and testing its replacement.

Observed: 17 user/package extensions load without errors; 48 skills resolve,
with **37 name collisions in this repository**. CLI-owned built-in extensions
are additional to this SDK resource-loader inventory. Successful loading does
not prove command compatibility.

## Fix first: confirmed contract problems

| Finding | Evidence | Native-first action |
|---|---|---|
| Child context suppression is ineffective on current prompts | `packages/pi-subagents/subagent-prompt-runtime.ts` looks for `# Project Context`; native prompts use `<project_context>`. A synthetic native prompt retained its marker after `rewriteSubagentPrompt(..., {inheritProjectContext:false})`. | Use `--no-context-files`; retain `--no-skills`; use `--name` for child naming. Remove prompt-text surgery, its forced extension injection and associated environment variables after parity tests. Explicit agent instructions must remain intact. |
| Project agent discovery bypasses the native trust decision | `packages/pi-subagents/agent-scope.ts` defaults to `both`; `subagent-executor.ts` discovers definitions without consulting project trust. | Trust-gate project definitions/settings, including management/discovery and explicit alternative working directories. Native trust does not govern arbitrary extension filesystem reads. |
| Completion is inferred before Pi is settled | `packages/pi-subagents/execution.ts` and `subagent-runner.ts` start a five-second termination timer after a stopped assistant message; `extensions/notify.ts` uses `agent_end`. | Use `agent_settled`, which includes automatic retries/follow-ups. Test a continuation longer than five seconds and recovery after an error. Restrict OSC notification output to TUI mode. |
| Wrong skill projection wins | Native resource-loader reports `.agents/skills` winning over `.ai-runtime/pi/skills`. `ai/scripts/project-skills.mjs` produces different Codex/Pi command syntax. | Apply a narrowly scoped native resource exclusion for the duplicate Codex projection in Pi; verify inside and outside this repo. Do not remove Codex resources or globally discard the Pi projection. Longer term, reduce provider-specific skill text where genuinely portable. |
| Host modules are declared as runtime dependencies | `packages/pi-subagents/package.json` includes Pi core/TUI and TypeBox in `dependencies`; the child CLI emits a warning. | Wildcard `peerDependencies` for host-provided modules; separate development dependencies only where needed. |
| `/context` uses obsolete usage fields | Mitsupi `extensions/context.ts:173–205` sums `inputTokens/outputTokens`; current usage uses `input/output`. | Retire the duplicated metrics in favor of native footer and `/session`, rather than patching another accounting implementation. |
| `/btw` uses obsolete SDK contracts | Mitsupi `extensions/btw.ts` imports `codingTools`, supplies `modelRegistry` instead of `modelRuntime`, and constructs a child without parent extensions. | Disable the experiment pending a deliberate rewrite/validation; native branching is available. Static mismatch confirmed; exact interactive failure not exercised. |

## Full inventory and disposition

Paths below are relative to `pi/` unless identified otherwise. Mitsupi paths
refer to the installed, pinned package; changes belong in source settings or
explicit source-owned patches, not ad hoc installed-file edits.

| Customization | Recommendation | Behavior to preserve or explicitly retire |
|---|---|---|
| `packages/pi-openai-fast` | **Replace local fork with a reviewed pinned upstream package**, subject to the checks below. | Priority-tier toggle and persistence, not model selection. Upstream lacks our footer badge. |
| Mitsupi prompt editor + `modes.json` | **Native editor; optionally a small preset command/shortcut.** | Exact four named model/thinking presets, arbitrary border colors, `/mode store`, project mode overrides and cross-session same-directory input history are not all native. Avoid replacing the editor merely to select a preset. |
| Mitsupi `multi-edit` | **Native `edit`.** It already accepts `edits[]` for one file, matches against original content and serializes mutations per file. | Lose multi-file `multi`, Codex patch syntax, positional duplicate matching and whole-batch preflight. Native parallel calls/codemode can coordinate separate files, but do not create a cross-file transaction. Update stale tool guidance and test same-file concurrency. |
| Mitsupi `context` | **Native footer, `/session`, startup resource diagnostics.** | Loaded-skill highlighting and combined resource inventory are separate conveniences, not reasons to duplicate usage accounting. |
| Mitsupi `files` | **Keep if its macOS workflow is valuable.** | Finder reveal, Quick Look, editor/diff launch and Git/session-aware picker exceed native `@` completion. Retaining it retains the shortcut patch. Review newline handling and temporary diff-file cleanup separately. |
| Mitsupi `todos` | **Keep for persistent claims/IDs; otherwise plain Markdown.** | No native equivalent for shared file-backed claims, tags and task picker. Review retention first: default GC deletes closed tasks older than seven days measured from creation, not completion. Preserve existing `.pi/todos`. |
| Mitsupi `answer` | **Remove from the default loadout unless the questionnaire is used.** | Native input is not an equivalent extraction UI. This command adds a model request, prefers old Codex/Anthropic alternatives, and can turn extraction errors into “Cancelled.” Avoid unintended provider fallback. |
| Mitsupi `btw` | **Disable until repaired or retire in favor of branching.** | `/tree`, `/fork`, `/clone` do not provide a concurrent popover or automatic side-thread summary injection. |
| Mitsupi `review` | **Shared review skill/agent plus a native prompt template.** | Its selectors, PR checkout and review/fix loop are extra workflow, not ordinary read-only review; loop can run up to ten passes. Do not silently replace or preserve consequential checkout behavior. |
| Mitsupi `uv` bash override | **Prefer native bash with instructions; optionally native `shellCommandPrefix` for PATH shims.** | Removing the spawn hook weakens enforcement for explicit interpreter paths. Shims are convenience/policy, not a sandbox. Choose the required enforcement before deleting. |
| `intercepted-commands/` | **Candidate dead-code removal.** | Tracked references only describe it; the loaded Mitsupi UV extension points to its own package shims. Verify no private external caller before deleting. |
| Mitsupi `whimsical` | **Optional keep.** | Low-maintenance randomized working text; no need to rewrite merely because it is custom. Remove if the native indicator is preferred. |
| Nine selected Mitsupi skills | **Keep independently of extension decisions.** | Do not remove useful mail/calendar/commit/GitHub/etc. guidance by removing the whole package. Native Mermaid rendering does not replace authoring/validation guidance. |
| `packages/pi-exa` | **Pilot official native MCP; retain direct API wrapper until feature parity is established.** | Current API controls include deep search variants, domains, freshness and content modes. Official advanced MCP has many controls, but its inspected search-type enum is only `auto/fast/instant`; other MCP tools may cover deeper workflows. |
| `packages/pi-parallel` | **Choose a modern integration explicitly; no blind version bump.** | Upstream 3.0.0 replaces CLI spawning with direct REST but removes deep research and batch enrichment and narrows search controls. Native Search/Task MCP is another candidate; see below. |
| Custom tools retained with codemode | **Use native output schemas, structured results, annotations and exposure deliberately.** | `details` is UI/state data, not the structured result codemode receives. Current Exa formats requested text down to an 800-character excerpt. Do not force scripts to parse display prose when the full data already exists. Model-only exposure is appropriate for orchestration/UI tools that should not be callable through codemode. |
| `packages/pi-subagents` | **Keep bounded delegation; shrink around native lifecycle, resource loading and RPC.** | Preserve role/depth/output boundaries, cancellation, status and needed background execution. Native core has no built-in equivalent to the full supervisor. Saved chains, management UI, intercom and worktrees are explicit retention decisions. |
| Child spawning/JSON parsers | **Evaluate one adapter around native `RpcClient`.** | RPC preserves process isolation; in-process SDK does not. Neither automatically replaces detached job supervision. Avoid a wholesale rewrite before fixing lifecycle/trust defects. |
| Child tool discovery exclusions | **Test whether native allowlists make them redundant.** | Actual `--tools` allowlists already constrain registered and callable tools. Empty/path-only lists have different semantics. Existing runtime test includes exclusions; add a without-exclusions case before deletion. Never substitute mere active-tool selection for permission filtering. |
| Role models and directory helpers | **Current explicit native-provider models or intentional inheritance; native `getAgentDir()`.** | Old `gpt-5.6-*` defaults and work/Codex fixtures deserve review, not an automatic upgrade to the most expensive model. Preserve explicit custom agent-directory isolation and async namespace separation. |
| `extensions/handoff.ts` | **Native context/branch operations for ordinary handoffs; retain only chosen added workflow.** | `/compact`, `/tree`, `/fork`, `/clone` do not reproduce document-backed automatic continuation, lifecycle receipts, or external dispatch. The upstream handoff example is not a built-in command. |
| `lib/handoff-connections.ts` | **Keep if cross-session backlinks are wanted.** | Native lineage does not provide reciprocal acceptance records or verified Herdr pane navigation. Preserve historical connection paths and records. |
| `extensions/notify.ts` + Herdr | **Herdr owns managed notifications; tiny native-settled TUI fallback elsewhere.** | Keep suppression inside Herdr. Native OSC progress is not a desktop completion notification. Child-result delivery in the subagent package is also not a duplicate desktop notification. |
| Gruvbox theme | **Keep as native theme data.** | No benefit in removing a personal aesthetic preference; eliminate UI monkey-patching, not the theme. |
| `settings.json` defaults | **Keep intentional policy; remove repeated core defaults.** | Compaction values and `hideThinkingBlock:false` equal current defaults. Five retries differs from native three: decide intentionally, do not call it redundant. |
| `install.sh` and patches | **Shrink in lockstep with resource removal.** | Disabling prompt-editor alone does not remove unconditional patch preflight/application. Two editor patches can disappear if the editor goes; the files shortcut patch remains while that feature is retained. |
| Settings ownership | **Choose tracked defaults versus mutable user choices.** | Current installer resets most settings, including changes made through native `/model`/`/settings`. Bootstrap-once or preserving user-owned keys would align better with native persistence, but changes the existing declared baseline policy. Do not add a generic merge framework. |
| Launcher, old aliases and MCP names | **Keep thin launcher; finish terminology cleanup.** | `mobbin` is already unified. `pi-work`/`pi-personal` are transitional aliases, not profiles. Remove only after checking callers. Preserve API-billing guard and custom agent-directory support. Do not rename historical session records or credential keys for cosmetic consistency. |
| One-time migration | **Keep separate from normal startup; archive/retire only after cutover closes.** | Backups and active old-session histories are not cleanup targets. |

## Fast mode: what is and is not native

- Pi 0.99.1 has **no built-in `/fast` command or corresponding user setting**.
- Its OpenAI provider supports `serviceTier`/`service_tier` and tier-aware cost
  accounting. That does not create a user-facing toggle.
- Local fork reports **1.0.2**. Published upstream is **1.1.1**, and its reviewed
  source includes native `getAgentDir()` and `openai/gpt-6-astra` support.
- A native model `samplingParams` override can set request parameters, but an
  always-on model override is not the same UX as an independent `/fast` toggle.
- **Recommended:** reviewed, pinned upstream rather than maintaining hundreds
  of lines locally. Carry forward current `active`/`persistState` choices and
  verify the existing supported-model list: upstream recognizes exact legacy
  lists in a different order and may treat ours as a deliberate custom list.
- Upstream no longer has our persistent lightning footer badge. Decide whether
  `/fast status` suffices; do not retain the whole fork for a badge.
- Upstream's host peer range is `>=0.74.0`, not Pi's recommended wildcard; include
  manifest diagnostics in the trial. Newer upstream is not automatically ideal.
- Preserve the separation between **capability preset** and **priority tier**.
  Do not infer provider entitlement or add new model IDs solely from catalog
  presence. No paid priority-tier behavior test was made during this audit.

Source: [upstream fast at a27429a](https://github.com/ben-vargas/pi-packages/tree/a27429aed49cd5e1bd9beb11418b77d47f7bb196/packages/pi-openai-fast).

## Modes: native controls are not four equivalent presets

Current presets are Luna/max, Sol/medium, Astra/medium and Astra/high.
Native scoped models deduplicate by provider/model identity: two Astra thinking
levels do **not** create two separate cycling stops.

Recommended default: native editor with either:

1. Three scoped models and native `/thinking` for depth — minimum maintenance.
2. A thin four-preset command/shortcut using native model/thinking APIs — preserve
   the existing workflow without a custom editor, mode editor UI or history scan.

Do not introduce virtual-model routing merely to give four fixed presets names.

## Web services: native MCP is a candidate, not automatic parity

| Option | Benefits | Required tradeoff/check |
|---|---|---|
| Official Exa MCP | Removes local HTTP/auth/schema maintenance; native exposure and codemode. | Compare deep search, freshness, output limits and result fidelity. Enable only needed tools; use headers/OAuth, never a key-bearing URL. |
| Parallel Search MCP | Native connection/auth, two standard search/fetch tools. | Per-call schema does not expose our full mode/filter controls. Authenticated connection overrides can pin Turbo/filters; that is not dynamic per-call parity. Anonymous mode defaults to fast. |
| Parallel Task MCP | Official research/enrichment jobs, lightweight status and result tools. | Async start/status/result replaces one automatically polling call. Carry over spending guardrails and account for server-side work continuing after local cancellation. |
| Upstream pi-parallel 3.0.0 | Direct REST, cancellation and output caps; no subprocess wrapper. | Only search/fetch, fixed Turbo; research/enrichment and some dynamic filters need another deliberate owner. |
| Retained thin direct adapters | Preserve exactly the API controls needed. | Use native structured results and robust cancellation; remove elaborate rendering rather than valuable API features. |

Changing web tools also requires updating `role-boundaries.ts`, researcher
allowlists and shared search guidance. Do not enable unrestricted MCP discovery
in a read-only researcher to make a migration work.

Sources: [Exa MCP](https://github.com/exa-labs/exa-mcp-server),
[Parallel Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp),
[Parallel Task MCP](https://docs.parallel.ai/integrations/mcp/task-mcp),
[Parallel 3.0 source](https://github.com/HazAT/pi-parallel).
Vendor pages still contain old Pi adapter examples; use native Pi configuration,
not those client-specific snippets.

## Upstream disposition

| Package | Local | Observed upstream | Decision |
|---|---|---|---|
| Pi | 0.99.1 | Installed release is the audit contract | Prefer its shipped docs/source over stale examples. |
| Fast | 1.0.2 + local changes | npm 1.1.1 | Worth adopting after configuration/UI contract checks. |
| Mitsupi | pinned 1.6.0 + 3 patches | npm latest 1.6.0 | A package update alone does not solve the reviewed mismatches. Reduce the allowlist. |
| Parallel | 2.0.0-dotfiles.1 | upstream main 3.0.0 | Review as a feature-changing replacement, not a routine update. |
| Subagents | 0.20.1 + substantial local changes | npm 0.73.1 | Selective adoption, not a blind rebase. Upstream adds large workflow/fleet/adapter surfaces we may not want. |

Recent subagent upstream has useful lifecycle, dynamic tool and host-dependency
fixes. Some pruning controls appear only under **Unreleased**; do not assume
published 0.73.1 includes them. Preserve our verified role restrictions when
borrowing individual improvements.

## Implementation slices and acceptance gates

1. **Correctness and native contracts:** child context flags, project trust,
   settled lifecycle, host peers, skill collisions; quarantine incompatible BTW.
   Test actual native prompts, untrusted project overrides, delayed continuations,
   successful retry after error, and no OSC pollution of JSON/RPC output.
2. **Delete duplicate UI/tools:** native edit and context reporting; native editor
   with the chosen preset UX; shared review workflow. Remove associated patches,
   fixtures and installer branches only when their feature leaves.
3. **Stop maintaining the fast fork:** pin reviewed upstream; test config migration,
   unsupported-model behavior, payload toggle and UI choice without an expensive
   live priority request. Keep one configuration owner.
4. **Choose web integration on feature parity:** schema/connectivity checks first;
   only then a bounded authorized service smoke test. Preserve research/enrichment
   and researcher tool restrictions, or explicitly retire them.
5. **Reduce delegation/handoff product surface:** retain the used bounded async
   workflow; remove unused management/chain/intercom surfaces only by decision.
   Replace duplicate protocol plumbing with RPC incrementally, not a new framework.
6. **Close the migration:** remove dead wrappers, stale profile wording and repeated
   defaults; preserve explicit alternate-agent-dir tests and original histories.

Decisions before feature removal: exact four-preset cycling and input history;
macOS file actions; persistent task claims/retention; automatic handoff continuation;
unused delegation features; dynamic web API controls versus official MCP schemas.

## Validation and limits

- Inspected source settings, installed allowlisted extensions, vendored packages,
  installers/patches, shipped native docs/source and selected official upstreams.
- Ran native resource loading: zero extension load errors, 37 skill collisions.
- Ran a synthetic native-prompt probe: context exclusion fails in the old rewriter.
- Two read-only audit scouts completed using the native OpenAI provider after an
  initial attempt inherited this old session's retired Codex provider.
- Did not install upstream packages, remove extensions, change runtime settings,
  invoke interactive experimental commands, or perform priority-tier/paid research
  jobs for validation. Proposed replacements still require their acceptance tests.
