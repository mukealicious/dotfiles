# AI Tools Configuration

Shared AI instructions, skills, and harness-aware assembly.

## Reading Map

| Task | Read |
|---|---|
| Change source ownership, projections, instructions, or agents | [Architecture](#architecture) |
| Choose task guidance | [Skill inventory](#skill-inventory), then the matching skill |
| Review/adopt upstream changes | [Upstream provenance](#upstream-provenance-and-review), then the artifact's metadata |
| Change Claude settings, hooks, or MCP | [claude/README.md](../claude/README.md) |
| Change Pi resources, models, MCP, or delegation setup | [pi/README.md](../pi/README.md) |

Specs, progress notes, and provenance records explain past decisions; they are not
startup workflows or permission to install, implement, or deploy.

## Architecture

Skill authoring and runtime discovery are separate concerns.

### Authoring directories

Choose the source owner by runtime dependency:

| Location | Standard | Works With | When To Use |
|---|---|---|---|
| `ai/skills/` | [Agent Skills Standard](https://agentskills.io) | All agents (Claude, Pi, OpenCode, Codex) | Default — instruction-only or standard scripts |
| `claude/skills/` | Claude Code conventions | Claude Code only | Needs `$SKILL_DIR`, subagents, hooks, or plugins |
| `pi/extensions/` | Pi TypeScript API | Pi only | Needs Pi TUI API, tool wrapping, or lifecycle hooks |

### Runtime projections

Portable skills are authored once in `ai/skills/`. `ai/install.sh` refreshes the runtime-facing directories that consume that source:

- `.ai-runtime/codex/skills/` — repo-local Codex-style projected shared skills
- `.ai-runtime/claude-code/skills/` — repo-local Claude-projected shared skills
- `.ai-runtime/opencode/skills/` — repo-local OpenCode-projected shared skills
- `.ai-runtime/pi/skills/` — repo-local Pi-projected shared skills
- `.agents/skills/` — repo-local Codex-style runtime symlink projection of portable skills
- `.claude/skills/` — repo-local Claude-style runtime symlink projection of portable skills plus Claude-only overlays
- `~/.claude/skills/` — user-level Claude install
- `~/.config/opencode/skill/` — user-level OpenCode install
- Pi discovers `.ai-runtime/pi/skills/` via `~/.pi/agent/settings.json`

These are generated outputs. Edit source files in the authoring directories, then
refresh projections with `ai/install.sh` when applying runtime changes.

### Upstream Provenance and Review

This repo keeps upstream context close to the local artifact, then uses an optional batch review when needed:

`provenance -> optional review -> manual adopt`

- `metadata.watch-sources` links frontmatter-friendly files to upstream inspiration or pinned source refs
- `VENDORED_FROM.md` links vendored directories and packages to their upstream source
- `ai/watchlist.toml` defines which GitHub repos and paths are worth checking as a batch
- `bin/ai-watch` collects read-only upstream facts and links them to local artifacts
- `ai/skills/upstream-review/` interprets direct provenance or watchlist reports and ranks whether upstream changes are worth adopting or adapting

The review system is intentionally manual: no auto-install, no auto-sync, no background polling.

### Retained upstream sources

Prefer unchanged reviewed upstream snapshots; retain adaptations only for concrete
capability or safety requirements. The historical D6 source/SHA/disposition record is
[`specs/pi-profile-and-skill-simplification-D6-retained-skill-audit.md`](../specs/pi-profile-and-skill-simplification-D6-retained-skill-audit.md).
This document and the metadata beside each skill are provenance records, not an
auto-sync mechanism.

| Upstream | Local scope | Ownership |
|---|---|---|
| `dmmulroy/skills@8603380821fee6a77c82639f364ce8fe4f5a92be` | `references/coding-standards`, `effect-service-design`, `tech-spec` | MIT notice retained; coding standards are plain optional reference, not a skill; specialist methods defer to project policy |
| `dmmulroy/.dotfiles@bdf5e0611d62436eeb5dc58555c1396ced2dddeb` | `diagnosing-bugs`, `write-discoverable-code` | Current Matt Pocock/Modem snapshots, with verified original MIT notices |
| `dmmulroy/.dotfiles@bdf5e0611d62436eeb5dc58555c1396ced2dddeb` | `writing-for-agents` | Unchanged manual authoring skill; verified Matt Pocock origin and MIT notice; replaces build-skill and agent-context |
| `dmmulroy/.dotfiles@7c086fe40c01bf494aea7184da2eb7aaf7b7dff4` | `grilling`, `bro` | Previously retained instructions; outside this engineering consolidation |
| `mitsuhiko/agent-stuff@b7c45d67c634d361d67340789a02f64ffb9e16f1` | `mermaid` | Unchanged skill/validator snapshot; removed upstream, preserved rather than silently dropped by the package upgrade |
| `walterra/agent-tools@a678024a6fa7a765cd83997b3153f2eebb588d58` | `post-mortem` | Upstream retrospective workflow, with portable source-location/tool wording |
| `viticci/remctl@e7b4e8563903935aa2bab6d4d24d983499b4a4e8` | `apple-reminders` | Agent-safe Apple Reminders reads, explicit-intent writes, and verification through RemCTL |
| `mattpocock/skills@9c9f36ccd3995266cd675468af71639c8dde1ec5` | Thin `grill-me` | Manual entry-point provenance |
| `rjs/shaping-skills@d8b65d7733c71e9bf436f0c2e4da60e5214a96d9` | `framing-doc`, `kickoff-doc`, `breadboarding` | Framing, shaped kickoff territory, and breadboarding |
| `pbakaus/impeccable@39bec7c08c8cb5d694221e2c2e4386140dde8759` | `impeccable` | Product UI/UX and visual interaction design |
| `yanliudesign/mono-color-skill@a08c45df61ae480e2b0d78b978a304e06ba2894e` | `mono-color` | One-ink and controlled two-ink editorial art direction and raster generation |
| `joelhooks/skills@022f29cbfa2ddd36916622d49c02b763060f6847` | `uncomplect` | Independent upstream skill, source map, and evals; local provenance metadata only |
| `cursor/plugins@d1453c11d1dde9714d4c313c97d3a68432265c7f` | `technical-writing` | Manual-only pstack writing standard; companion `unslop` references removed; MIT notice retained |
| Pinned maintenance/research influences | `production-readiness`, `tufte-data-viz`, `herdr`, `hunk-review` | Production risk, quantitative visualization, Herdr, and Hunk |

Rules for retained upstreams:

- keep the shared source in `ai/skills/` as close to the reviewed source as practical;
- use `metadata.watch-sources` and `VENDORED_FROM.md` for exact provenance, with `ai/watchlist.toml` for optional manual drift review;
- resolve provider-specific placeholders during projection, not by editing the source to one harness;
- adopt only an explicitly reviewed snapshot or local owner-boundary adaptation; never auto-sync current upstream.

#### Adding upstream provenance or a watched source

If the source maps to one local file, add `metadata.watch-sources` to that file's
frontmatter. If it maps to a vendored directory, add or update that directory's
`VENDORED_FROM.md`. If it belongs in batch review, add one narrow `[[sources]]`
entry to `ai/watchlist.toml` and verify it with `bin/ai-watch --source <id>`.

### Shared Instructions

Instructions now use the same shared-vs-adapter split as the skill system:

- `ai/instructions/base.md` is the shared source of truth for portable guidance.
- `claude/instructions/appendix.md`, `pi/instructions/appendix.md`, and `opencode/instructions/appendix.md` add only harness-specific behavior.
- `ai/install.sh` assembles the final installed files each harness expects.

Current install targets:

| Installed file | Composition |
|---|---|
| `~/.claude/CLAUDE.md` | `ai/instructions/base.md` + `claude/instructions/appendix.md` |
| `.ai-runtime/pi/AGENTS.md` | `ai/instructions/base.md` + `pi/instructions/appendix.md` |
| `~/.pi/agent/AGENTS.md` | symlink → `.ai-runtime/pi/AGENTS.md` |
| `~/.config/opencode/AGENTS.md` | `ai/instructions/base.md` + `opencode/instructions/appendix.md` |
| `~/.codex/instructions.md` | `ai/instructions/base.md` |
| `~/.gemini/GEMINI.md` | `ai/instructions/base.md` |
| `~/.AGENTS.md` | `ai/instructions/base.md` compatibility output |

Composition rule: keep the shared base strong, keep appendices short and additive, and keep provider or model specifics out of the shared file.

### Project Engineering Policy

Global instructions own agent conduct and safety; repository instructions and
linked docs own architecture, framework idioms, errors, state, testing, and delivery
trade-offs. Shared specialist skills operate within those decisions.

- Invoke `writing-for-agents` for the reusable method of authoring agent guidance.
- Start from the closest related project's standards when useful; adapt selected
  rules into the target project's own authoritative docs and link them from its
  agent instructions. Another project's live policy is not an ongoing dependency.
- [Coding standards references](references/coding-standards/README.md) preserve the
  former policy and link concrete upstream examples. They are optional source
  material, not an installed skill or a mandatory template. There is no separate
  policy-generation workflow.
- Existing projects keep their own decisions; experiments do not inherit a
  production architecture checklist. No work/personal/framework presets are imposed.
- Cloudflare, Effect, discoverability, and spec-writing guidance must not silently
  reintroduce the shared policy through dependency links or examples.

### Delegation

No custom advisor, researcher, or review personas are shipped. Use the harness's
built-in agents for authorized delegation; model selection follows harness and
runtime settings rather than dotfiles role overrides. Independent review remains
available through an explicit request.

`ai/install.sh` removes exact retired managed agent links and the marked Claude
review file. It does not publish agents, create agent directories, or validate
user-owned agents and chains. Historical agent definitions remain in Git, not active projections.

### Shared Skills (`ai/skills/`)

Follow the [Agent Skills Standard](https://agentskills.io):
- YAML frontmatter (`name`, `description`) + Markdown body
- No `$SKILL_DIR` — agent resolves paths from SKILL.md parent directory
- Scripts accessed via shell commands relative to skill location

Skills with `disable-model-invocation: true` are manual-only; their descriptions
are not automatic routing pointers. Model-invoked descriptions should name the
distinct task branches that need the skill. Give supporting docs explicit reading
conditions; keep each rule in its source owner instead of copying it into callers.

### Dependencies in Shared Skills

**Strategy: zero install-time dependencies; prefer built-in runtimes.**

Skills with scripts should use Node/Bun built-in APIs (WebSocket, fs, path, child_process, etc.) or shell commands. No per-skill `package.json` or install step unless explicitly documented.

- **Node and Bun** are already toolchain prerequisites
- Bun provides built-in WebSocket, HTTP server, file I/O — covers most local tooling needs
- Vendored upstream skills may use `node` scripts when that is how upstream ships them
- If a skill truly needs npm packages, add an explicit install step to `ai/install.sh` for that skill dir

### Shared vs Adapter Rule

Keep the core workflow in `ai/skills/` when it works without harness-native
primitives. An overlay contributes optional runtime glue, not a second copy of the
instructions. Repository contracts and shared safety rules remain authoritative;
a design skill is not permission to implement or deploy.

## Skill Inventory

### Shared Skills

The table below is the capability index; inspect each skill's frontmatter for
invocation behavior. For engineering-source adoption history, read the
[consolidation spec](../specs/engineering-skills-consolidation.md) and
[progress record](../progress.md) only when those decisions matter to the task.
For new-project stack selection or approved modernization, read
[project defaults](references/project-defaults.md).

| Skill | Owner / purpose |
|---|---|
| `apple-reminders` | Explicit-intent Apple Reminders reads and writes through RemCTL |
| `breadboarding` | Workflow places, affordances, stores, and wiring |
| `bro` | Manual plain-language restatement |
| `effect-service-design` | Effect service contracts, Layers, composition, and audits |
| `tech-spec` | Manual, design-only typed architecture handoff and grill-first workflow |
| `diagnosing-bugs` | Reproduce, minimize, diagnose, and regression-test hard bugs through a tight feedback loop |
| `dotfiles-dev` | Dotfiles implementation conventions |
| `framing-doc` / `kickoff-doc` | Evidence-grounded framing and shaped kickoff territory |
| `flares` | Cloudflare-native mini-apps and thin AI-client guidance |
| `grill-me` | Thin manual entry into grilling |
| `grilling` | Dependency-aware design-tree questioning |
| `herdr` | Herdr pane/workspace/agent coordination |
| `hunk-review` | Hunk diff and comment workflow |
| `impeccable` | Product UI/UX and visual interaction design |
| `opensrc` | External source-cache acquisition |
| `mermaid` | Frozen upstream Mermaid validation skill preserved after its removal from Mitsupi |
| `moja-glava` | Durable private knowledge checkpoints |
| `mono-color` | One-ink and controlled two-ink editorial art direction, raster assets, and production prompts |
| `pen-design` | Local MCP-first Pen.dev integration; loads provider guidance at runtime rather than redistributing it |
| `post-mortem` | Session lessons and guidance improvements |
| `production-readiness` | Service, data, deployment, and reliability risk |
| `security-audit-local` | Manual, source-only trust-boundary review; optional synthetic authorization lab, not a full audit runner |
| `qmd` / `surf-browser` | Local Markdown search and authenticated browsing |
| `tufte-data-viz` | Quantitative visualization judgment |
| `uncomplect` | Upstream-baseline pressure test for stateful systems, replacement designs, and accidental complexity |
| `upstream-review` | Manual provenance and adoption decisions |
| `write-discoverable-code` | Searchable names, clear types, and discoverable module boundaries |
| `technical-writing` | Manual writing and review standard for human-facing technical documents; near-upstream pstack skill |
| `writing-for-agents` | Manual authoring reference for skills, AGENTS/CLAUDE files, and other agent-facing documents |

Request reviews directly; no separate review skill, prompt, or custom agent is
shipped. Follow repository-local conventions for tests, terminology,
ADRs, and stack decisions; do not resurrect retired global playbooks.

`framing-doc` and `kickoff-doc` remain distinct: framing captures the evidence
grounded “why” before shaping; kickoff records builder-facing shaped territory
after shaping.

### One-owner capability boundaries

- **Visual:** `pen-design` owns Pen-generated editable `.pen` artifacts and
  their exports; `impeccable` owns code-first product UI/UX and critique;
  `mono-color` owns one-ink and controlled two-ink editorial art direction and
  raster assets; `tufte-data-viz` owns quantitative graphics;
  Mermaid owns text-native diagrams; `tldraw-offline` owns the editable local canvas.
- **Research:** `qmd` searches local Markdown; `opensrc` acquires source snapshots;
  `summarize` ingests documents; `surf-browser` operates authenticated browsing.
- **Maintenance:** `upstream-review` decides adoption; `post-mortem` identifies
  lessons; users can invoke `writing-for-agents` for agent-document authoring;
  `dotfiles-dev` owns repository conventions; `hunk-review` owns Hunk annotations.

### Claude-Specific (`claude/skills/`)

Optional authoring directory for Claude-native overlays. Shared skills are
projected to `.ai-runtime/claude-code/skills/` and linked into `.claude/skills/`
and `~/.claude/skills/`; they are never generated into the authoring directory.

### Pi Extensions (`pi/extensions/`)

Custom extensions symlinked by `pi/install.sh`. Third-party extensions installed via packages:

| Extension | Type | Description |
|---|---|---|
| `notify.ts` | Lifecycle hook | Non-Herdr desktop notification via OSC 777; suppressed under `HERDR_ENV=1` |
| `modes.ts` | Command/shortcuts | Four capability presets using native model/thinking APIs; native editor and footer remain in control |

| Package | Source | Provides |
|---|---|---|
| `git:github.com/mitsuhiko/agent-stuff@0865c849befd2021490679f96a8dee58c84ac857` | Armin Ronacher | Eight selected skills only; all extensions/prompts/themes disabled. Files/todos tools and their patches are retired; existing todo data is preserved. |

Native bash follows shared `uv` guidance. The UV bash override and unreferenced
local interceptor shims are retired; instructions are policy, not a sandbox.

## Harness Maintenance

Claude and Pi setup, settings ownership, MCP, and runtime validation live in their
READMEs linked above. For OpenCode configuration, inspect `opencode/install.sh`
and its source JSON; the OpenCode appendix owns TUI-specific output conventions.
Codex and Gemini use the shared base without an appendix.

## Setup

`script/install` runs `ai/install.sh`. To apply only AI source changes:

```bash
~/.dotfiles/ai/install.sh
```

Documentation-only edits need no installation. For assembly/projection changes,
`sh ai/test-install.sh` validates disposable fixtures, including preservation of
user-owned files. Native skill discovery/frontmatter checks live in
`pi/test-native-skills.mjs`; they require the installed Pi host and current runtime
projection. These checks do not prove model behavior.
