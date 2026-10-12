# Engineering Skills Consolidation

**Status:** Published-collection adoption implemented, installed, and validated; real-task trials remain
**Updated:** 2026-10-12
**Execution checkpoint:** [progress.md](../progress.md)

## Current decision and outcome

Use Mulroy's published engineering skills as well as the selected current dotfiles skills, while keeping Joel Hooks's Uncomplect independent. The user explicitly approved this broader source selection after the dotfiles-only consolidation. Do not resurrect the retired local Mu/Rat workflows, invent another router, or blend different upstream revisions into an untraceable corpus.

The reviewed `dmmulroy/skills` main is a July 23 snapshot. It predates the October dotfiles deletions; adopting it is an explicit user choice, not proof that the deleted skills moved there. Source recency alone does not establish the author's private setup or reasons for removal. Keep separately reviewed pins and provenance for each source.

## Disposition

| Action | Artifact | Ownership |
|---|---|---|
| Add from published collection | `coding-standards` | Correct-by-construction TypeScript standards |
| Add from published collection | `cloudflare-composition-root` | Cloudflare runtime boundaries and application-owned services |
| Add from published collection | `effect-service-design` | Effect service contracts, construction, Layers, and audits |
| Add from published collection | `tech-spec` | Manual, design-only typed architecture handoff; includes a grill-first branch |
| Retain from current dotfiles | `write-discoverable-code`, `diagnosing-bugs` | Searchable-code guidance and debugging feedback loop |
| Retain independently | `uncomplect` | Joel Hooks's architectural simplification skill |
| Keep retired | `mu-mode`, `mu-stack`, `rat-stack`, `tdd`, `domain-modeling`, `codebase-design`, `code-review`, `grill-with-docs` | Eight previously approved retirements remain in force |
| Do not restore | Abandoned October coding-standards reference tree | Import the published collection cleanly, not as an overlay of the earlier 23-reference snapshot |
| Keep existing versions | `bro`, `herdr` | Existing Bro matches published behavior; retain newer locally adapted Herdr rather than downgrade it |
| Skip | Upstream `scripts/install-skills.sh`, package manifests, `prelude` | Existing installer owns projections; optional prelude bootstrapping is not required by the four adopted skills |
| Remove | `ai/references/implementation-spec.md` and its shared-instruction pointer | Consolidate spec-writing guidance around upstream `tech-spec` |
| Preserve as ordinary docs | `ai/references/project-defaults.md` | Concrete project preferences, not an extra skill |
| Preserve | Native `/review` and shared review agent | Read-only review, without a retired code-review skill dependency |

Unrelated skills remain outside this pass. This is not a full mirror of either upstream repository. There is no mandatory combined execution sequence.

## Reviewed source pins

| Artifact | Source subtree | Commit |
|---|---|---|
| `coding-standards` | `dmmulroy/skills:coding-standards/` | `8603380821fee6a77c82639f364ce8fe4f5a92be` |
| `cloudflare-composition-root` | `dmmulroy/skills:cloudflare-composition-root/` | `8603380821fee6a77c82639f364ce8fe4f5a92be` |
| `effect-service-design` | `dmmulroy/skills:effect-service-design/` | `8603380821fee6a77c82639f364ce8fe4f5a92be` |
| `tech-spec` | `dmmulroy/skills:tech-spec/` | `8603380821fee6a77c82639f364ce8fe4f5a92be` |
| `write-discoverable-code` | `dmmulroy/.dotfiles:home/.agents/skills/write-discoverable-code/` | `bdf5e0611d62436eeb5dc58555c1396ced2dddeb` |
| `diagnosing-bugs` | `dmmulroy/.dotfiles:home/.agents/skills/diagnosing-bugs/` | `bdf5e0611d62436eeb5dc58555c1396ced2dddeb` |
| `uncomplect` | `joelhooks/skills:skills/uncomplect/` | `022f29cbfa2ddd36916622d49c02b763060f6847` |

## Fidelity and narrow compatibility repair

Import complete directories. Preserve Cloudflare's `EXAMPLES.md`, Effect service design's audit reference and OpenAI metadata, and all invocation metadata. The three implementation skills allow model invocation upstream; `tech-spec` retains `disable-model-invocation: true`. Do not copy the October snapshot's manual flags into the July skills.

