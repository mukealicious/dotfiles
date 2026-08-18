# Pi Profile and Skill Simplification — Implementation Spec

**Status:** Approved
**Type:** Runtime-boundary cleanup and workflow simplification
**Effort:** XL overall in independent slices; first vertical slice L
**Date:** 2026-08-18

## Outcome

After this work:

- `~/.pi/work` and `~/.pi/personal` are the only supported Pi profiles.
- Supported Pi launches always select one of those profiles.
- Shared generated Pi instructions and agent definitions live under `.ai-runtime/pi/`, not `~/.pi/agent`.
- Neither local installer reads from or writes to `~/.pi/agent`.
- Profile-sensitive local packages derive user-scoped state from the active profile.
- The parent session coordinates a small set of mechanically bounded leaf roles.
- Planning, implementation, review, TDD, and handoff are composable, lightweight workflows.
- Pi conversation-tree navigation, bounded subagents, Herdr worktrees, and separate-session forks have explicit non-overlapping jobs.
- Mitsupi exposes only an explicit allowlist of useful or deliberately trialed resources.
- Personal named modes express capability depth while `/fast` remains an independent service-tier control.
- Retained skills have current, pinned provenance and clear capability boundaries.
- Herdr owns managed-pane coordination, generated integrations, and attention.
- The user can delete `~/.pi/agent` manually after the implementation verifies both profiles and reports why deletion is safe.

Implementation starts only after the user explicitly approves this revised spec. Approval changes the status to **Approved**; it is never inferred from an empty Hunk comment list.

## Problem

The dotfiles intend to provide two real Pi profiles:

- `~/.pi/work` for work authentication and provider state;
- `~/.pi/personal` for personal authentication and provider state.

That contract is incomplete. Parts of the vendored `pi-subagents` package still address `~/.pi/agent` directly, `pi/install.sh` configures it like a third profile, and `ai/install.sh` uses it as the backing store for shared Pi resources. Raw `~/.bun/bin/pi` can therefore become an accidental third runtime.

The adjacent workflow surface has also accumulated overlap:

- unused `cost.ts` and `watchdog.ts` extensions and dead runtime symlinks;
- duplicated Pi dispatch behavior in Fish and `bin/pi`;
- inherited interactive Git editor settings that can hang agent-driven Git;
- obsolete subagent roles, prompt pipelines, writable read-only roles, and default output/progress files;
- overlapping planning and architecture skills;
- an always-loaded 566-line `pi-subagents` skill that duplicates its package README;
- most Mitsupi resources loading by default, including duplicate notifications, profile-incompatible analytics, competing coordination commands, and unwanted policy hooks;
- named-mode and subagent selectors that lag Pi's native `max` reasoning support;
- stale Herdr integration, notification, CLI-semantics, watch, and README state.

The read-only problem is observed rather than theoretical: a scout launched with `output: false` and explicit instructions not to edit still replaced the checkout's root `progress.md` because its builtin definition had `defaultProgress: true`. Tool restrictions, output defaults, progress defaults, and delegation depth must all enforce the role boundary.

## Sources Reviewed

- `dmmulroy/.dotfiles` at `f9f7aa1a3638d6bfb6fa0b94fd110185534a2895`
- `mattpocock/skills` codebase-design at `9c9f36ccd3995266cd675468af71639c8dde1ec5`
- Eric Provencher, “Practical multi-agent orchestration in Codex”
- `provencher/codex-skills/orchestrate/SKILL.md` at `1fe93e920cbd99173eedd22e94d10d49e2c76da7`
- `backnotprop/plannotator` at `64f278d1563542cd5ced7634103d362577243087`
- `rjs/shaping-skills` framing and kickoff sources at `d8b65d7733c71e9bf436f0c2e4da60e5214a96d9`
- installed Mitsupi `1.6.0` and upstream `mitsuhiko/agent-stuff` main at `13bc8f87970bec8830aab0f1c0487d35aa7c0917`
- OpenAI GPT-5.6 model/Fast-mode guidance and the August 13, 2026 DeepSWE v1.1 snapshot
- installed Pi `0.84.2`, Herdr `0.8.0`, and Hunk `0.17.0`

These are comparison inputs, not trees to copy wholesale. Local topic-owned installers, profile separation, Herdr policy, and cross-harness source ownership remain authoritative.

## Decisions

### Profiles and generated resources

1. **Support exactly two Pi profiles.** Work and personal remain separate for auth, settings, packages, sessions, history, and all other mutable state.
2. **Make `PI_CODING_AGENT_DIR` authoritative.** A child inherits the parent's selected profile. Vendored fallback behavior may retain `~/.pi/agent` when the variable is absent, but every supported local entry point sets it.
3. **Use `bin/pi` as the dispatch owner.** Fish delegates to it. Generic `pi` preserves an inherited profile; without one, it infers a recognized `--session` profile before using `PI_DEFAULT_PROFILE`. A recognized session path that conflicts with an inherited or explicit wrapper profile fails clearly rather than opening it under the wrong profile.
4. **Move shared generated Pi resources to `.ai-runtime/pi/`.** `ai/install.sh` stages and validates Pi's `AGENTS.md`, `agents/`, and `skills/` before swapping the generated tree. Profiles link the instruction file, discover generated skills through settings, and keep real profile-local `agents/` directories containing per-file links for managed agents. Custom agents and chains remain profile-local; home `~/.agents` remains a skill location, not a Pi user-agent write target. The cutover automatically replaces only exact legacy links through `~/.pi/agent` and preserves unrelated files or links.
5. **End installer ownership of `~/.pi/agent`.** `ai/install.sh`, `pi/install.sh`, and Herdr installation must neither read from nor write to it. Do not introduce a recurring cleanup rule for it.
6. **Delete the old directory manually.** After independent profile verification, report exactly why `~/.pi/agent` is safe to delete. The user will delete it without an automatic backup or migration.
7. **Do not automate old-session retention.** The user does not need the historical fallback sessions enough to justify migration or cleanup machinery. Large work/personal sessions may be reported for optional manual deletion through Pi's `/resume` picker.

### Runtime and launch behavior

