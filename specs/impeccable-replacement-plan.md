# Impeccable replacement plan

Status: candidate implementation and subsequent manual trial installation approved. The Owner selected `mu-design-eng` and approved commit, fast-forward, and `ai/install.sh`, without push. Automatic cutover and legacy retirement remain gated. Prepared on 2026-11-05.

## Architecture decision after Owner review

The Owner clarified that pstack contributes its primitives-and-playbooks architecture, not merely prototype and evaluation methods. The Owner approved one entry point after discussing preservation of Emil's specialist depth.

The implementation candidate is `ai/skills/mu-design-eng/`: one manual entry point, plain playbooks, and reusable references. It is not an installation of 8 separate skills. The manual flag prevents a second automatic design owner during evaluation. Promotion to the primary owner and legacy removal require the acceptance gates below.

Preserve specialist workflows, concrete examples, diagnostics, and completion criteria. Distillation removes repeated guidance and harness assumptions, not expert depth. The source map lives in `ai/skills/mu-design-eng/VENDORED_FROM.md`. Candidate validation lives in `ai/test-design-skill.mjs` and `specs/design-skill-acceptance.md`.

## Decision and authority

Use the best complementary methods from **Impeccable, Emil, and pstack**. Retire the privileged live helper only after Owner approval and migration acceptance. Keep ordinary project tools and the existing harness. Add no orchestration layer.

The Owner first authorized repository-only candidate implementation, then explicitly approved commit, fast-forward, and trial installation under `mu-design-eng`. Dependency changes, service probes, and pushes remain excluded.

The repository baseline is `0cb399a46a338c303212662afa9b1f6c56b599b3`. The worktree was clean before this planning work.

### Reconcile the source session

Pocket session `68484` contains these distinct decisions and recommendations:

| Entry | Speaker | Meaning for this plan |
|---|---|---|
| `68971` | Assistant | Recommended selective security backports as the smallest immediate repair. This was not Owner approval. |
| `69038` | Owner | Asked why not use latest upstream. This was a question, not migration approval. |
| `69099` | Owner | Asked whether Emil could replace Impeccable and requested research. |
| `69961` | Owner | Invoked simplification and authoring guidance, then asked to borrow pstack ideas. |
| `70192` | Assistant | Proposed Emil guidance, retained critique vocabulary, and pstack prototype/evaluation methods. Rejected another operating layer. |
| This planning session | Delegated Owner instruction | Requires a plan and 1 independent reviewer. The later clarification explicitly names all 3 sources. |

The earlier backport recommendation is therefore an alternative, not the approved implementation scope. The latest assistant recommendation is also not approval to remove capabilities.

If the Owner requires the old live workflow, stop this retirement plan. Prepare a separately approved repair scope with isolated security tests. Do not silently retain vulnerable helpers or import latest upstream.

## Evidence and provenance

Read the [evidence register](impeccable-replacement-evidence.md) for exact revisions, report locations, hashes, and qualifications.

The source session records the full investigation and later reports. The later reports are entries `69334` (design coverage), `69648` (Emil safety/fit), and `70170` (pstack simplification). They are separate from the earlier cache report. Do not attribute their conclusions to `REVIEW.md`.

The Impeccable archive hashes matched the recorded values. All 1,196 pinned files and 4,467 current files matched their verified archive contents. All 33 Emil snapshot files matched its cached archive. These checks establish local consistency, not a new upstream attestation.

### Security facts and limits

The source supports unsafe identifier shell construction, public token delivery, incomplete source confinement, filename shell interpolation, and null-body exception paths. It also supports automatic CSP changes and literal-path exclusion bypasses.

The audit retains `needs_validation`. An active helper and poller, browser local-network policy, readable files, and deployment exposure remain material conditions. No exploit, compromise, production exposure, or availability failure was established. Unbounded body accumulation remains a hardening lead.

Removing the helper can remove these paths from managed discovery. It does not stop an existing process, remove project residue, or make generated code safe. Ordinary browser, shell, and file tools retain their existing authority.

## Contribution and deletion map

