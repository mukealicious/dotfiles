- Repo purpose: Personal macOS development environment dotfiles, organized by Holman-style top-level topics for shell, terminal, runtimes, packages, AI tooling, window management, and CLI tools.
- Key entrypoint: `script/bootstrap` for initial setup; `bin/dot` / `dot` for daily updates, installs, symlinks, macOS defaults, and `dot doctor` diagnostics.
- Safe next subagent test: Ask a read-only scout to inspect only top-level `README.md` and `AGENTS.md` and report where a new Fish alias should be added.

## Current: upstream authoring skill replaces local alternatives — 2026-10-12

**Complete: implemented, installed, and validated.** Replaced `build-skill` and
`agent-context` with Dillon's manual `writing-for-agents` from
`dmmulroy/.dotfiles@bdf5e0611d62436eeb5dc58555c1396ced2dddeb`. All three upstream
files are byte-for-byte unchanged, including the manual flag, mechanics reference,
and OpenAI metadata. Added only provenance and the verified original Matt Pocock
MIT notice from `mattpocock/skills@49dd158d1076134a641b33efb035946536778336`.
The installed shared inventory is now **33 skills** (34 minus two plus one).

Removed both old skill directories completely, including their scripts, templates,
and reference prose. No executable callers of their scripts remained outside the
retired skill; documentation-only validator commands now use existing native
skill tests. Updated active inventories, the dotfiles-dev pointer, and affected
specs. No replacement wrapper, new AGENTS files, or installer changes were added.
Broader README cleanup and the previously identified opensrc drift remain outside
this replacement.

Validation receipts:

- `mise exec -- sh ai/test-install.sh`: passed; seeds both retired skills across
  four projections and installed aliases, verifies cleanup and unchanged upstream
  resources, and retains repeat-install/user-ownership/collision/failure coverage.
- `mise exec -- node --test pi/test-native-review.mjs pi/test-native-skills.mjs`:
  all 6 passed, including exact upstream Git-blob checks and manual invocation.
- `mise exec -- bun test ai/watch.test.ts`: all 11 passed.
- `bin/ai-watch --source writing-for-agents`: passed as an unlinked pattern scan.
  The existing watcher reads skill metadata, not skill provenance sidecars;
  preserving SKILL.md unchanged intentionally means no automatic local pinned
  comparison. The pin and original-source verification are in `VENDORED_FROM.md`.
- `sh ai/install.sh` twice: passed. Fresh installed native discovery found 33
  shared skills with no diagnostics; the new skill is manual, both old skills and
  their managed aliases are absent, and all five files match across four providers.
- Shell syntax, whitespace, and relative-link checks passed. Unrelated
  `claude/settings.json` and `mise.lock` hashes still match pre-work values.

No behavioral improvement or fresh independent review is claimed. No upstream
installer, dependency changes, commits, or pushes. Task-created source snapshots
were removed after verification. Next: reload or start a fresh session and
explicitly invoke `writing-for-agents` on a real document before considering any
local adaptations.

## Previous checkpoint: published engineering skills adopted — 2026-10-12

**Complete: implemented, installed, and validated.** The user approved the relevant skills from `dmmulroy/skills` in addition to the completed cleanup. This supersedes the dotfiles-only exclusion decision recorded below, not the retirement of the old local Mu/Rat workflows. The [updated spec](specs/engineering-skills-consolidation.md) owns the current disposition and exact pins.

### What is installed now

- Added `coding-standards`, `cloudflare-composition-root`, `effect-service-design`, and manual `tech-spec` from `dmmulroy/skills@8603380821fee6a77c82639f364ce8fe4f5a92be`, the reviewed current main of that published collection.
- Retained current-dotfiles `diagnosing-bugs` and `write-discoverable-code`, plus independent Joel Hooks `uncomplect`. Seven engineering skills; 34 shared skills overall, up from the prior checkpoint's 30.
- Kept existing Bro (its body/invocation behavior matches the published version) and newer locally adapted Herdr. No downgrade or duplicate copies.
- Skipped optional `prelude`: it bootstraps a TypeScript helper module, but none of the four imports depends on it. Skipped the upstream bulk-copy installer, package files, and dependencies; `ai/install.sh` still owns installation.
- All eight retired local skills remain gone. The published coding standards are a clean import, not the abandoned October 23-reference snapshot or a mixture of the two.
- Preserved whole upstream directories, including Cloudflare examples and Effect audit/OpenAI metadata. Copied the root MIT notice into each import without changing its attribution. Added source pins, provenance, inventories, and four narrow watch entries.
- Made one declared body repair: tech-spec's missing sibling TDD dependency now links to the Testing section of coding standards. Its RGR planning steps, required outline, grill-first branch, and design-only/manual behavior are unchanged. No global TDD skill was restored.
- Removed the local worked spec example and its shared-instruction pointer at the user's request. Upstream `tech-spec` is now the sole spec-writing workflow; project defaults, actual project specs, and this progress log remain. No replacement wrapper or automatic router was added.