8. **Make local package state profile-aware.** Inside `pi-subagents`, one helper owns the active profile and a profile-specific temporary scope; config, discovery, async/results state, history, intercom, chain saves, and cleanup derive from it. `pi-openai-fast` independently resolves its global config from the same environment contract. No supported launch recreates `~/.pi/agent`.
9. **Remove unused runtime hooks.** Delete `pi/extensions/cost.ts` and `pi/extensions/watchdog.ts`, then remove dead installer-managed symlinks without touching regular user files.
10. **Make Git noninteractive only inside supported Pi launches.** Export:

    ```text
    GIT_EDITOR=true
    GIT_SEQUENCE_EDITOR=true
    GIT_MERGE_AUTOEDIT=no
    ```

    User shells keep `GIT_EDITOR="editor --wait"`. Do not add Dillon's substring-based Git interceptor.
11. **Keep Pi engine capabilities.** Chains, async jobs, worktrees, management, intercom, and generic forked context remain available. Simplify policy and defaults rather than deleting working engine features.

### Parent and leaf roles

12. **Keep the current user-facing session as coordinator.** It owns decomposition, decisions, synthesis, approvals, integration, and final validation.
13. **Use the smallest useful team.** Work directly when delegation costs more than it saves. Prefer fresh, narrow children for bounded reconnaissance, evidence gathering, implementation, or independent review.
14. **Use one delegated checkout writer.** `worker` is the only default delegated role with write and Bash access. The parent may implement directly. Concurrent writers require explicit isolated worktrees and disjoint ownership.
15. **Make ordinary roles leaves.** Scout, review, researcher, worker, and ordinary custom roles use `maxSubagentDepth: 0`. Agent creation, templates, and custom definitions default to zero when omitted; a rare purpose-built nested role must opt in explicitly.
16. **Enforce read-only roles mechanically.** Scout and review receive only `read`, `grep`, `find`, and `ls`; they receive no Bash, edit, write, default output, default reads, or progress file. Explicit tool allowlists are authoritative, so the intercom bridge never appends an absent tool. Runs for agents with read-only tool lists reject `output` or `progress` overrides instead of letting the parent extension write into the checkout. The parent or worker supplies Git/test context and performs validation.
17. **Keep one researcher.** Retain the package builtin, merge useful local guidance into it, and delete `pi/agents/researcher.md`. It receives web/evidence tools and read access, but no Bash, generic filesystem write, checkout output, or progress default.
18. **Remove obsolete named roles.** Delete `context-builder`, builtin `reviewer`, `planner`, `oracle`, and unrestricted generic `delegate`, plus their profile overrides and stale documentation. Shared `review` is canonical.
19. **Remove artifact-pipeline assumptions.** Worker and orchestration policy do not assume `context.md`, `plan.md`, or `progress.md`. The parent passes explicit tasks and optional reads when they materially help.
20. **Remove packaged prompt shortcuts.** Delete `gather-context-and-clarify`, `parallel-research`, `parallel-review`, and `parallel-cleanup`. Direct assignments and proportional review replace them.
21. **Apply the approved model policy without adding a router.** Named modes are manual capability-depth controls; delegated roles retain explicit defaults. Model changes stay separate from workflow behavior, `/fast`, and automatic task classification.

### Planning, design, implementation, and review

22. **Adopt Dillon's grilling behavior unchanged initially.** `grilling` uses dependency-aware design trees, batched frontier questions, and delegated factual investigation. Decisions stay with the user.
23. **Keep thin entry points.** `grill-me` is the manual convenience entry into `grilling`. `grill-with-docs` composes `grilling` with `domain-modeling` rather than duplicating either body.
24. **Let domain modeling update durable domain docs.** `domain-modeling` remains model-invocable and may update `CONTEXT.md` or offer/write qualifying ADRs as decisions crystallize.
25. **Delete `spec-planner`.** Current models write ordinary Markdown specs using repository conventions. No skill owns generic spec prose or a `context.md -> plan.md -> progress.md` pipeline.
26. **Replace both local architecture skills with `codebase-design`.** Delete `engineering-patterns` and `improve-codebase-architecture`. Trial Matt Pocock's current `codebase-design` behavior as the single owner of deep modules, interfaces, seams, locality, testability, and optional “design it twice.”
27. **Keep “design it twice” conditional.** TDD may consult `codebase-design` for vocabulary without starting a design exercise. When the user explicitly explores a consequential or uncertain interface, preserve the skill's three-or-more independent interface designs and comparison workflow.
28. **Rehome the two still-owned references.** Move final-pass cleanup under `code-review`; move thin-AI-client guidance under Flares. Base engineering instructions and TDD already own thin slices, safe incremental change, and verification.
29. **Trial Dillon's TDD discipline.** Port the compact TDD core plus `tests.md` and `mocking.md`. Use red/green vertical slices at agreed behavioral seams, test public behavior instead of internals, and use the now-present `codebase-design` skill when interface shape is genuinely uncertain.
30. **Keep `implement` manual and in the current session.** In Pi it is invoked as `/skill:implement`; no bare-command alias is added. It validates the approved spec/tickets against the checkout, implements in small checked slices, and invokes review when useful. It does not automatically delegate and does not commit unless the user separately requests a commit.
31. **Make code review proportional.** Use one reviewer for small changes; two or three reviewers with distinct lenses for substantial changes; specialist security, production-readiness, or codebase-design lenses only when risk warrants them. Remove the mandatory fourth architecture pass.
32. **Keep review advisory and read-only.** Confirmed fixes return to the parent or worker. `code-review` owns the final-pass checklist, `codebase-design` owns structural/interface language, and `production-readiness` owns service/reliability risk.
33. **Add `bro` as manual-only.** In Pi it is invoked as `/skill:bro`; no alias is added. It restates the previous answer plainly and concisely, with provenance to Dillon's reviewed skill.
34. **Delete three additional low-value shared skills.** Remove `emil-design-eng`, `favicon-generator`, and `shopping`. Repo-owned skills are either retained or deleted; do not build a cold-storage or skill-toggle layer.
35. **Keep the two shaping-document skills for normal-use evaluation.** `framing-doc` owns the evidence-grounded “why” before shaping; `kickoff-doc` owns builder-facing shaped territory after shaping. Preserve their concise local adaptations and pin their current upstream provenance.
36. **Bound the retained-skill audit.** Inventory the retained upstream-derived skills once at the start of this slice, freeze that finite source/SHA/disposition list, and validate provenance, frontmatter, links, and invocation. Adopt only specific changes needed by the agreed owner boundary; do not turn the audit into a general refresh, inspect skills selected for deletion, or auto-sync upstream content.
37. **Keep visual capabilities by artifact.** Impeccable owns product UI/UX; Tufte owns quantitative visualization; `visual-deliverables` owns self-contained HTML/SVG explainers; Mermaid owns text-native diagrams; `tldraw-offline` owns the editable local canvas.
38. **Keep research and maintenance capabilities by mechanism.** Researcher gathers delegated evidence; QMD searches local Markdown; opensrc acquires snapshots; librarian analyzes external code; summarize ingests documents; Surf operates authenticated browsing; upstream-review decides adoption. Post-mortem identifies lessons, agent-context owns `AGENTS.md`, build-skill owns `SKILL.md`, and dotfiles-dev owns repository implementation conventions.