| Source | Retain | Adapt | Reject or exclude |
|---|---|---|---|
| **Impeccable** | Local critique lenses: named concept, evidence, user impact, concrete correction. Preserve proportional context and project authority. | Keep brand/product, typography, color, information architecture, copy, onboarding, and UI-state material only where acceptance exposes a gap. Correct inaccurate accessibility claims. | Privileged live server, browser bridge, poller, source wrappers, automatic CSP mutation, command aliases, context-renaming loader, and broad command router. Remove universal taste bans and contradictory motion rules. |
| **Emil** | Code-first interaction craft, feedback, motion purpose, interruption, mobile details, difficult-content testing, and working variants. | Pin a curated snapshot. Correct picker fallback/modifier behavior. Use safe rendering, development-only surfaces, and explicit integration approval. Resolve rigid timing, fade, stagger, keyboard, and performance rules through context and browser evidence. | Blanket installation, floating `@latest`, automatic library changes, global Apple styling, automatic LAN exposure, and automatic implementation delegation. Defer Swift, Expo, and unrelated skills. |
| **pstack** | One entry point, condition-based playbook selection, and reusable reference knowledge. Existing `technical-writing` keeps its current ownership and pin. | Use the composition architecture without its agent operating system. Decision-first prototypes and outcome evaluation remain bounded supporting methods. | `poteto-mode`, `arena` orchestration, model-routing rules, `cursor-team-kit`, mandatory PR actions, external-action authority, duplicate principle skills, and universal zero-pixel-difference rules. |

These sources contribute methods, not execution authority. Do not install all 3 systems.

### Approved candidate architecture

- `mu-design-eng` is the single candidate entry point. Specialist workflows are plain playbooks, not independently discovered skills.
- Keep critique, shaping, exploration, and implementation distinct from motion review, motion audit, motion implementation, choreography, performance diagnosis, and stress testing.
- Keep detailed standards, recipes, mobile guidance, content/state checks, and visual judgment behind explicit reading conditions.
- Retain Emil's motion audit-and-plan workflow. The earlier exclusion of `improve-animations` is superseded; its automatic executor and model assumptions are not retained.
- Exploration remains user-requested or agreed scope. A router must not silently turn explicit-only upstream workflows into unsolicited work.
- Keep charts with `tufte-data-viz`, artwork with `mono-color`, editable designs with `pen-design`, and workflow maps with `breadboarding`.
- Keep authoring, technical prose, shared conduct, and harness delegation with their existing owners.

The old 8-skill recommendation is superseded. Impeccable remains unchanged during candidate evaluation; the candidate remains manual-only to avoid competing automatic owners.

### One prototype branch, 2 artifact purposes

1. **Decision experiment, from pstack:** name the uncertain decision, make disposable alternatives, observe behavior, and record the choice. Implement production code separately.
2. **Integration candidate, from Emil:** build project-native working alternatives, then integrate only the selected variant after authorization and project checks.

Declare the purpose before building. Skip variants when the direction is already clear. A picker selection expresses a preference; it does not itself authorize file writes or deployment.

## Owner decisions before implementation

| Decision | Recommended boundary | Consequence if rejected |
|---|---|---|
| Retire live execution | Remove the helper architecture after acceptance. Keep it unused during evaluation. | Separate repair or replacement-tool design is required. |
| Arbitrary element picking | Use screenshots, selectors, source locations, and ordinary browser inspection. Do not promise equivalent click-to-agent selection. | Specify the missing interaction and review its trust boundary separately. |
| Annotations | Use ordinary screenshots and written observations. Do not build an annotation upload service. | Define storage, ownership, sharing, and retention before tool work. |
| Parameter controls | Permit local controls inside a bounded prototype. No automatic source-write channel. | Define persistence and source-application authority separately. |
| Variant picker | Use one full-size variant at a time, with labeled touch and keyboard controls. No agent connection. | Decide whether side-by-side views or another selection workflow are essential. |
| Primary name and commands | Use the approved single-entry architecture, named `mu-design-eng`. Keep legacy command retirement gated. | Name any required compatibility surface before cutover. |
| Curated set and discovery | Use plain playbooks and references. Keep the candidate manual-only until outcome acceptance. | Change routing based on evidence; do not auto-install all 17 Emil skills. |
| Brand/system coverage | Test a brand-heavy task. Retain only proven gaps, not a broad new reference layer. | Explicitly accept reduced coverage or approve bounded additions. |
| Cutover scope | Approve repository changes first. Approve installed projection refresh and project cleanup separately. | Source-only retirement must not be reported as runtime retirement. |

## Bounded implementation phases

### 0. Freeze scope and inventory

After approval, recheck worktree changes, source HEAD, exact source pins, and applicable guidance. Record any divergence from this plan.

Inventory managed projections, discovered skills, user-owned collisions, and marked `pin.mjs` shortcut directories. Inspect only authorized project paths for injected tags, CSP edits, wrappers, state files, and annotations. Do not enumerate unrelated projects or read tokens.

Record process ownership if runtime cleanup is authorized. Do not probe a service or terminate an unidentified process. Do not execute old cleanup helpers.

