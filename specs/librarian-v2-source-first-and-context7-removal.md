# Librarian v2 + Context7 Removal — ADR / Implementation Spec

**Status:** Proposed
**Type:** Architecture decision / workflow refactor
**Effort:** M
**Date:** 2026-04-17

## Context

The current shared librarian workflow is still shaped around a docs-first model:

- known library questions start with `context7`
- source fetch is treated as a fallback for deeper investigation
- `grep_app` and `opensrc` are present, but they are not the primary investigation path

That made sense when Context7 was the preferred quick path for library usage and API questions. It no longer fits the repo's current preferences or risk posture.

This repo prefers:

- vendored guidance over new third-party installs when possible
- real source inspection over generic docs summaries when understanding implementation behavior
- shared, portable guidance that does not assume a specific vendor tool will always exist
- explicit provenance and manual control over persistent external context

Recent research into `better-context` / `btca` reinforced that the interesting part is **not** the package itself, especially while it is being rewritten. The durable lessons are architectural:

1. separate **discovery** from **investigation**
2. prefer **source-first** investigation for internals and behavior questions
3. ground answers in a concrete resource set, not a generic docs layer
4. reuse fetched source when repeated investigation is likely
5. hide tool choreography behind a stable research workflow

This ADR adopts those principles without adopting `btca` itself.

## Discovery

Explored current repo surfaces that encode librarian behavior and Context7 assumptions:

- `ai/skills/librarian/SKILL.md`
- `ai/skills/librarian/references/tool-routing.md`
- `ai/skills/opensrc/SKILL.md`
- `AGENTS.md`
- `CLAUDE.md`
- `claude/install.sh`
- `opencode/opencode.json`

Key findings:

1. **Current librarian is docs-first for known libraries.**
   - `ai/skills/librarian/SKILL.md` routes “How does X work?” to `context7` first, then `opensrc` only if internals are needed.
   - `ai/skills/librarian/references/tool-routing.md` mirrors this throughout the decision tree and anti-patterns.

2. **The repo already has the primitives needed for a btca-like workflow.**
   - `grep_app` is already the broad GitHub discovery surface.
   - `opensrc` already supports local fetched source context, scratch mode, and project mode.
   - `ai/skills/opensrc/SKILL.md` already encodes a portable fetch-and-inspect workflow.

3. **Context7 is embedded in both guidance and configuration.**
   - Shared docs: `AGENTS.md`, `CLAUDE.md`, librarian skill, routing references.
   - Managed config: `claude/install.sh`, `opencode/opencode.json`.

4. **Context7 removal needs both source cleanup and local migration cleanup.**
   - Stopping future installs is not enough.
   - Existing user-scope MCP registrations may remain in Claude Code and Codex unless explicitly removed.

5. **The repo currently lacks a clear evidence standard for external library answers.**
   - Librarian guidance encourages linking, but it does not yet consistently require source-backed evidence such as repo identity, ref/version when known, file citations, and key snippets.

## Decision

Adopt **Librarian v2** as a **source-first external code investigation workflow**, and remove Context7 completely from repo-managed guidance and configuration.

### Decision summary

1. **Remove Context7 from this repo's managed setup and shared guidance.**
2. **Promote `opensrc` to the default investigation path** once a concrete package/repo target is known.
3. **Keep `grep_app` as discovery infrastructure** for broad GitHub search and cross-repo pattern scouting.
4. **Shift shared librarian guidance from tool-first wording to capability-first principles**, while still documenting the current concrete implementation with `grep_app` and `opensrc`.
5. **Require source-grounded evidence** for Librarian v2 answers whenever the task is investigative rather than purely exploratory.
6. **Include a one-time migration path** for removing legacy local Context7 MCP registrations.

## Principles Adopted from better-context / btca

These are the learnings worth keeping even though the package itself is not being adopted:

### 1. Source-first for explanation and internals
If a question is about:

- implementation behavior
- architecture
- call flow
- extension points
- edge cases
- exported internals
- how competing libraries differ in practice

then the default path should be:

`identify target -> fetch source -> read entrypoints/docs in repo -> trace implementation -> answer with evidence`

### 2. Discovery and investigation are different phases
- **Discovery** = find the right package/repo or gather candidate examples across GitHub.
- **Investigation** = deeply inspect a chosen source tree.

For Librarian v2:

- `grep_app` remains the main discovery surface.
- `opensrc` becomes the main investigation surface.

### 3. Evidence should come from the chosen source, not just the search surface
Once a concrete target is selected, `grep_app` can still help with comparison or discovery, but final reasoning should be grounded primarily in:

- fetched source
- repo README/docs/examples/tests
- package metadata / entrypoints
- cited implementation files

### 4. Persistence should be intentional
Repeated investigations benefit from persistence, but one-off exploration should not pollute the repo.

For Librarian v2:

- default to **scratch mode** via `.context/opensrc/<slug>/` for exploratory work
- use **project mode** when persistent external source context is likely to be reused by the project

### 5. Users should ask research questions, not orchestrate tools
The user should ask:

- “How does X work?”
- “Compare X vs Y.”
- “Where is Y implemented?”

The agent should decide whether the task needs:

- broad discovery
- source fetch
- file tracing
- cross-repo comparison
- architecture visualization

## Consequences

### Positive

- Librarian answers become more trustworthy for implementation questions.
- Shared guidance better matches the repo's vendoring and supply-chain posture.
- The repo stops depending on a docs-first MCP that is configured via `@latest` installs.
- The distinction between GitHub-wide discovery and repo-local investigation becomes clearer.
- The workflow becomes closer to btca's durable strengths without taking on btca's current rewrite risk.

### Negative

- Some simple library-usage questions may require more work than a docs-first path.
- Repo-local docs, examples, and tests become more important, which may be weaker than curated docs for some projects.
- Agents will need stronger routing guidance to avoid unnecessary source fetches for trivial questions.
- Context7-specific convenience for API lookup is deliberately lost.

### Neutral observations

- `grep_app` remains valuable and should not be removed.
- `opensrc` becomes more central, but it is not a replacement for discovery.
- This is mostly a guidance and workflow architecture change, not a major new tool adoption.

## Scope & Deliverables

| Deliverable | Effort | Depends On |
|-------------|--------|------------|
| D1. Rewrite shared librarian guidance around a source-first workflow | M | - |
| D2. Remove Context7 references from shared docs and managed config | S | D1 |
| D3. Add migration cleanup guidance for legacy local Context7 MCP registrations | S | D2 |
| D4. Align high-level agent docs with Librarian v2 principles and evidence standards | S | D1 |

## Non-Goals

- Adopting `better-context` / `btca` itself while it is being rewritten.
- Building a persistent resource registry or named-resource system in this repo.
- Replacing `grep_app` with a local-only workflow.
- Eliminating all non-source research paths for every question type.
- Reworking Claude-specific subagent model pins or wrapper-specific behavior.
- Adding new MCP servers as part of this change.

## Workflow Contract for Librarian v2

### Query classes

#### A. Understand / explain a concrete library or repo
Default flow:

1. Identify the concrete target package or repo.
2. Fetch source with `opensrc`.
3. Read high-signal files first:
   - `README.md`
   - `package.json`
   - entrypoints / exports
   - examples / tests if relevant
4. Trace implementation via grep / AST / targeted file reads.
5. Answer with grounded citations.

Use GitHub-wide discovery only when the concrete target is unclear.

#### B. Find a pattern or implementation across the ecosystem
Default flow:

1. Use GitHub-wide search to identify candidate repos.
2. Select 1-N promising targets.
3. Fetch chosen targets with `opensrc`.
4. Compare real implementations from source.

#### C. Explore architecture / structure of a repo
Default flow:

1. Fetch source.
2. Read tree + key entrypoints.
3. Trace subsystems.
4. Synthesize architecture with cited file references.

#### D. Compare libraries
Default flow:

1. Fetch both/all target libraries.
2. Read comparable entrypoints and implementation files.
3. Use broader search only if additional ecosystem examples materially improve the answer.
4. Answer with a comparison table grounded in fetched source.

## Evidence Standard

For investigative answers, Librarian v2 should aim to include:

- package or repo identity
- version or ref when known
- file citations for key claims
- code snippets for non-obvious implementation claims
- explicit note when an answer is based on README/examples/tests versus core implementation

This standard does **not** apply rigidly to early-stage discovery prompts where the goal is simply to find promising candidates.

## Portability Contract

Shared librarian guidance should be written in **capability-oriented language**:

- “GitHub-wide code search” rather than assuming one specific MCP exists forever
- “fetch source context” rather than binding the concept to one harness-specific integration model

Implementation notes may still document the current concrete mapping used in this repo:

- broad discovery -> `grep_app`
- source fetch / inspection -> `opensrc`

This keeps the shared layer durable while still being actionable.

## Context7 Removal Plan

### Repo-managed source changes

Remove Context7 from:

- `ai/skills/librarian/SKILL.md`
- `ai/skills/librarian/references/tool-routing.md`
- `AGENTS.md`
- `CLAUDE.md`
- `claude/install.sh`
- `opencode/opencode.json`

### Managed behavior changes