### Hunk and handoff

39. **Use Markdown plus Hunk for spec review.** The user opens `hunk diff --watch`; untracked specs are visible. The agent reads user comments with `hunk session comment list --repo . --type user`, edits the same file, and preserves the live review loop.
40. **Do not add Plannotator.** Reconsider only if Hunk lacks a specific approval gate, plan-diff history, phase restriction, or execution checklist that becomes necessary.
41. **Adopt Dillon's handoff runtime behavior unchanged.** Flatten the extension to `pi/extensions/handoff.ts`, keep `navigateTree(..., { summarize: true })`, retain the old JSONL branch, clear restored editor text, and automatically continue from the handoff on the new branch.
42. **Keep handoff in the current Pi/Herdr process.** Profile environment, CWD, pane, and Git state carry through naturally. Add no handoff-specific resolver, child process, Herdr API, persistence, or configuration.
43. **Keep artifacts distinct.** Specs are durable implementation contracts; handoffs are temporary continuation context; Moja Glava checkpoints are durable personal recall artifacts.
44. **Port only focused handoff tests.** Adapt Dillon's three tests for local paths/imports and add one continuity smoke test. Do not build supporting abstractions solely for tests.

### Herdr, integrations, and documentation

45. **Let Herdr own generated integration source.** Refresh work and personal with `herdr integration install pi`; never vendor or hand-edit `herdr-agent-state.ts`.
46. **Do not refresh the fallback integration.** The v4 integration under `~/.pi/agent` is part of the directory the user will delete after verification. Installers must not add a special recurring deletion rule.
47. **Let Herdr own managed-pane attention.** Enable native toasts, disable sounds, sort Agent entries by priority, and keep Pi OSC notifications suppressed when `HERDR_ENV=1`.
48. **Preserve stronger local Herdr policy.** Keep out-of-band privacy, ownership, tab naming, Hunk, and topology rules. Refresh release mechanics, including settled `agent prompt --wait` states and the fact that `pane wait-output` searches the current snapshot immediately.
49. **Document native isolated review.** Add one Herdr worktree + Pi + Hunk recipe. Do not add another Pi/Fish worktree manager or enable persisted pane history.
50. **Repair watch and inventory drift.** Fix Impeccable watch metadata, the broken `docs/mcp-policy.md` reference, and stale README skill/extension/profile inventories.
51. **Skip overlapping Dillon mechanisms.** Do not add cloak, skill-toggle, save-Markdown, paste, private provider/MCP, new cosmetic status extensions, Wayfinder, automatic continuation after compaction, global generated-file/deployment guards, or another orchestration skill. The explicitly allowlisted Mitsupi `whimsical.ts` remains a deliberate personal exception.

### Pi tree, Mitsupi, modes, and trial posture

52. **Treat Pi's conversation tree as a workflow primitive.** Use `/tree` for sequential, reversible exploration in the current process; subagents for bounded independent work; Herdr worktrees for concurrent filesystem isolation; and `/fork` or `/clone` for separate sessions. Do not collapse these into one generic “delegation” concept.
53. **Keep `code-review` as the default independent review workflow.** In Pi it is invoked as `/skill:code-review`; no alias is added. Hunk owns user-facing annotations. Mitsupi `/review` is an optional manual experiment in tree-isolated review, not a prerequisite or automatic sequel. Start it from an empty Pi branch, keep automatic fixing disabled, and return through `/end-review` with a summary or explicit fix prompt.
54. **Trial `/btw` unchanged for non-mutating tangents.** Accept that its in-memory child does not publish lifecycle state through the root Herdr extension bus, so Herdr may show the pane idle and will not separately notify on completion. Do not vendor it or let it become a second implementation surface.
55. **Do not enable Mitsupi `/loop`.** Version 1.6.0 has no hard iteration cap and includes a subjective self-driven mode. Filter it rather than carrying another local behavioral patch.
56. **Use an explicit Mitsupi resource allowlist.** Retain these package resources and no others:

    **Extensions kept:** `answer.ts`, `context.ts`, `files.ts`, `multi-edit.ts`, `prompt-editor.ts`, `todos.ts`, `uv.ts`, `whimsical.ts`.

    **Extensions enabled for normal-use evaluation:** `btw.ts`, `review.ts`.

    **Skills kept:** `apple-mail`, `commit`, `github`, `google-workspace`, `mermaid`, `pi-share`, `sentry`, `summarize`, `uv`.

    **Prompts and themes:** none; set both resource lists to `[]`.

    Filter `control.ts`, `go-to-bed.ts`, `loop.ts`, `notify.ts`, `session-breakdown.ts`, and `split-fork.ts`; filter Mitsupi skills `anachb`, `frontend-design`, `ghidra`, `librarian`, `native-web-search`, `oebb-scotty`, `openscad`, `tmux`, `update-changelog`, and `web-browser`; filter the unused `nightowl` theme. Package files used internally by retained resources remain installed but are not separately exposed. `pi-subagents` resolves skills only from settings-declared packages, applies their resource filters, and does not opportunistically scan unrelated installed or global npm packages.