### Spec-guidance cleanup follow-up — 2026-10-12

Deleted `ai/references/implementation-spec.md`, removed its pointer from shared instructions, and updated the live inventory, provenance sidecars, consolidation spec, and regression tests. Historical checkpoints below describe previous states; they do not authorize recreating the example.

Validation: isolated installer tests passed (including repeat install and assertions that all six assembled instruction outputs omit the retired pointer while retaining project defaults); all five native discovery/review tests passed; shell syntax and `git diff --check` passed. Ran `sh ai/install.sh` and verified actual installed instructions plus unchanged tech-spec content and updated provenance across all four provider projections. Settings and lockfile hashes still match the pre-work values.

No upstream watch checks or model-behavior trials were rerun: this follow-up changes local guidance/docs and their tests, not upstream skill bodies, pins, or watch configuration. No commits or pushes.

### Validation receipts for this adoption

| Check | Result |
|---|---|
| Four skill validators | Passed; retained upstream warnings for coding-standards length and tech-spec's short description without an activation phrase |
| Exact source comparison | All seven upstream files match after removing declared metadata and reversing the single sentence repair; four MIT notices match the root license exactly |
| Reference checks | Three relative Markdown targets plus Cloudflare's plain-text sibling target resolve; the referenced Testing section exists |
| `mise exec -- sh ai/test-install.sh` | Passed twice during this slice; covers all seven skills/resources across four providers, eight retirements, removal of seeded abandoned coding references, installed links, and existing ownership/collision/staging/idempotence cases |
| `mise exec -- node --test pi/test-native-review.mjs pi/test-native-skills.mjs` | 5 passed; correct discovery and manual/model invocation metadata, required resources, and native read-only review |
| `mise exec -- bun test ai/watch.test.ts` | 11 passed |
| Four `bin/ai-watch --source <id>` checks | All passed, each matching its new local artifact with no relevant changes since the pin |
| `sh ai/install.sh` twice | Passed; second run retained correct links |
| Installed-resource and fresh native loader audit | Exact resources for all seven skills across all four providers; 34 shared skills, no loader diagnostics; tech-spec manual and the other six engineering skills model-invocable |
| Shell syntax and `git diff --check` | Passed |
| Unrelated edits | `claude/settings.json` and `mise.lock` match the pre-work hashes byte-for-byte |

Two validation-probe issues were corrected without changing installer behavior: the lightweight link validator treated a `#testing` fragment as part of a filename, so the locally authored pointer now names the Testing section and links to the file; an installed-loader probe used CommonJS resolution against an ESM-only export, so it was rerun using an ESM import from `pi/`.

**Not claimed:** Model-quality improvement, execution of upstream application examples, a new independent subagent review, or reproduction of upstream benchmarks. The prior independent review covers the earlier cleanup only. No external installer, debugging HITL loop, dependency installation, commit, or push was run.

**Next:** Start a fresh agent session and trial a TypeScript feature, an Effect service, a Cloudflare boundary, an explicitly invoked tech-spec, a bug, and an architectural change as relevant. Record concrete misses before customizing upstream. Do not repeat either superseded migration or reintroduce the old local playbooks. Task-created source snapshots were removed after validation.

## Historical: latest-first consolidation — 2026-10-12

This completed phase remains evidence for the cleanup; its exclusion of the published collection is superseded by the current decision above.

