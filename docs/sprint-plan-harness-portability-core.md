# Sprint Plan: Harness Portability Core

**Created:** 2026-03-12
**Total Sprints:** 4
**Total Tasks:** 16

## Overview

Establish a neutral, cross-harness AI capability architecture that starts with **portable skills** authored once in `ai/skills/` and surfaced into both `.agents/skills/` and `.claude/skills/` without making either runtime format the source of truth. Use Sprint 1 to prove the pattern with one simple skill, then incrementally migrate a real shared skill, introduce harness-aware instructions, and validate the shared-agent-body pattern with a small exemplar. The primary portability boundary remains shared instructions plus shared skills; harness-native agents are optional.

## Global Context For Fresh Sessions

Every sprint handoff should assume the agent starts with **no memory of prior discussion**. The following decisions are already settled unless the user explicitly changes them:

- Keep the top-level repo structure as `ai/`, `claude/`, `pi/`, and `opencode/`.
- `ai/` is the shared cross-harness authoring layer.
- Portable skills are authored in `ai/skills/`.
- `.agents/skills/` and `.claude/skills/` are **runtime output formats**, not sources of truth.
- Neither Codex-style nor Claude-style skill directories should be treated as primary.
- Harness-specific overlays are allowed only when a capability genuinely needs them.
- Pi- and Claude-native runtime integrations should stay native (`pi/extensions/`, `claude/hooks/`, etc.).
- Harness-native `agents/` formats are optional ergonomics, not the default portability mechanism for every harness.

Current repo state at planning time:

- `docs/harness-aware-capabilities-plan.md` is the architecture doc.
- `ai/install.sh` currently projects shared skills into Claude and OpenCode-oriented locations, but not into `.agents/skills/`.
- `ai/install.sh` currently gives Codex only an instructions symlink, not a shared skill runtime directory.
- Pi discovers shared skills from `ai/skills/` through `pi/settings.json`.
- `claude/skills/sprint-plan/SKILL.md` is currently Claude-specific and should be treated as a migration candidate, not as the neutral source of truth.

## Fresh-Session Handoff Model

Each sprint has a companion handoff brief that is intended to be pasted into or referenced from a fresh agent session.

- Sprint 1 handoff: `docs/handoffs/harness-portability-core-sprint-1.md`
- Sprint 2 handoff: `docs/handoffs/harness-portability-core-sprint-2.md`
- Sprint 3 handoff: `docs/handoffs/harness-portability-core-sprint-3.md`
- Sprint 4 handoff: `docs/handoffs/harness-portability-core-sprint-4.md`

## Sprint 1: Prove Shared Skill Portability
**Demoable:** A simple portable skill is authored once in `ai/skills/`, projected into both `.agents/skills/` and `.claude/skills/`, and documented as the neutral cross-harness pattern.
**Handoff:** `docs/handoffs/harness-portability-core-sprint-1.md`

### 1.1: Document the portable skill contract
- **Description:** Make the authoring/runtime rule explicit: portable skills are written in `ai/skills/`, while `.agents/skills/` and `.claude/skills/` are runtime output formats.
- **Validation:** The architecture docs clearly state that neither runtime directory is primary and use consistent wording across the repo.
- **Files:** `docs/harness-aware-capabilities-plan.md`, `ai/README.md`

### 1.2: Add `.agents/skills/` runtime projection
- **Description:** Update the shared installer flow so portable skills can be surfaced into `.agents/skills/` for Codex-style discovery, mirroring the current shared-to-Claude projection pattern.
- **Validation:** Running the install flow creates or refreshes `.agents/skills/<name>/` entries for shared skills without breaking existing installs.
- **Files:** `ai/install.sh`

### 1.3: Keep `.claude/skills/` projection neutral
- **Description:** Refactor the Claude skill projection comments and structure so they clearly represent one runtime output of the shared source, not the canonical authoring location.
- **Validation:** Installer output and comments show shared skills projected first and harness-specific overlays applied second.
- **Files:** `ai/install.sh`, `ai/README.md`

### 1.4: Add one tiny reference skill
- **Description:** Create one deliberately simple, portable skill with no harness-specific primitives to exercise the cross-harness path end to end.
- **Validation:** The skill exists only once under `ai/skills/`, contains no Claude-only or Pi-only behaviors, and is visible through both runtime skill directories after install.
- **Files:** `ai/skills/<new-portable-skill>/SKILL.md`, `ai/README.md`

## Sprint 2: Extract a Real Shared Planning Skill
**Demoable:** `sprint-plan` has a shared core in `ai/skills/`, while any remaining harness-specific behavior is isolated to thin adapters or overlays.
**Handoff:** `docs/handoffs/harness-portability-core-sprint-2.md`

### 2.1: Audit portability blockers in `sprint-plan`
- **Description:** Review the current Claude-only `sprint-plan` skill and identify every assumption that is tied to Claude-specific routing, commands, or tool behaviors.
- **Validation:** A short portability audit lists each blocker and labels it as shared logic, Claude-only glue, or obsolete behavior.
- **Files:** `claude/skills/sprint-plan/SKILL.md`, `docs/sprint-plan-harness-portability-core.md`

#### Sprint 2 portability audit