57. **Keep one notification fallback.** Local `pi/extensions/notify.ts` remains the non-Herdr OSC fallback and suppresses itself under `HERDR_ENV=1`; Mitsupi `notify.ts` is filtered. Keep `session-breakdown.ts` filtered because it hardcodes `~/.pi/agent/sessions`.
58. **Make named modes manual capability-depth controls.** `/fast` independently controls service tier and must not alter model, thinking, tools, or workflow. Do not add task-, cost-, or latency-named modes and do not auto-switch the parent. Trial this personal runtime mapping before tracking installer defaults or configuring work mappings:

    | Mode | Model | Thinking |
    |---|---|---|
    | `light` | `gpt-5.6-luna` | `max` |
    | `standard` | `gpt-5.6-terra` | `max` |
    | `default` | `gpt-5.6-sol` | `xhigh` |
    | `deep` | `gpt-5.6-sol` | `max` |

    `default` is required by Mitsupi. The user creates and adjusts these entries through Mitsupi's `/mode` UI in the personal profile; `modes.json` remains untracked runtime state. Both profiles eventually use the same mode names, but provider/model mappings may differ. Work mapping stays deferred until work credentials permit model inspection.
59. **Support Pi's native `max` level end to end.** Require Pi `>=0.80.6`; add `max` to repo-owned pi-subagents parsers, selectors, descriptions, and tests. Pin Mitsupi as `npm:mitsupi@1.6.0` while carrying one exact-context patch that accepts `max` and stops a fresh profile from creating the latency-named `fast` mode. Preflight both profile copies before applying the idempotent patch and fail installation on a version/context mismatch. Do not open an upstream contribution. Remove the patch and unpin only after a reviewed release independently supports both behaviors.
60. **Use capability-appropriate delegated defaults.** Resolve provider names through the active profile and begin with:

    | Role | Model | Thinking |
    |---|---|---|
    | `scout` | `gpt-5.6-luna` | `high` |
    | `researcher` | `gpt-5.6-terra` | `high` |
    | `worker` | `gpt-5.6-luna` | `max` |
    | `review` | `gpt-5.6-sol` | `xhigh` |

    These are defaults, not an automatic router. The parent may override a run; failed or ambiguous implementation escalates to Sol. Terra remains available for comparison when a Luna worker takes too many steps.
61. **Keep trials informal.** Enable the selected capabilities, use them naturally, and revisit them after enough experience. Add no counters, telemetry, deadlines, trial-state files, automatic removal, or mandatory evaluation ceremony.
62. **Keep both paid search providers with explicit routing.** Parallel remains the ordinary search/fetch/research provider; Exa remains the semantic, obscure-code, multilingual, or contradictory-result fallback. Revisit only through a later quality, latency, and spend comparison.

## First Vertical Slice

**Slice:** Profile-scope support state in `pi-subagents` and `pi-openai-fast`.

**Risk proven:** Supported work and personal launches do not read, write, or recreate `~/.pi/agent`, and their background/support state cannot collide.

**Includes:**

- one active-profile helper and profile-specific temporary scope inside `pi-subagents`;
- profile-aware config, settings/package discovery, async/results state, history, intercom, chain saves, and cleanup;
- profile-aware `pi-openai-fast` config;
- focused work/personal isolation plus no-environment fallback tests.

**Defers:** Installer projection, role cleanup, skill changes, Mitsupi curation, handoff, Herdr, and cross-repository inventory updates until the path contract passes. The slice still updates its affected package tests and documentation.

## Deliverables and Order

| ID | Effort | Deliverable | Depends on |
|---|---|---|---|
| D1 | M | Add the active-profile helper and profile-specific subagent temporary scope | — |
| D2 | M | Convert remaining local-package state, including `pi-openai-fast`, and add isolation tests | D1 |
| D3 | L | Stage and cut over generated resources with profile-local agent storage and targeted legacy-link migration | D2 |
| D4 | M | Consolidate launch precedence/Git behavior and remove dead runtime hooks safely | D2 |
| D5 | L | Simplify roles, enforce read-only/leaf boundaries, remove prompt pipelines, and apply role model defaults | D2 |
| D6 | L | Apply the finite skill/workflow inventory, provenance, watch, projection, and documentation changes | D3, D5 |
| D7 | L | Pin and curate Mitsupi, honor package filters, support `max`, and complete manual personal-mode calibration | D2, D5 |
| D8 | M | Add the focused handoff skill/extension and tests | D3, D6 |
| D9 | M | Refresh Herdr integration/attention and run final doctor/inventory/documentation consistency checks | D3, D4, D7, D8 |
| D10 | M | Validate both profiles independently and issue the manual fallback-deletion report | D9 |

Each deliverable updates the tests, watches, projections, and documentation it directly changes. D9 is a final consistency pass, not the owner of unfinished work from earlier slices.

## Likely Source Files

### Profile and runtime boundary

- `pi/packages/pi-subagents/agents.ts`
- `pi/packages/pi-subagents/index.ts`
- `pi/packages/pi-subagents/skills.ts`
- `pi/packages/pi-subagents/artifacts.ts`
- `pi/packages/pi-subagents/run-history.ts`
- `pi/packages/pi-subagents/intercom-bridge.ts`
- `pi/packages/pi-subagents/chain-clarify.ts`
- `pi/packages/pi-subagents/types.ts` and temp-path/isolation tests
- a small package-local profile-path module if the existing helper cannot remain the single owner
- `pi/packages/pi-openai-fast/extensions/index.ts`, tests, and README
- `pi/install.sh`
- `ai/install.sh`
- `bin/pi`, `bin/pi-work`, `bin/pi-personal`
- Fish Pi aliases/functions
- `bin/dot-doctor`

### Roles and orchestration