**Exit:** Owner decisions resolved; baseline and ownership inventory recorded; unrelated content preserved.

### 1. Author the instruction-only candidate

Author the candidate in `ai/skills/mu-design-eng/`. Adapt Emil workflows from the exact reviewed snapshot into plain playbooks and references. Record every local adaptation and preserve the MIT notice.

Move the local critique reference with its provenance. Preserve Impeccable license/notice material for retained upstream text. Record pstack paths, revision, license verification, and method adaptations explicitly.

Use one prototype reference for both artifact purposes. Keep migration evaluation in this plan or its evidence records, not a new always-loaded skill.

Correct safety and guidance conflicts at their narrow owner. Do not duplicate project policy in every skill.

**Exit:** References resolve; notices are present; no helper launch, automatic install, CSP mutation, or approval-bypass instruction remains in the candidate.

### 2. Evaluate before destructive cutover

Use disposable copies of the same project snapshots and the same ordinary task prompts. Compare the existing guidance without running its helpers against the candidate guidance.

Keep judge criteria separate from task prompts. Hide approach identities from the reviewer where practical. Use the Owner-selected model settings; do not import pstack model-selection rules.

Run the 5 tasks below. Keep artifacts, diffs, browser observations, and available tool-read evidence. State blinding and transcript limits. Do not score self-reports as proof.

**Exit:** No safety or accessibility blocker. Each task meets its criteria. The Owner accepts any capability loss. One independent reviewer challenges the results.

### 3. Remove superseded source and projection assumptions

Expected files and boundaries:

| Path | Planned change |
|---|---|
| `ai/skills/impeccable/` | Remove runtime, aliases, metadata, and superseded guidance only after retained material has a new owner. |
| `ai/skills/mu-design-eng/` | Add one entry point, reviewed playbooks, references, notices, and provenance. |
| `ai/scripts/project-skills.mjs` | Remove `IMPECCABLE_COMMAND_HINT`, `impeccableSubcommands`, and the skill-specific dispatch. Preserve generic placeholders needed elsewhere. |
| `ai/test-install.sh` | Replace live-helper assumptions with retirement and replacement checks. Preserve generic missing-reference negative tests. |
| `ai/install.sh` | Change only if fixtures show a missing exact-owned cleanup path. Do not broaden deletion rules. |
| `ai/README.md`, `ai/watchlist.toml` | Update current ownership and exact source records. Preserve historical evidence as history. |
| `ai/skills/pen-design/SKILL.md`, `ai/skills/mono-color/SKILL.md` | Replace active Impeccable ownership links with the approved owner. |
| `ai/skills/mono-color/VENDORED_FROM.md` | Distinguish historical adaptation from current ownership. Do not rewrite historical facts. |

Search all tracked files for active references before finalizing this list. Do not rewrite old audit documents merely because they mention Impeccable.

**Exit:** Static checks and disposable installer fixtures pass. No active reference resolves to the removed helper.

### 4. Authorized runtime cutover

Before changing any installed projection, prepare an exact helper-free recovery source. Name its path and content digest in the rollout record. Validate its discovery and references. Exercise partial-provider failure and recovery against this source in disposable fixtures. The vulnerable baseline alone is not a safe recovery target.

Apply only through the owning `ai/install.sh`, from the authoritative checkout. Do not run the full updater. Read shell file patterns before any installer change.

Check all 4 provider projections and their discovery links. Pi stages replacement; other providers rebuild active trees directly. Record per-provider success rather than claim atomic cutover.

Handle marked shortcut directories separately. Installer dead-link cleanup does not remove real shortcut directories. Preserve user-owned or edited content and resolve collisions before replacement.

Inspect authorized project residue manually. Use exact ownership evidence and file diffs. Restore CSP only where the old helper's change is distinguishable from user changes. Do not delete annotations or project state automatically.

Identify relevant helper and poller processes without probing their services. Obtain authorization before stopping confirmed processes, then verify termination. Do not terminate unidentified or unrelated processes.

Classify residue as inert historical data, executable entry points, or weakened CSP. Preserve historical data. Executable residue and weakened CSP require resolution or an explicit blocked status.

**Exit:** New discovery works, retired managed entry points are absent, repeat installation is stable, and confirmed old processes have stopped. If process verification or hazardous-residue cleanup is unavailable, report **managed-discovery retirement only**. Full runtime retirement remains blocked.

## Acceptance tests

### Outcome comparison

Use 3–6 criteria per task. Freeze criteria before candidate work. Record pass, fail, or not observed, with evidence. These are small migration trials, not statistical proof.