**User decision:** The newest reviewed Mulroy dotfiles takes precedence over the old four-skill plan. The recommendation to keep deleted upstream skills below is superseded. Remove the imported coding standards; do not import Cloudflare composition-root or the older tech-spec workflow.

**Complete: implemented, installed, and independently reviewed.** The revised [spec](specs/engineering-skills-consolidation.md) owns scope. Current Mulroy imports are `diagnosing-bugs` and `write-discoverable-code` at `bdf5e0611d62436eeb5dc58555c1396ced2dddeb`; independent Uncomplect is refreshed to Joel's current `022f29cbfa2ddd36916622d49c02b763060f6847`. The eight approved legacy skills and abandoned coding-standards import are removed, not relocated. Shared skill count is 30, down from 36 in Git HEAD (37 after the abandoned first import).

The source investigation identified `write-discoverable-code` as narrow, currently active engineering guidance—not a claimed formal replacement for coding standards. Its entire one-file skill was adopted without policy adaptations. Original Modem and Matt Pocock files were independently verified byte-identical to Mulroy's copies, and their full MIT notices retained. Uncomplect's no-license caveat remains; its upstream benchmark was not rerun. Local changes there are provenance metadata and removal of one extra trailing blank line in the source map.

Preserved only the local [implementation-spec example](ai/references/implementation-spec.md) and short [project defaults](ai/references/project-defaults.md), with conditional pointers in shared instructions. Native `/review` and the independent review agent remain; active inventories, the Hunk pointer, and affected watch entries are updated. No new framework/router/mode, dependencies, or installer owner.

### Current validation receipts

| Check | Result |
|---|---|
| Isolated `mise exec -- sh ai/test-install.sh` | Passed: nine seeded retired skills across all four old projections and installed aliases are removed; custom directories and live/broken unrelated links survive; repeat install, staging-failure, collision, and existing resource tests retained |
| Cleanup regression | First failed `unrelated broken link removed`; narrowed only skill-link cleanup to dotfiles-managed source/projection targets, then the same test passed |
| `mise exec -- node --test pi/test-native-review.mjs pi/test-native-skills.mjs` | 5 passed, including fresh discovery of actual newly projected sources and explicit/default read-only review expansion |
| `mise exec -- bun test ai/watch.test.ts` | 11 passed |
| Skill validators / shell syntax | All three skill validators passed; discoverable-code gets two shell-validator warnings because it reads YAML `description: |` as one character. The native YAML loader correctly parses its full description. Installer/test/template shell syntax passed; HITL template was not executed |
| Upstream fidelity | Nine upstream files checked; exact except local watch metadata and the documented single trailing blank-line removal. Relative Markdown target files resolve |
| Narrow upstream watches | All three succeeded, each matched its local skill, and each reported no relevant changes since its pin |
| `sh ai/install.sh` twice | Passed; retired managed links removed, second install retained correct links |
| Installed projection audit | All retained resources match source across four providers; retired files and links absent; standalone reference pointers resolve in installed instructions |
| Fresh native loader over installed Pi projection | 30 shared skills, no diagnostics, all three engineering skills available, no retired skills |
| `git diff --check` | Passed |
| Independent implementation review | No issues/P1/P2 findings; reviewer run `b0290ba1-ff6f-498d-bd69-1a57d57921a9`. Reviewer inspected source/coverage; parent separately verified real installation |
| Installed `/review` | Managed symlink points to the updated prompt and contents match |

A one-off installed-loader probe initially used CommonJS resolution against an ESM-only export; it was corrected to an ESM import and rerun successfully. No repository runtime code was changed for that probe.

**Still unverified:** Real-task model behavior and upstream evaluation claims. No paid model invocation, deployment, or external debugging loop was run. The current conversation may still advertise cached old skills; fresh native discovery was tested separately.

**Next:** Start a fresh agent session and trial the smaller set on a feature, a bug, and an architecture change. Record concrete misses before adding policy; do not resume the superseded imports or invent another mode. All revised spec acceptance checks are complete. Task-created temporary upstream snapshots were removed; research/review receipts remain in the session's managed artifacts. `claude/settings.json` and `mise.lock` still match their pre-work hashes; no commits or pushes.

## Historical: first slice and source investigation — 2026-10-12

The following records what happened before the user's latest-first correction. It is not the current implementation plan.