- `pi/packages/pi-subagents/skills/pi-subagents/SKILL.md`
- `pi/packages/pi-subagents/README.md`
- `pi/packages/pi-subagents/agents/scout.md`
- `pi/packages/pi-subagents/agents/worker.md`
- `pi/packages/pi-subagents/agents/researcher.md`
- obsolete builtin agent and prompt files listed above
- `pi/agents/researcher.md` — delete
- `pi/agents/review.frontmatter`
- `ai/agents/review.body.md`
- `pi/settings.personal.json`
- `pi/settings.work.json`
- `pi/packages/pi-subagents/pi-args.ts`, `chain-clarify.ts`, `agent-manager-edit.ts`, and every other thinking-level selector
- `pi/packages/pi-subagents/schemas.ts`, `settings.ts`, `single-output.ts`, `intercom-bridge.ts`, `agent-management.ts`, and `agent-templates.ts`
- package tests that enforce role depth, authoritative tool lists, read-only persistence, provider-neutral model resolution, and `max`
- `pi/settings.personal.json` and `pi/settings.work.json` Mitsupi resource allowlists
- a version-checked local patch under `pi/patches/` for Mitsupi `prompt-editor.ts`
- `pi/install.sh` package pin, two-profile preflight, patch application, and Pi version guard
- personal runtime `modes.json`, configured by the user through `/mode`; no tracked baseline until it stabilizes

### Skills and review

- `ai/skills/spec-planner/` — delete
- `ai/skills/engineering-patterns/` — delete
- `ai/skills/improve-codebase-architecture/` — delete
- `ai/skills/emil-design-eng/` — delete
- `ai/skills/favicon-generator/` — delete
- `ai/skills/shopping/` — delete
- `ai/skills/codebase-design/` — add with pinned provenance
- `ai/skills/grilling/` — add
- `ai/skills/domain-modeling/` — add/adapt
- `ai/skills/grill-me/` and `ai/skills/grill-with-docs/` — thin entry points
- `ai/skills/tdd/` — add
- `ai/skills/implement/` — add/adapt
- `ai/skills/bro/` — add
- `ai/skills/handoff/` — add
- `ai/skills/code-review/` — proportional workflow and final-pass reference
- `ai/skills/flares/references/thin-ai-clients.md` — moved reference
- `ai/skills/framing-doc/` and `ai/skills/kickoff-doc/` — retain concise adaptations and pin provenance
- the finite retained upstream-derived skill inventory frozen at the start of D6
- `ai/skills/hunk-review/SKILL.md`
- `ai/watchlist.toml`

### Pi and Herdr integration

- `pi/extensions/cost.ts` — delete
- `pi/extensions/watchdog.ts` — delete
- `pi/extensions/handoff.ts` — add
- `pi/extensions/notify.ts` — retain as the sole non-Herdr notification fallback
- Mitsupi extension/skill/theme allowlists in both profile settings
- focused handoff tests
- `herdr/config.toml`
- `herdr/install.sh`
- `herdr/README.md`
- `ai/skills/herdr/SKILL.md`
- `ai/skills/herdr/references/cli.md`
- `README.md`, `ai/README.md`, `pi/README.md`, and affected package READMEs

## Interface Contracts

### Active profile

```text
active_profile_dir = PI_CODING_AGENT_DIR if set
                     ~/.pi/agent otherwise  # upstream compatibility only
```

- Supported wrappers always set `PI_CODING_AGENT_DIR` to work or personal.
- Children inherit the selected value unchanged.
- User-scoped config, settings, package skill discovery, async/results state, history, intercom, chain saves, temporary artifacts, and cleanup derive from the helper and profile-specific temp scope.
- `pi-openai-fast` resolves its global config from the active profile directory.
- Project-scoped `.pi/` and legacy project `.agents/` discovery stays unchanged; home `~/.agents` is not a Pi user-agent directory.
- Shared generated resources do not make mutable state shared.

### Generated Pi resources

- Authored sources remain under `ai/`, `pi/agents/`, and provider-specific fragments.
- Generated Pi outputs are under:

  ```text
  .ai-runtime/pi/AGENTS.md
  .ai-runtime/pi/agents/
  .ai-runtime/pi/skills/
  ```

- The complete Pi tree is built in a temporary sibling, validated, and swapped into place before profile links change.
- `~/.pi/work/AGENTS.md` and `~/.pi/personal/AGENTS.md` point to the generated instruction file.
- Each profile keeps a real `agents/` directory. Managed agent files link individually to `.ai-runtime/pi/agents/`; custom agents and chains stay in that profile. A user-owned entry that collides with a managed agent name stops the cutover with an actionable error rather than being overwritten.
- The installer replaces exact legacy links through `~/.pi/agent` without broad `--force`, but preserves unrelated regular files and links.
- Neither profile resource link may resolve through `~/.pi/agent`.
- Runtime settings, themes, extensions, dependencies, packages, auth, sessions, and custom agents/chains remain profile-owned.

### Supported launch boundary

- `bin/pi` is the only profile-dispatch algorithm; direct wrappers share its launch-environment helper.
- Generic `pi` precedence is inherited `PI_CODING_AGENT_DIR`, then a recognized `--session` path, then `PI_DEFAULT_PROFILE`.
- `pi-work` and `pi-personal` always select their named profile.
- Any recognized work/personal session path that conflicts with the selected profile fails with an actionable error.
- Supported launches override interactive Git editor variables before invoking real Pi.
- Raw unprofiled `~/.bun/bin/pi` remains unsupported local usage.

### Workflow primitives

| Primitive | Job | Does not own |
|---|---|---|
| Pi `/tree` | Reversible sequential exploration in the current process | Concurrent execution or filesystem isolation |
| `pi-subagents` | Bounded independent child work with explicit tools and ownership | User-facing decisions or Herdr pane topology |
| Herdr worktrees | Concurrent processes with filesystem isolation | Conversation-tree history or child-role policy |
| `/fork` and `/clone` | Separate-session exploration | Ordinary bounded leaf delegation |
| Handoff | Same-process continuation from summarized context | New processes, profile selection, or durable personal memory |

### Curated Mitsupi contract

- Profile settings pin `npm:mitsupi@1.6.0` and use positive extension, skill, prompt, and theme resource lists.
- Pi and `pi-subagents` honor the same package filters; filtered resources are neither discovered nor executable even though internal files remain installed.
- Local notify and Mitsupi notify never run together.
- `control.ts` cannot expose session sockets because it is not loaded and wrappers do not add `--session-control`.
- `/review` and `/btw` remain manual alternatives. `/loop` is not loaded, and no local skill or extension invokes the trial commands automatically.
- The local prompt-editor patch preflights both copies, verifies Mitsupi `1.6.0` and exact context, applies idempotently, and fails installation on mismatch.

### Modes and role routing

