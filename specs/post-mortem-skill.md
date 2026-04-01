# Post-Mortem Skill - Implementation Spec

**Status:** Ready for task breakdown
**Type:** Feature plan / skill adaptation
**Effort:** M
**Date:** 2026-03-31

## Problem Statement

This repo wants a shared `post-mortem` skill that helps agents analyze conversations, identify what worked and what failed, and recommend durable improvements to the local agent setup.

An upstream version already exists at `walterra/agent-tools/packages/post-mortem`, but using it unchanged would leave several gaps:

1. it points at Cursor-specific configuration surfaces such as `.cursorrules` and `.cursor/skills/`
2. it does not reflect this repo's shared instruction architecture in `ai/instructions/` and `ai/skills/`
3. it does not acknowledge adjacent local artifacts such as Pi extensions and packages that may also be valid improvement targets
4. it has no linkage to the new Watch model for future upstream comparison

Without a repo-adapted version, agents doing retrospectives will recommend the wrong files, miss local architecture boundaries, and fail to improve the places this dotfiles repo actually uses to shape agent behavior.

## Discovery

- Explored upstream `walterra/agent-tools/packages/post-mortem/SKILL.md`.
- Explored local architecture in `ai/README.md`, `pi/README.md`, and `specs/watch-system.md`.
- Confirmed the shared-skill model in this repo centers on:
  - `ai/skills/` for portable skills
  - `ai/instructions/base.md` plus harness appendices for shared instructions
  - `claude/skills/` and `pi/extensions/` only when runtime-specific behavior is required
- Confirmed the user wants light Watch integration and wants Pi extensions and related agent-facing artifacts to remain in scope for recommendations when relevant.
- Confirmed input modes should all be first-class in v1:
  - current session
  - local export file
  - remote URL
- Confirmed approved recommendations should be applied directly only after explicit user confirmation.

## Recommendation

Adapt the upstream `post-mortem` skill into a portable shared skill in `ai/skills/post-mortem/`.

Keep the core value of the upstream skill - analyze a session, identify root causes, and recommend durable improvements - but rewrite the repo-specific parts so they target the actual authoring surfaces in this dotfiles repo.

The adapted skill should stay instruction-only in v1, with no scripts or extra dependencies. It should:

- analyze the current conversation, a local export, or a URL
- review how local instructions, shared skills, and agent-facing repo artifacts shaped the outcome
- produce concrete recommendations tied to real files in this repo
- stop for approval before editing
- apply approved changes directly after approval
- include `metadata.watch-sources` so future Watch reviews can compare the local skill to its upstream inspiration

This is the right balance of reuse and adaptation: the upstream concept is strong, but the repo-specific guidance needs to be local.

## Scope & Deliverables

| Deliverable | Effort | Depends On |
|-------------|--------|------------|
| D1. Create `ai/skills/post-mortem/SKILL.md` with adapted frontmatter and repo-specific instructions | S | - |
| D2. Replace Cursor-centric references with this repo's actual authoring surfaces and decision rules | S | D1 |
| D3. Define the output and approval workflow for recommendations and approved edits | S | D1 |
| D4. Add lightweight Watch linkage via `metadata.watch-sources` | S | D1 |
| D5. Validate wording against existing shared-skill conventions and install flow docs | S | D1, D2, D4 |

## Non-Goals

- Creating the `watch-review` skill in this slice
- Implementing `ai/watchlist.toml` or `bin/ai-watch` in this slice
- Adding scripts, packages, or runtime-specific dependencies to `post-mortem`
- Turning `post-mortem` into a Pi-only or Claude-only skill
- Making the skill edit files without explicit user confirmation
- Retrospecting arbitrary repo history outside the provided conversation or export

## Data Model

### Skill Location

- Authoring source: `ai/skills/post-mortem/SKILL.md`
- Runtime projection handled by existing `ai/install.sh`

### Frontmatter

Required fields:

```yaml
---
name: post-mortem
description: Analyze a session to identify successes, failures, and improvement opportunities in this repo's agent instructions, skills, and related AI-facing configuration. Use when the user asks for a post-mortem, retrospective, session analysis, or wants to improve agent behavior based on past interactions.
metadata:
  watch-sources: walterra/agent-tools/packages/post-mortem@ef2ef41
---
```

### Input Modes

The skill must support three inputs:

1. **Current session** - default when no external source is provided
2. **Local export file** - JSON, markdown, or text chat export
3. **Remote URL** - shared chat export retrieved over the network

### Improvement Targets

The skill may recommend changes to any agent-facing local artifact that materially affects agent behavior in this repo, including:

- `ai/instructions/base.md`
- `claude/instructions/appendix.md`
- `pi/instructions/appendix.md`
- `opencode/instructions/appendix.md`
- `ai/skills/*/SKILL.md`
- `claude/skills/*/SKILL.md` when a Claude-only overlay is genuinely required
- `pi/extensions/*` and `pi/packages/*` when the issue is Pi-runtime-specific
- nearby AI architecture docs such as `ai/README.md` or `pi/README.md` when documentation gaps are causal

The skill should prefer the narrowest authoring surface that actually owns the fix.

## API / Interface Contract

### Invocation Contract

The skill should activate when the user asks for:

- a post-mortem
- a retrospective
- a session analysis
- help improving agent behavior based on a prior interaction