- **Shared logic:** clarification questions, demoable sprint breakdowns, atomic single-commit tasks, validation criteria, and markdown output.
- **Claude-only glue:** slash-command framing, `oracle` subagent review, and `TaskCreate` conversion for Sprint 1.
- **Obsolete behavior:** treating file writes and task conversion as mandatory parts of the skill instead of optional follow-up actions.

### 2.2: Create a harness-neutral `sprint-plan` core
- **Description:** Rewrite the planning workflow into a shared skill that focuses on clarifying scope, creating demoable sprints, enforcing atomic tasks, and producing a reusable markdown plan.
- **Validation:** The shared skill contains no Claude-only primitives such as `subagent_type`, `TaskCreate`, or slash-command assumptions.
- **Files:** `ai/skills/sprint-plan/SKILL.md`

### 2.3: Reduce Claude `sprint-plan` to an adapter
- **Description:** Keep only the optional Claude-specific glue that still adds value, or remove the wrapper entirely if the shared skill is sufficient on its own.
- **Validation:** Claude-specific behavior is clearly separated from the shared planning logic and can be deleted later without losing the core skill.
- **Files:** `claude/skills/sprint-plan/SKILL.md`, `ai/README.md`

### 2.4: Document the shared-vs-adapter policy for skills
- **Description:** Add guidance for when a skill should live in `ai/skills/` versus when a thin harness-specific overlay is justified.
- **Validation:** The docs provide a simple decision rule and include `sprint-plan` as the canonical example.
- **Files:** `ai/README.md`, `docs/harness-aware-capabilities-plan.md`

## Sprint 3: Add Harness-Aware Instructions
**Demoable:** Shared instructions are authored once, then assembled into harness-specific instruction files with minimal appendices for Claude, Pi, OpenCode, and Codex/Conductor.
**Handoff:** `docs/handoffs/harness-portability-core-sprint-3.md`

### 3.1: Define the instruction composition contract
- **Description:** Write down what belongs in the shared instruction base versus what belongs in per-harness appendices.
- **Validation:** The docs include a clear composition rule and at least one example of shared versus harness-specific instruction content.
- **Files:** `docs/harness-aware-capabilities-plan.md`, `ai/README.md`

### 3.2: Extract a shared instruction base
- **Description:** Move the neutral instruction content into a shared base file that can be reused by every harness.
- **Validation:** The shared base excludes harness-specific provider/tooling advice and is suitable for all supported runtimes.
- **Files:** `ai/instructions/base.md`, `ai/install.sh`

### 3.3: Add minimal harness appendices
- **Description:** Create small appendices for Claude, Pi, OpenCode, and Codex/Conductor that capture only the genuinely harness-specific policy and behavior.
- **Validation:** Each appendix is short, additive, and avoids duplicating the shared base.
- **Files:** `claude/instructions/appendix.md`, `pi/instructions/appendix.md`, `opencode/instructions/appendix.md`, `ai/install.sh`

### 3.4: Assemble and verify installed instruction files
- **Description:** Add the assembly/install logic for harness-specific instruction outputs and document how to verify each installed result.
- **Validation:** Running the install flow produces the expected final instruction file for each harness without manual copying.
- **Files:** `ai/install.sh`, `ai/README.md`

## Sprint 4: Validate the Shared Agent Pattern
**Demoable:** One read-only exemplar agent is split into a shared body plus harness-specific metadata, proving the pattern as an optional harness-native layer without migrating every agent at once.
**Handoff:** `docs/handoffs/harness-portability-core-sprint-4.md`

### 4.1: Confirm the shared-agent contract
- **Description:** Lock down the rule that shared agent role/task text belongs in `ai/agents/`, while harness-specific metadata and optional appendices live beside each harness.
- **Validation:** The docs describe the split cleanly and identify one low-risk exemplar agent to migrate first.
- **Files:** `docs/harness-aware-capabilities-plan.md`, `ai/README.md`

### 4.2: Extract one shared agent body
- **Description:** Move the read-only `review` agent body into `ai/agents/` as a shared source without changing its core role or guidance.
- **Validation:** The shared body contains no harness-specific frontmatter and reads as a neutral capability definition.
- **Files:** `ai/agents/review.body.md`, `claude/agents/review.frontmatter`

### 4.3: Add harness-specific metadata for the exemplar
- **Description:** Create the harness-specific frontmatter and optional appendix files needed to assemble `review` for Claude and Pi.
- **Validation:** The assembled outputs preserve the shared body while differing only where models, tool names, or harness caveats require it.
- **Files:** `claude/agents/review.frontmatter`, `pi/agents/review.frontmatter`, `docs/harness-aware-capabilities-plan.md`

### 4.4: Add managed assembly and cleanup logic
- **Description:** Introduce the small helper logic needed to replace existing symlinked agents with assembled managed files safely and repeatably.
- **Validation:** Installer logic removes stale symlinks or generated files safely, writes assembled outputs atomically, and does not overwrite repo source files.
- **Files:** `ai/install.sh`, `pi/install.sh`, `ai/lib/assemble.sh`

## Notes

- **Sprint 1 is the proof point.** If Sprint 1 feels awkward, the architecture should be simplified before migrating more skills.
- **The first shared skill should stay intentionally boring.** The goal is to validate discovery and packaging, not to solve every harness quirk at once.
- **`sprint-plan` is the first real migration candidate, not the first proof-of-concept skill.**
- **OpenCode and Pi should consume the neutral skill output path that best matches their native discovery behavior, but the authored source remains `ai/skills/`.**