### Original checkpoint

**Current state:** The first slice is implemented and installed. The larger consolidation is not complete. No skills have been retired and no commits have been made.

**Contract:** [Engineering skills consolidation spec](specs/engineering-skills-consolidation.md). It owns the approved four-skill target, eight retirements, source pins, and acceptance criteria; this log owns execution status.

### Completed this session

- Imported Mulroy's `coding-standards` at `4a783032e8f1254759ed9e97b65f6108478f0cb6`: the complete skill and all 23 upstream references.
- Added the requested local [implementation-spec reference](ai/skills/coding-standards/references/implementation-spec.md), with one fictional archive-bookmark example, observable acceptance checks, a first slice, and progress/pickup guidance.
- Added one conditional pointer in `SKILL.md`; preserved upstream's manual invocation setting. No new spec skill, mode, or orchestration framework.
- Recorded the pin and local additions in [provenance](ai/skills/coding-standards/VENDORED_FROM.md), added the watch entry, and updated the live AI inventory.
- Added installer regression assertions for the skill, local reference, upstream reference, provenance, and invocation metadata across all four provider projections.
- Ran the owning installer twice. Pi, Codex, Claude Code, and OpenCode projections contain all 26 files; installed managed links resolve correctly.

### Validation receipts

| Check | Result |
|---|---|
| `bash ai/skills/build-skill/scripts/validate_skill.sh ai/skills/coding-standards` | Passed |
| Pinned-source comparison | All 23 upstream references byte-identical; `SKILL.md` differs only by declared provenance metadata and spec-reference pointer |
| Recursive Markdown target audit | All 82 relative link targets resolve; this checks target files, not every heading anchor |
| `mise exec -- sh ai/test-install.sh` | Passed, including existing cutover/collision/idempotence coverage and new reference-copy assertions |
| `sh ai/install.sh` twice | Passed; repeat run retained correct links |
| Source-versus-projection comparison | All 26 files match for each of four providers |
| `git diff --check`, `sh -n ai/test-install.sh` | Passed |
| `bin/ai-watch --source coding-standards` | Failed with HTTP 404: upstream removed the watched path from `main`; see below |

Not verified: fresh-session explicit skill invocation, behavioral quality on a real feature, or any later consolidation acceptance criteria. Reload/restart the agent to refresh its skill discovery before trying the new manual skill. Native review tests were not run because the prompt and its test were not changed in this slice.

Pre-existing edits to `claude/settings.json` and `mise.lock` were preserved byte-for-byte (hash comparison before and after installation).

### New upstream fact — investigate before the remaining cutover