- `claude/install.sh` must stop adding the user-scope `context7` MCP server.
- `opencode/opencode.json` must stop defining the `context7` MCP entry.
- Shared docs must stop describing `context7` as part of librarian/oracle behavior.

### Local migration cleanup

Because legacy local registrations may already exist, document or perform one-time cleanup:

#### Claude Code

```bash
claude mcp remove --scope user context7
```

If this repo continues to own Claude MCP setup, it is acceptable for the installer to attempt this idempotently during migration.

#### Codex

```bash
codex mcp remove context7
```

Codex cleanup is documented as a manual step unless/until Codex config becomes repo-managed.

#### OpenCode

No separate cleanup command is required if the repo-managed `opencode/opencode.json` is the active source of truth and the `context7` entry is removed there.

## Alternatives Considered

| Option | Pros | Cons | Why Not |
|--------|------|------|---------|
| Keep Context7 and only tweak librarian wording | Lowest effort | Leaves docs-first bias and `@latest` MCP install in place | Does not solve the core architecture mismatch |
| Replace Context7 with btca now | Most similar to the researched future model | High rewrite risk, larger install surface, more moving parts | Poor timing; unnecessary for the behavior we want |
| Remove Context7 and make librarian source-first | Matches repo preferences, uses existing primitives, avoids new install risk | Slightly more work for some API questions | **Chosen** |
| Remove both Context7 and `grep_app`, rely only on `opensrc` | Very simple conceptual model | Weakens discovery and broad comparison | Over-corrects; discovery still matters |

## Acceptance Criteria

- [ ] Shared librarian guidance no longer routes known-library understanding questions to Context7 first.
- [ ] Shared librarian guidance clearly distinguishes discovery from investigation.
- [ ] Librarian v2 defaults to source fetch and source reading once a concrete target is known.
- [ ] `AGENTS.md` and `CLAUDE.md` no longer describe Context7 as part of the librarian/oracle toolchain.
- [ ] `claude/install.sh` no longer adds the `context7` MCP server.
- [ ] `opencode/opencode.json` no longer contains a `context7` MCP entry.
- [ ] The migration plan includes explicit local cleanup instructions for already-installed Context7 registrations.
- [ ] Librarian v2 guidance defines an evidence standard for source-backed answers.

## Test Strategy

| Layer | What | How |
|-------|------|-----|
| Docs review | Shared behavior change | Search repo for stale `context7` references in shared librarian/docs surfaces |
| Config review | Managed setup removal | Verify `claude/install.sh` and `opencode/opencode.json` no longer configure Context7 |
| Workflow review | Source-first routing | Inspect librarian skill + routing docs for fetch-first behavior on known concrete targets |
| Migration review | Local cleanup coverage | Confirm Claude and Codex cleanup instructions are documented |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Source-first guidance becomes too heavy for trivial questions | Medium | Low | Keep discovery lightweight and allow concise repo-local docs/examples reads before deep tracing |
| Shared guidance becomes too abstract to execute | Medium | Medium | Use capability-oriented principles plus concrete implementation mapping to `grep_app` and `opensrc` |
| Claude legacy Context7 registrations remain on machines after source cleanup | High | Low | Include explicit cleanup commands and optionally an idempotent removal in Claude installer migration |
| Removing Context7 causes loss of quick usage answers for some libraries | Medium | Medium | Encourage README/examples/tests as first source-backed stop before deeper implementation tracing |

## Trade-offs Made

| Chose | Over | Because |
|-------|------|---------|
| Source-first librarian workflow | Docs-first with source fallback | The repo values real implementation understanding and lower supply-chain dependence |
| Keep `grep_app` for discovery | Pure fetched-source workflow | Broad discovery and ecosystem comparison still matter |
| Capability-oriented shared guidance | Tool-name-only shared guidance | Shared instructions should endure even if concrete tool choices evolve |
| Remove Context7 completely | Partial deprecation | Partial removal leaves stale assumptions and config drift |

## Open Questions

- [ ] Should `claude/install.sh` only stop adding Context7, or also proactively remove legacy user-scope Context7 registrations during migration? → Owner: repo maintainer
- [ ] After Librarian v2 lands, is a small helper reference for “source investigation checklist” useful, or is the skill itself enough? → Owner: repo maintainer

## Success Metrics

- Shared research guidance in this repo no longer depends on Context7.
- Librarian is clearly source-first for concrete implementation questions.
- Discovery and investigation are described as separate phases.
- Repo-managed config no longer reinstalls Context7 after `dot` runs.
- A future revisit can understand not only **what** changed, but **why** the repo chose source-first investigation over docs-first convenience.