| Task | Required evidence |
|---|---|
| Bounded UI repair | Fix the stated defect; preserve unrelated design and tokens; avoid forced context setup; show diff and browser result. |
| Open design decision | Name uncertainty; produce 2–3 materially different alternatives; state artifact purpose; demonstrate interactions; record Owner choice before integration. |
| Dense product screen | Check hierarchy, realistic long content, empty/loading/error/permission states, recovery, keyboard/focus, narrow layout, zoom, and actionable copy. |
| Motion or gesture interaction | Show purposeful and perceptible motion in the actual page. Test interruption, repeated input, final state, reduced motion, touch/keyboard behavior, and relevant performance. |
| Brand-heavy landing page | Show coherent typography, color, hierarchy, information architecture, responsive behavior, and project-specific identity. Do not substitute interaction polish for brand judgment. |

Actual browser validation is mandatory for later UI implementation. An isolated preview alone is insufficient for integrated motion. Record the page, viewport, scenario, observation, and capture or trace. If browser validation is unavailable, mark acceptance blocked.

### Picker and prototype tests

- Every variant renders at full size. Switching does not leave stale state or broken focus.
- Missing, invalid, negative, non-integer, and out-of-range `?v=` values render a valid default.
- Keyboard shortcuts ignore editable fields and modified keys, including Shift. Touch controls remain usable on narrow screens.
- Focus, accessible labels, selected state, replay/reset behavior, and reduced motion work.
- Trusted fixtures or safe rendering prevent unescaped external content from reaching `innerHTML`.
- Prototype routes are development-only and absent from production outputs. Controls use mocked data and cannot perform live mutations.
- No picker action sends agent commands, writes source, starts a helper, or changes CSP.

### Repository and migration tests

- Run targeted syntax checks for changed JavaScript and `sh ai/test-install.sh` in disposable fixtures.
- Preserve the generic missing-script/reference failure case using a neutral fixture instead of the removed Impeccable tree.
- Check all 4 provider outputs for resolved links, correct manual invocation metadata, and no retired scripts, commands, placeholders, or `npx impeccable` instructions.
- Seed old managed links, marked shortcut directories, user-edited shortcuts, conflicting files, and stale outputs. Verify exact-owned cleanup and user-content preservation.
- Test first install, repeat install, partial provider failure, and recovery. Check both replacement names and old command-name collisions.
- Run `pi/test-native-skills.mjs` only when the authorized installed host and current projection are available. Record unavailable checks as blocked, not passed.
- Review `git diff --check`, document links, license notices, provenance, and the final file disposition list.

## Rollback and failure handling

1. Preserve the pre-change source revision and exact per-provider baseline. Preserve user-owned project data separately where cleanup is authorized.
2. If candidate quality fails, keep it uninstalled. Retain read-only design guidance; keep live helpers unused. Do not claim retirement complete.
3. If source changes fail tests, revert only this implementation's changes. Do not use broad reset commands or overwrite unrelated work.
4. If projection refresh fails, report which providers changed. Repair or regenerate each affected managed tree through the owner installer.
5. Use the exact helper-free recovery source prepared and fixture-tested before Phase 4. Recover old design text if necessary, but never restore live launch instructions as the default.
6. Restore only confirmed project edits from captured diffs. Do not restore broad CSP permissions or delete user annotations to make cleanup pass.
7. Recheck discovery and repeat installation. If safe recovery is uncertain, stop runtime rollout and report the remaining exposure.

## Explicit exclusions

No current-upstream Rust migration, binary launcher, hooks, autonomous Apply, telemetry/catalog integration, privileged replacement service, or security backport is included.

No global dependency changes, generic installer rewrite, new agent roles, automatic model selection, new router, persistent workflow state machine, or permanent evaluation framework is included.

No automatic project-wide cleanup, live exploit validation, service probing, secret inspection, commits, pushes, or PR creation is included.

No immediate parity claim covers element picking, annotations, parameter persistence, brand workflows, or design-system extraction. Their treatment follows the decision gates above.

## Independent review

One read-only reviewer challenged the proposal. It identified capability-loss approval, stale real shortcut directories, non-atomic provider refresh, security overclaims, and incomplete outcome coverage.

This plan incorporates those findings. It also makes pstack a named source, separates disposable experiments from integration candidates, and keeps rollback from restoring vulnerable execution.

The final draft review found 2 further gaps: runtime retirement needed a process-completion gate, and safe rollback needed a prepared recovery source. Phase 4 and rollback now include both requirements. If process verification is unavailable, only managed-discovery retirement can be claimed.

The reviewer made no file changes and ran no helpers, services, installs, or tests. All reported material findings are addressed in this plan. No implementation acceptance has run.