Mulroy removed `coding-standards` from `main` on 2026-10-12 in [commit 6f3b347](https://github.com/dmmulroy/.dotfiles/commit/6f3b3470b1af6e49f381682f701bc675ef3bee46). The current skill listing also lacks `cloudflare-composition-root`. The commit message is only “updates”; no reason or replacement has been established. The approved pinned snapshot remains retrievable and is what was imported.

The watch entry deliberately retains the original live path and documents its failure. Do not silently pin the watch to an old revision to make it green, infer that the practices were abandoned, or auto-adopt a different source.

### Next actions, in order

1. Source-continuity investigation completed; see the follow-up below. No newer public successor or documented move was established. Recommendation: retain the approved snapshots rather than switch to the older `dmmulroy/skills` collection. No source switch was made.
2. Import the pinned `diagnosing-bugs` and `cloudflare-composition-root` snapshots, and refresh Joel's standalone `uncomplect` per the spec unless an explicitly reviewed source change supersedes those pins.
3. Preserve the small React/StyleX/tooling preference reference; retire the eight approved old skills, including `grill-with-docs`; update all live consumers and the read-only review prompt/test.
4. Update remaining inventories/watch entries and replace obsolete Mu Mode test expectations with retirement coverage. Run the full spec's checks, refresh projections, and verify fresh-session discovery.
5. Trial the resulting set on actual feature, debugging, and redesign work before further customization.

**Pickup instruction:** Read this checkpoint, the investigation follow-up below, and the linked spec; check current worktree changes. The next implementation step remains the pinned imports and Uncomplect refresh if proceeding with the approved plan. The requested spec example and public-source investigation are done; do not recreate them or mistake this checkpoint for a completed migration.

### Source-continuity investigation — follow-up 2026-10-12

**Finding:** Both skills were removed from the tracked dotfiles collection; this was not a demonstrated move to a new public home. Older copies remain publicly available. The reason for removal and any private replacement remain unknown.

| Evidence | Finding |
|---|---|
| [Deletion commit `6f3b347`](https://github.com/dmmulroy/.dotfiles/commit/6f3b3470b1af6e49f381682f701bc675ef3bee46) | Its parent is our approved `4a78303` pin. Deletes both complete skill directories, as well as `prototype` and `research`; does not add replacement standards/composition skills or register a new source. Message is only “updates”; no linked PR or commit comments explained the decision at review time. |
| [Current dotfiles tree `bdf5e06`](https://github.com/dmmulroy/.dotfiles/tree/bdf5e0611d62436eeb5dc58555c1396ced2dddeb/home/.agents/skills) | Neither skill is restored or renamed in the subsequent commit. Inspected tracked instructions do not redirect to a successor. Private/runtime configuration is not fully tracked, so this cannot establish what he currently loads locally. |
| [Separate skills collection `8603380`](https://github.com/dmmulroy/skills/tree/8603380821fee6a77c82639f364ce8fe4f5a92be) | Still contains both names, but `main` was last committed/pushed July 23; the two relevant skill paths last changed July 14. This predates the October dotfiles snapshot. Its installer copies skills into dotfiles, showing an older source relationship—not evidence of an October relocation. |
| [Older coding standards](https://github.com/dmmulroy/skills/blob/8603380821fee6a77c82639f364ce8fe4f5a92be/coding-standards/SKILL.md) | A single roughly 33 KB document without the 23 separate reference files or `disable-model-invocation: true`. It is not the same corpus as the approved snapshot; changing sources would change behavior and structure. |
| [Older Cloudflare skill](https://github.com/dmmulroy/skills/blob/8603380821fee6a77c82639f364ce8fe4f5a92be/cloudflare-composition-root/SKILL.md) | Direct diff against our approved pin shows exactly one addition in dotfiles: `disable-model-invocation: true`. The bodies match. `EXAMPLES.md` has the same Git blob SHA (`c70dd17c3ca02a3b3183ea810be63564ac3d7383`) in both repositories. |

Additional discovery checked the public repository list, both branches of `dmmulroy/skills`, indexed GitHub code matches for both skill names, and candidate `anti-slop` / `cloudflare-skill` trees. No verified newer replacement was found. Search absence is not proof of global absence; no author rationale or private setup was inferred. No external installers or scripts were executed.

**Correction to the earlier planning search:** The older collection contains a [manual `tech-spec` skill](https://github.com/dmmulroy/skills/blob/8603380821fee6a77c82639f364ce8fe4f5a92be/tech-spec/SKILL.md). It explicitly has “Convert context to spec” and “Grill first” paths, typed call-stack handoffs, a required outline, and an RGR TDD plan. It is not in the inspected October dotfiles skill set. Its instruction to use a sibling TDD workflow points to a skill absent from that collection's current main tree. Our earlier conclusion applies to the October corpus, not all Mulroy-authored skills. This finding does not automatically authorize replacing the new lightweight local example or restoring retired workflows.

**Recommendations, not adoption:**

- **Worth adapting / retain:** Continue with the already reviewed October snapshots as intentionally retained guidance, not a claim to mirror Mulroy's current active configuration. Keep the four-skill plan and local example unless the user chooses otherwise; no new skill/router is needed.
- **Skip:** Retargeting `coding-standards` to the older collection merely to make the watch green, or importing its entire older workflow stack.
- **Interesting, not now:** The older `tech-spec` as a possible later comparison reference, not another installed authority.
- **Risk notes:** Removal leaves maintenance continuity unverified. The older collection has an MIT notice attributed to Matt Pocock; do not infer that it licenses every newer dotfiles-only reference. Existing provenance caveats remain unchanged.

Only this progress checkpoint was updated during the investigation. Installed skills, source pins, watch entries, the consolidation spec, and unrelated edits were left untouched. No tests/installers were run because no executable behavior changed; `git diff --check` passed.