- Mode names express capability depth: `light`, `standard`, required `default`, and `deep`.
- `/fast` is a separate boolean service-tier control and composes with any supported model.
- Personal modes are mutable profile state created through `/mode`; the installer neither seeds nor tracks `modes.json`.
- A fresh patched profile creates only required `default`, never a latency-named `fast` mode.
- Parent mode selection never implicitly changes a child's model. Role defaults and explicit subagent overrides own child routing.
- Any role or mode that specifies `max` uses Pi's native level rather than silently degrading to `xhigh`.
- No trial creates tracking state.

### Coordinator contract

The invoked `pi-subagents` skill becomes approximately 25–40 lines:

1. Work directly when delegation is not worth its cost.
2. Keep the parent user-facing and responsible for decisions and validation.
3. Prefer fresh, narrow, non-overlapping leaf tasks.
4. Use one delegated writer unless worktrees provide explicit isolation.
5. Scale review and specialist effort to scope and risk.
6. Preserve user approval for scope, architecture, external actions, and irreversible work.
7. Integrate child results into one coherent response.
8. Route mechanics, schemas, chains, control, intercom, and troubleshooting to the package README.

### Read-only roles

- Tool allowlists contain no shell or mutation path and bridge setup cannot widen them.
- Read-only roles have no output/progress defaults; explicit `output` or `progress` overrides fail before launch.
- `maxSubagentDepth: 0` blocks child delegation.
- Read-only audits assert checkout cleanliness after completion, including hostile override attempts and an active bridge.
- Parent/worker owns Git inspection that requires commands, test execution, and fixes.

### Review scaling

| Change | Default review |
|---|---|
| Small, local, low-risk | One read-only reviewer |
| Substantial or cross-module | Two or three reviewers with distinct assignments |
| Service/reliability/security-sensitive | Add only the relevant specialist lens |
| Trivial mechanical change with strong validation | Parent review may be sufficient |

Review count is a judgment, not a mandatory pipeline.

### Handoff continuity

- The handoff skill writes temporary context outside the checkout and references durable specs, ADRs, issues, commits, and diffs rather than copying them.
- It redacts sensitive values and records the next unfinished step plus recovery information.
- The extension stays in the current process and preserves the old tree branch.
- Failure or cancellation retains the original branch and any artifact already written; it must not report success-shaped continuation.

## Acceptance Criteria

### Profile boundary and generated resources

- [ ] Work and personal children use their parent's auth/provider/settings and mutable support state.
- [ ] Tests prove active-profile ownership for config, settings, package skills, async/results state, history, intercom, chain saves, temporary artifacts, cleanup, and `pi-openai-fast` config.
- [ ] Tests preserve fallback behavior when `PI_CODING_AGENT_DIR` is absent.
- [ ] No supported runtime implementation hardcodes `~/.pi/agent` where the active profile is required.
- [ ] `ai/install.sh`, `pi/install.sh`, and `herdr/install.sh` contain no operational dependency on `~/.pi/agent`.
- [ ] Shared Pi instructions, managed agents, and skills are staged under `.ai-runtime/pi/` and resolve correctly from both profiles.
- [ ] A failed staged projection leaves the previous generated tree and profile links usable.
- [ ] Profile `agents/` directories are real and separate; only managed files link to generated agents, custom agent/chain CRUD cannot cross profiles, and managed-name collisions fail without overwriting user files.
- [ ] Profile settings, extensions, themes, packages, dependencies, auth, sessions, and custom agents/chains remain separate.

### Runtime and launch cleanup

- [ ] `pi/install.sh` configures only work and personal and no longer seeds auth from the fallback directory.
- [ ] `cost.ts` and `watchdog.ts` are absent from source and known installer-managed profile links; same-named user-owned files or live unmanaged links are preserved and reported.
- [ ] Installer-managed dead symlinks are removed without deleting regular files or live unmanaged links.
- [ ] Fish and non-Fish Pi invocations share one dispatch implementation.
- [ ] Inherited profile, session-path, and default dispatch precedence is tested; conflicting recognized profile/session inputs fail clearly.
- [ ] `pi`, `pi-work`, and `pi-personal` expose the three noninteractive Git variables to the real Pi process.
- [ ] User-shell Git editor configuration remains unchanged outside Pi.

### Roles and orchestration

- [ ] `pi-subagents/SKILL.md` is at most 40 lines and contains policy plus README routing, not API duplication.
- [ ] Scout and review expose only `read`, `grep`, `find`, and `ls`, create no checkout artifacts, reject output/progress overrides, receive no bridge-added tool, and cannot delegate.
- [ ] Researcher has no Bash, generic filesystem write, checkout output/progress default, or nested delegation.
- [ ] Worker is the only default delegated checkout writer and does not assume context/plan/progress files.
- [ ] Read-only integration tests leave the checkout byte-for-byte unchanged after normal runs, hostile override attempts, and runs with an active intercom bridge.
- [ ] `context-builder`, builtin `reviewer`, `planner`, `oracle`, `delegate`, profile overrides, and four prompt shortcuts are removed.
- [ ] The package builtin researcher is the only Pi researcher definition.
- [ ] Engine-level chains, async, worktrees, management, intercom, and generic fork support still pass existing tests; newly created and field-defined ordinary custom roles default to leaf depth.
- [ ] Every pi-subagents thinking-level parser, selector, serializer, and launch path accepts native `max`.
- [ ] Provider-neutral role defaults resolve to scout Luna/high, researcher Terra/high, worker Luna/max, and review Sol/xhigh in each active profile.

### Skills and workflow