### Workflow Contract

#### Phase 1: Load the input

1. If no external source is given, analyze the current conversation.
2. If a local path is given, read the export file.
3. If a URL is given, fetch the export and analyze it.

#### Phase 2: Analyze the interaction

The skill should identify:

- successful patterns
- failures and root causes
- missed opportunities
- user friction points
- tool selection issues
- unclear instructions, missing context, or missing workflow guidance

#### Phase 3: Map findings to local repo surfaces

The skill should decide where a fix belongs by checking the local architecture:

- shared behavior -> `ai/instructions/base.md` or `ai/skills/`
- harness-specific behavior -> the relevant appendix or overlay location
- Pi-runtime behavior -> `pi/extensions/`, `pi/packages/`, or Pi docs when appropriate
- documentation confusion -> the narrowest doc that explains the affected workflow

The skill should avoid recommending broad repo edits when a narrow authoring surface is sufficient.

#### Phase 4: Present recommendations

The skill must present:

- what went well
- what went wrong
- root causes
- file-specific recommendations
- rationale for each recommendation

It should favor concrete changes over vague advice.

#### Phase 5: Stop for approval

Before editing anything, the skill must stop and ask the user to review the recommendations.

The confirmation step should clearly distinguish:

- analysis findings
- proposed file changes
- what will happen if the user approves

#### Phase 6: Apply approved changes

If the user explicitly approves the recommendations, the agent may edit the approved files directly in the same flow.

The skill should not require a second planning pass after approval unless the approved changes materially expand scope.

## Output Contract

The analysis output should include these sections in substance, even if headings vary by harness:

- what went well
- key issues
- root causes
- recommended file changes
- approval checkpoint

The recommendations should be specific enough that an implementation agent can immediately act on them after approval.

## Acceptance Criteria

- [ ] `ai/skills/post-mortem/SKILL.md` exists as a shared skill with valid frontmatter.
- [ ] The skill targets this repo's real authoring surfaces rather than `.cursorrules` or `.cursor/skills/`.
- [ ] The skill supports current-session, local-file, and remote-URL analysis.
- [ ] The skill allows recommendations to include Pi extensions and related Pi package surfaces when those are the correct fix location.
- [ ] The skill instructs the agent to stop for approval before editing files.
- [ ] The skill instructs the agent to apply approved edits directly after explicit approval.
- [ ] The skill includes `metadata.watch-sources` linking back to its upstream source.
- [ ] The skill remains portable and shared, with no runtime-specific dependencies or scripts in v1.

## Test Strategy

| Layer | What | How |
|-------|------|-----|
| Frontmatter | Skill validity | Validate `ai/skills/post-mortem/SKILL.md` against the Agent Skills frontmatter rules |
| Activation | Trigger wording | Review description and examples to ensure the skill should trigger on post-mortem and retrospective requests |
| Content review | Repo targeting | Read the finished skill and confirm it references `ai/instructions/`, `ai/skills/`, and relevant Pi surfaces instead of Cursor-specific files |
| Behavior smoke | Approval step | Run a post-mortem request and confirm the agent stops before editing |
| Behavior smoke | Approved edit flow | Approve recommendations and confirm the resulting workflow allows direct edits without re-specifying the plan |
| Watch linkage | Upstream association | Confirm `metadata.watch-sources` is present and uses the agreed locator format |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| The adapted skill remains too Cursor-shaped | Medium | Medium | Rewrite examples and target surfaces around this repo's actual architecture |
| The skill becomes too broad and recommends edits everywhere | Medium | Medium | Instruct it to choose the narrowest authoring surface that owns the fix |
| Pi-specific issues get ignored because the skill stays too AI-skill-centric | Medium | Medium | Explicitly include Pi extensions and packages as valid recommendation targets when causal |
| The skill over-couples to Watch before Watch exists | Low | Low | Keep Watch integration limited to `metadata.watch-sources` and future-facing awareness |
| Approval behavior becomes ambiguous | Medium | High | Make the stop-for-approval phase explicit and mandatory in the instructions |

## Trade-offs Made

| Chose | Over | Because |
|-------|------|---------|
| Shared portable skill | Harness-specific implementations | The core workflow should work across Claude, Pi, OpenCode, Codex, and similar tools |
| Direct edit flow after approval | Analysis-only output | The user wants approved recommendations to be actionable immediately |
| AI-facing repo scope plus relevant Pi surfaces | Shared AI files only | Some failures may be rooted in Pi extensions or packages, not just skill text |
| Light Watch linkage | Deep Watch dependency now | The skill should stand on its own before the broader Watch system exists |

## Open Questions

- [ ] Should v2 add a standard output rubric for recommendation severity such as `high-confidence` vs `exploratory`? -> Owner: repo maintainer
- [ ] Should future post-mortems be able to compare a local skill against its `watch-sources` automatically when the conversation is about a watched artifact? -> Owner: repo maintainer

## Success Metrics

- A post-mortem request points to real local files in this repo rather than generic third-party defaults.
- The skill can analyze live sessions and external exports with the same overall workflow.
- Approved recommendations can be applied in the same conversation without re-planning the task.
- The skill remains small, portable, and dependency-free.
- Future Watch reviews can recognize the local skill's upstream association through `watch-sources`.