Add local `VENDORED_FROM.md` and `metadata.watch-sources`. Copy the published repository's root MIT license unchanged into each imported directory, retaining its Matt Pocock copyright notice rather than inventing attribution. Preserve existing original-source MIT notices for debugging/discoverability and Uncomplect's unresolved licensing caveat.

One body adaptation is necessary: `tech-spec` says to use a sibling TDD workflow, but the published repository no longer contains that sibling. Replace only that dependency sentence with a link to `../coding-standards/SKILL.md`; keep the explicit RGR planning steps, outline, grill-first path, and design-only behavior unchanged. This does not reintroduce a global TDD skill or authorize implementation merely by invoking the spec skill.

Do not split the large upstream coding-standards document or rewrite examples merely to satisfy local brevity preferences. Resource presence and discovery are not evidence that upstream example code has been executed or model quality verified.

## Local references

Remove the local worked implementation-spec example and its shared-instruction pointer. `tech-spec` is the sole spec-writing workflow; preserve its manual invocation behavior rather than adding an automatic router. Existing project specs and `progress.md` are records, not competing guidance, and remain intact. Keep only the project-defaults reference and its scoped pointer.

Project defaults retain React/StyleX, TypeScript, mise/pnpm, Vite+/Oxc, Portless, and Effect/Alchemy/Cloudflare as a compatible new-project direction. Existing repositories keep their declared tooling. No permission to migrate or deploy follows from a skill or preference.

## Integration and acceptance

Reuse `ai/install.sh` and `ai/scripts/project-skills.mjs`. The previously validated ownership-aware cleanup remains; no new installer architecture is required. Update inventories, provenance, watch entries, installer tests, and native discovery expectations.

- [x] Four complete published skills match their pin except declared metadata, license/provenance additions, and the single tech-spec dependency repair.
- [x] All seven engineering skills are present in all four provider projections with correct invocation metadata and resources.
- [x] Eight retired source directories and their managed links remain absent; tests still protect unrelated user-owned files and live/broken links.
- [x] Tests seed the abandoned coding-standards reference tree and prove it is removed rather than blended into the new import.
- [x] Prelude and the upstream bulk installer are not imported or run; Bro and Herdr remain unchanged.
- [x] Relative targets and heading fragments resolve, including Cloudflare/tech-spec links to coding standards and Effect's audit reference.
- [x] Native fresh discovery sees the adopted skills; tech-spec is manual. No paid invocation or model-quality claim is implied.
- [x] Repeated installation is idempotent; staging-failure, collision, review, and existing resource coverage remain intact.
- [x] Four narrow watch entries point at the adopted published subtrees and pass or have documented limitations.
- [x] Inventories, this spec, and progress distinguish the current decision from superseded plans and preserve unrelated work.
- [x] Local spec example and its source/installed instruction pointers are absent; project defaults and upstream tech-spec remain available.

Validation commands:

```sh
mise exec -- sh ai/test-install.sh
mise exec -- node --test pi/test-native-review.mjs pi/test-native-skills.mjs
mise exec -- bun test ai/watch.test.ts
git diff --check
# After isolated validation:
sh ai/install.sh
```

Supplement with exact upstream comparison, recursive resource/anchor checks, installed-link checks, a repeat install, and `bin/ai-watch --source <id>` for the four imports. The later authoring consolidation retired build-skill and its validator; use the native discovery and resource tests above rather than restoring that script. Historical validation receipts remain in progress.md.

## Execution boundaries and next use

Preserve the completed cleanup and unrelated changes, especially `claude/settings.json` and `mise.lock`. No commits, pushes, deployments, dependency upgrades, broad cleanup, or agent-framework changes. Do not execute upstream installers, application examples, or the debugging HITL harness merely to validate presence. Remove task-created scratch snapshots when finished.

The earlier independent review covers the prior cleanup, not this new adoption. Record fresh validation separately. After installation, start a fresh session and trial the selected set on a feature, a bug, a design-only spec, and an architectural change. Add local policy only in response to concrete failures.