- [ ] `spec-planner`, `engineering-patterns`, `improve-codebase-architecture`, `emil-design-eng`, `favicon-generator`, and `shopping` are absent from sources, projections, watches, docs, and cross-links.
- [ ] `codebase-design` is pinned and projected as the sole deep-module/interface/seam skill.
- [ ] Final-pass guidance resolves from `code-review`; thin-AI-client guidance resolves from Flares.
- [ ] `grilling` and `domain-modeling` own reusable behavior; manual entry points remain thin.
- [ ] TDD includes its focused test/mocking references and resolves its `codebase-design` dependency.
- [ ] `implement`, `bro`, and handoff use the intended manual-only invocation policy; Pi exposes `/skill:implement`, `/skill:bro`, and `/handoff` without extra aliases.
- [ ] `implement` runs in the current session, does not automatically delegate, and never commits without a separate request.
- [ ] Code review scales proportionally and has no mandatory fourth architecture pass.
- [ ] `framing-doc` and `kickoff-doc` remain distinct, concise, and pinned to the reviewed `rjs/shaping-skills` source.
- [ ] The frozen retained-skill inventory has a source SHA and explicit keep/adopt/no-change disposition; frontmatter, links, invocation boundaries, and inventories are current.
- [ ] Retained and adopted skills have accurate provenance/watch metadata; moved references preserve their original provenance.
- [ ] Visual, research, and agent-maintenance skill descriptions preserve the agreed one-owner boundaries.

### Pi tree, Mitsupi, and modes

- [ ] Documentation distinguishes `/tree`, subagents, Herdr worktrees, `/fork`/`/clone`, and handoff by state/process/isolation semantics.
- [ ] Mitsupi discovers exactly the 10 allowlisted extensions and nine allowlisted skills; its prompt and theme lists are empty and `nightowl` is not exposed.
- [ ] `control`, `go-to-bed`, `loop`, Mitsupi `notify`, `session-breakdown`, and `split-fork` are not loaded.
- [ ] Austrian transport, Ghidra, OpenSCAD, tmux, changelog, and four previously filtered duplicate/browser/design skills are not Pi-visible.
- [ ] Local notify remains active outside Herdr and no second `agent_end` notification hook is loaded.
- [ ] Both settings pin `npm:mitsupi@1.6.0`; the patch accepts `max`, creates no `fast` default mode, is idempotent across both profiles, and fails installation before mutation for an unknown version or context.
- [ ] No upstream issue, pull request, or other contribution is created.
- [ ] After the user configures `/mode`, personal runtime modes resolve to Luna/max, Terra/max, Sol/xhigh, and Sol/max under `light`, `standard`, `default`, and `deep`.
- [ ] Selecting a named mode does not toggle `/fast`; toggling `/fast` does not change mode, model, or thinking.
- [ ] `/review` and `/btw` can be invoked manually but are not wired into implementation, TDD, or review automation; `/loop` is unavailable.
- [ ] No trial telemetry, counter, deadline, state file, or automatic removal mechanism is added.

### Hunk and handoff

- [ ] An untracked Markdown spec appears in `hunk diff --watch`.
- [ ] User comments can be read with `hunk session comment list --repo . --type user` and addressed in the same file.
- [ ] Implementation begins only after direct user approval changes this spec's status to **Approved**.
- [ ] No Plannotator dependency or configuration is added.
- [ ] `/skill:code-review`, Mitsupi `/review`, and Hunk remain alternatives with documented boundaries rather than a mandatory sequence.
- [ ] Dillon's three focused handoff tests pass after path/import adaptation.
- [ ] One smoke test confirms handoff preserves active profile, CWD, Herdr pane, and uncommitted Git state in the same process.
- [ ] Cancellation/failure retains the old branch and reports failure honestly.

### Herdr, watch, and docs

- [ ] `herdr config check` passes with toasts enabled, sounds disabled, priority sorting, and no persisted pane history.
- [ ] Work/personal Pi integrations are current and no installer refreshes the fallback integration.
- [ ] Pi emits no duplicate OSC notification under `HERDR_ENV=1`.
- [ ] Herdr guidance accurately documents prompt settlement and immediate snapshot matching.
- [ ] Native worktree + Pi + Hunk review is documented without another lifecycle owner.
- [ ] `bin/ai-watch --json` succeeds.
- [ ] README inventories and local Markdown links are current.

### Manual fallback deletion report

Before declaring `~/.pi/agent` safe to delete, verification must establish:

- [ ] each profile's supported authentication mechanism is usable without exposing credentials; personal may use `auth.json`, while work may use `OPENAI_API_KEY` or `OPENAI_OP_REF`;
- [ ] bounded work and personal launches select the expected profile/provider;
- [ ] profile sessions and mutable state remain under their own roots;
- [ ] every required instruction, agent, skill, extension, theme, dependency, and package resolves without traversing `~/.pi/agent`;
- [ ] repository installers and supported wrappers no longer depend on the directory;
- [ ] the remaining directory contents are identified as unsupported historical state, cache, stale generated integration, or user-approved disposable data.

The implementation then reports that deletion is safe and gives the manual command. It does not run the command, create a backup, migrate old sessions, or install recurring cleanup.

## Test Strategy

| Layer | Verification |
|---|---|
| Unit | Active-profile path resolution with temporary work/personal/fallback roots |
| Unit | Config, settings, package skill, history, intercom, chain, and cleanup owners use the shared helper |
| Package | `npm --prefix pi/packages/pi-subagents run test:all` |
| Role boundaries | Tool/depth/default assertions plus integration runs that prove checkout cleanliness and provider-resolved model routing |
| Thinking levels | Unit/UI/launch coverage for `max` across pi-subagents and the version-gated Mitsupi patch |
| Package curation | Profile discovery smoke tests assert the exact Mitsupi extension/skill allowlist and filtered theme |
| Skills | Full watchlist pass, shared validator, link/provenance checks, invocation metadata checks, and removed-name searches |
| TDD/design | Confirm TDD loads real `codebase-design` and optional design-it-twice references resolve |
| Review | Small and substantial fixture reviews prove proportional routing without write access; manual `/review` remains isolated |
| Modes | Personal mode smoke checks model/thinking pairs and proves `/fast` independence; work mapping remains deferred |
| Handoff | Three focused tests plus one same-process continuity smoke |
| Typecheck | `npm --prefix pi run typecheck` and package-local checks |
| Projection | Run `ai/install.sh`; inspect `.ai-runtime/pi/` and both profile resource links |
| Installer | Run relevant installers twice; verify idempotence and safe dead-link cleanup |
| Runtime | Bounded work/personal profile and launch-environment probes without printing secrets |
| Herdr | `herdr config check` and profile-scoped integration status checks |
| Health | `bin/dot-doctor` |
| Watch | `bin/ai-watch --json` |
| Docs | Search for removed skills, roles, extensions, filtered Mitsupi resources, fallback backing claims, broken links, and stale inventories |
| Whitespace | `git diff --check` |

The Hunk round trip is user-driven: the agent does not launch an interactive Hunk TUI without an explicit request.

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Profile-path refactor changes vendored package behavior | First isolate the helper and add profile/fallback tests; record local divergence in `VENDORED_FROM.md`. |
| Process-wide environment leaks between tests | Prefer injectable roots and restore environment in test cleanup. |
| Generated-resource migration leaves broken profile links | Generate `.ai-runtime/pi/` first, verify both profiles, then remove installer fallback ownership. |
| Installer deletes user-owned runtime files | Remove only known source files and dead installer-managed links; preserve regular files and unmanaged live links. |
| Read-only agents still mutate through persistence defaults | Test tools, output, reads, progress, recursion, and final checkout state independently. |
| Removing named roles breaks hidden package routing | Search code, schemas, settings, prompts, docs, and tests before deletion; keep engine primitives intact. |
| `codebase-design` terminology or three-agent design flow proves noisy | Treat it as a trial; invoke design-it-twice only for explicit interface exploration and revisit after real use. |
| TDD encourages tests at poor seams | Agree behavioral seams first and consult `codebase-design` only when interface shape is unresolved. |
| Retained upstream skill refresh erases useful local adaptation | Review semantic drift manually, pin exact sources, preserve local ownership boundaries, and never auto-sync. |
| Shaping source has no observed license file | Preserve the existing concise adaptations, record the provenance/risk, and do not wholesale-copy new upstream text. |
| Mitsupi update invalidates the local `max` patch | Gate on exact package version and patch context; fail loudly rather than silently dropping `max`. |
| High-effort modes consume quota or add steps without benefit | Keep selection manual and revisit the four rungs through normal use; add no automatic router. |
| `/btw` makes Herdr appear idle while working | Document and accept the limitation during normal-use evaluation; filter it later if the state mismatch is confusing. |
| Mitsupi `/loop` is accidentally exposed | Keep it out of both profile allowlists and assert that it is not discoverable. |
| Handoff branch navigation loses context | Keep the handoff artifact and old JSONL branch recoverable; test failure and continuity. |
| Hunk comments drift after edits | Read current user comments before targeted revisions and use watch/reload rather than rewriting blindly. |
| Git environment blocks a legitimate editor flow | Scope overrides to Pi wrappers; explicit message/file arguments still work and user shells are unchanged. |
| Herdr toasts duplicate or expose output | Keep OSC suppressed, sounds off, native delay/state filtering, and existing privacy policy. |
| User deletes fallback before verification | D10 must produce evidence first; no installer or agent deletes it. |

## Explicitly Out of Scope

- Supporting raw unprofiled Pi as a configured third environment
- Automatically deleting, backing up, or migrating `~/.pi/agent`
- Automated work/personal session retention or compaction cleanup
- Automatic task-to-model routing or automatic parent-mode changes
- Tracking personal named modes as installer defaults before normal-use calibration
- Work-profile mode mapping until work credentials permit model inspection
- Removing stable `pi-subagents` engine capabilities
- A coordinator, planner, oracle, delegate, context-builder, reviewer, or smart-worker role
- A second orchestration skill or mandatory multi-agent pipeline
- Plannotator, Wayfinder, another worktree manager, or another Markdown persistence mechanism
- Automatic continuation after compaction
- Global Cloudflare/generated-file/deployment guards
- Dillon's cloak, skill-toggle, Git interceptor, private provider/MCP, paste, save-Markdown, or additional cosmetic extensions
- Trial telemetry, counters, deadlines, state files, or automatic pruning
- Upstream issues, pull requests, or contributions for local patches
- Herdr persisted pane history
- GNU Stow or a monolithic `dot` script

## Deferred Evaluation

After enough normal use of the simplified system:

1. Revisit `grilling`, `codebase-design`, TDD, `/skill:implement`, `framing-doc`, and `kickoff-doc` based on felt usefulness and friction; do not manufacture trial telemetry.
2. Compare Luna/max workers with explicit Terra/high alternatives using observed first-pass success, elapsed time, steps, and retries, then keep the simpler useful default.
3. Revisit the personal `light`, `standard`, `default`, and `deep` ladder and track installer defaults only after the useful rungs stabilize.
4. Inspect work-profile models once credentials are available, then map the same semantic mode names independently.
5. Revisit Mitsupi `/review` and `/btw`; retain only experiments that establish a unique useful job.
6. Audit remaining shared skills for automatic versus manual-only invocation.
7. Reconsider Plannotator only if Hunk lacks a demonstrated required review state.
8. Reconsider automatic continuation only if real compactions strand work after handoff is available.
9. Add a named smart-worker only if repeated tasks prove ad hoc explicit exceptions insufficient.
10. Consider global guards or package-style extension workspaces only when a concrete repeated need exists.

## Success Metrics

- Exactly two supported Pi profiles own all mutable runtime state.
- Shared generated Pi resources resolve from `.ai-runtime/pi/`, with no installer dependency on `~/.pi/agent`.
- The user receives evidence sufficient to delete the fallback directory manually.
- Pi dispatch and launch environment have one owner.
- Dead runtime hooks, stale links, obsolete roles, prompt pipelines, and duplicate architecture/planning skills are gone.
- Overlapping skill and runtime owners are removed without a cold-storage or toggle mechanism.
- Mitsupi exposes only 10 extensions and nine skills, with no duplicate notification, fallback-profile analytics, session sockets, Ghostty fork, loop, unwanted sleep policy, or unused package theme.
- Ordinary delegation has one coordinator, one default writer, strict read-only leaves, provider-resolved role defaults, and proportional token/team use.
- Personal capability-depth modes support native `max` and remain independent from `/fast` and workflow automation.
- Pi tree exploration, subagent work, Herdr isolation, and separate-session forks have distinct documented contracts.
- Markdown specs complete a Hunk comment/revision loop without another planning runtime.
- TDD, implementation, review, and handoff remain independently useful rather than forming a mandatory pipeline.
- Herdr is the sole generated-integration and managed-pane attention owner.
- Watch commands, doctor checks, provenance, and README inventories are trustworthy.
