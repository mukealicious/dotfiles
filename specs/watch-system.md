# Watch System - Implementation Spec

**Status:** Ready for task breakdown
**Type:** Feature plan / workflow architecture
**Effort:** L
**Date:** 2026-03-31

## Problem Statement

This repo increasingly benefits from selectively learning from external repositories, especially agent-skill repos, dotfiles repos, and adjacent tooling experiments.

Today that workflow is mostly manual and memory-based:

1. notice an interesting upstream repo or skill
2. inspect it ad hoc
3. decide whether to vendor, adapt, or ignore it
4. later forget where it came from or whether upstream changed

That creates three recurring problems:

- **Discovery is noisy** - upstream repos contain many changes that are not relevant to this repo.
- **Comparison is shallow** - once a local skill exists, it is easy to ask "is upstream useful?" but harder to ask "what changed relative to our adapted version?"
- **Provenance drifts** - local artifacts lose the lightweight link back to the external sources that informed them.

The Watch system solves this by introducing a portable workflow:

`watch -> review -> adopt`

Where:

- **watch** tracks selected external repos and paths for inspiration
- **review** uses an agent to summarize meaningful upstream changes in the context of this project
- **adopt** remains a manual decision to vendor or adapt selected ideas locally

## Discovery

- Explored `ai/README.md`, `ai/install.sh`, `bin/dot`, `bin/dot-doctor`, and `specs/ai-skill-runtime-and-opensrc-fixes.md`.
- Shared skills are already projected across runtimes from `ai/skills/`, so Watch should prefer repo-authored shared workflows over harness-specific logic.
- The repo prefers vendoring and adaptation over installation when supply-chain risk is avoidable.
- Existing repo conventions favor deterministic scripts for system behavior and documented human judgment for higher-level choices.
- The user explicitly prefers:
  - portable-first design
  - manual invocation by default
  - semantic + diff-based review
  - minimal supply-chain risk
  - one lightweight local association field instead of a rigid provenance taxonomy

## Recommendation

Implement Watch as a two-layer portable system:

1. **Deterministic collection layer**
   - A tracked watchlist manifest defines which external sources matter.
   - A read-only script fetches structured facts about those sources and links them to local artifacts via `watch-sources` when present.

2. **Agent interpretation layer**
   - A shared `watch-review` skill runs the script, reads local artifacts and upstream source context, and produces ranked recommendations.
   - The skill never auto-installs or auto-adopts anything.
   - Adoption remains a manual, explicit follow-up action.

This keeps the system safe and automatable without pretending that source relevance can be decided by a shell script alone.

## Scope & Deliverables

| Deliverable | Effort | Depends On |
|-------------|--------|------------|
| D1. Define portable Watch manifest and source locator format | S | - |
| D2. Add `watch-sources` metadata contract for local artifacts that support inline metadata | S | D1 |
| D3. Implement `bin/ai-watch` read-only source collection and report generation | M | D1, D2 |
| D4. Create shared `ai/skills/watch-review/SKILL.md` to interpret watch reports | M | D3 |
| D5. Document `watch -> review -> adopt` in repo docs and skill-authoring guidance | S | D1, D4 |

## Non-Goals

- Automatic installation of third-party skills or packages
- Automatic syncing or overwriting of local artifacts from upstream
- Scheduled or background polling in v1
- Non-GitHub source hosts in v1
- A rigid provenance taxonomy such as `adopted-from` vs `adapted-from`
- Pi-specific package linking in the first slice
- CI enforcement or failure states based on watch results

## Data Model

### 1. Watchlist Manifest

Tracked file:

- `ai/watchlist.toml`

Purpose:

- defines which external sources this repo watches
- acts as the single source of truth for collection scope
- is human-editable and portable across projects

### Manifest shape

```toml
version = 1

[[sources]]
id = "post-mortem"
repo = "walterra/agent-tools"
path = "packages/post-mortem"
branch = "main"
kind = "skill"
review = "semantic-diff"
notes = "Shared retrospective skill candidate"

[[sources]]
id = "openai-skills"
repo = "openai/skills"
path = ""
branch = "main"
kind = "repo"
review = "pattern-scan"
notes = "General inspiration source"
```

### Manifest field definitions

| Field | Required | Meaning |
|-------|----------|---------|
| `version` | yes | manifest schema version |
| `sources[].id` | yes | stable local identifier for CLI filtering and reporting |
| `sources[].repo` | yes | GitHub repo in `owner/repo` form |
| `sources[].path` | yes | watched subpath within the repo; empty string means repo root |
| `sources[].branch` | yes | branch to inspect, usually `main` |
| `sources[].kind` | yes | source type: `skill`, `repo`, `docs`, `topic`, `package`, `other` |
| `sources[].review` | no | preferred review mode hint; default `semantic-diff` |
| `sources[].notes` | no | human explanation of why this source is watched |

### 2. Local Artifact Association Metadata

Local artifacts may opt into direct Watch comparison with one metadata field when their file format supports lightweight inline metadata cleanly.

Example:

```yaml
metadata:
  watch-sources: walterra/agent-tools/packages/post-mortem@ef2ef41
```

If multiple sources matter:

```yaml
metadata:
  watch-sources: |
    walterra/agent-tools/packages/post-mortem@ef2ef41
    anthropics/skills/some-skill@abc1234
```

### `watch-sources` semantics

- It is an association field, not a provenance classification.
- It tells Watch review which external sources should be compared directly against this local artifact.
- It allows drift: a local artifact may evolve beyond upstream while still remaining meaningfully associated with it.
- If multiple entries exist, the first entry is treated as the primary comparison source.
- In v1, direct inline association is only required for frontmatter-friendly artifacts such as `SKILL.md`.
- Non-frontmatter artifacts can still be watched via `ai/watchlist.toml` even if they do not yet support direct file-level association.

### 3. Source Locator Format

Portable compact format:

```text
owner/repo/path@ref
```

Examples:

```text
walterra/agent-tools/packages/post-mortem@ef2ef41
openai/skills@main
anthropics/skills/code-review@abc1234
```

Parsing rule:

- first two path segments are the repo: `owner/repo`
- remaining path, if any, is the watched subpath
- `@ref` is required in `watch-sources`
- manifest entries use structured fields instead of the compact locator

### 4. Watch Report

Generated by `bin/ai-watch`.

Two output modes:

- human-readable markdown to stdout by default
- JSON with `--json` for machine and skill consumption

Minimum JSON shape:

```json
{
  "generatedAt": "2026-03-31T12:00:00Z",
  "manifest": "ai/watchlist.toml",
  "sources": [
    {
      "id": "post-mortem",
      "repo": "walterra/agent-tools",
      "path": "packages/post-mortem",
      "branch": "main",
      "kind": "skill",
      "head": {
        "sha": "ef2ef41",
        "title": "Latest relevant commit title",
        "committedAt": "2026-03-20T10:00:00Z"
      },
      "localMatches": [
        {
          "artifact": "ai/skills/post-mortem/SKILL.md",
          "watchSource": "walterra/agent-tools/packages/post-mortem@d34db33",
          "pinnedRef": "d34db33"
        }
      ],
      "comparison": {
        "mode": "semantic-diff",
        "fromRef": "d34db33",
        "toRef": "ef2ef41",
        "changedFiles": [
          "SKILL.md",
          "README.md"
        ]
      }
    }
  ]
}
```

## API / Interface Contract

### `bin/ai-watch`

Purpose:

- read `ai/watchlist.toml`
- inspect local artifacts that may declare `watch-sources`
- fetch upstream metadata from GitHub via `gh`
- emit a report that connects watched sources to local artifacts when direct associations exist

### CLI contract

```text
bin/ai-watch
bin/ai-watch --json
bin/ai-watch --source post-mortem
bin/ai-watch --kind skill
```

### CLI behavior

- default output is concise markdown for humans
- `--json` outputs a structured report for `watch-review`
- `--source <id>` narrows to one watched source
- `--kind <kind>` filters by source kind
- exits non-zero only for true failures:
  - invalid manifest
  - malformed `watch-sources`
  - GitHub fetch failure that prevents report generation
- never edits repo files
- never installs dependencies
- never writes state in v1

### Upstream collection rules

For each manifest source:

1. resolve repo, path, and branch
2. fetch current branch head SHA
3. fetch basic source metadata
4. if local artifacts reference that source:
   - parse pinned refs from `watch-sources`
   - compute changed files between pinned ref and current head when possible
5. include enough context for an LLM to review relevance without doing redundant discovery

### `watch-review` skill

Path:

- `ai/skills/watch-review/SKILL.md`

Purpose:

- interpret the report from `bin/ai-watch`
- compare upstream watched sources to local repo artifacts
- rank recommendations for human review

### `watch-review` workflow contract

1. read `ai/watchlist.toml`
2. run `bin/ai-watch --json`
3. inspect relevant local artifacts and docs
4. for each watched source:
   - if linked via `watch-sources`, do semantic + diff review
   - if unlinked, do high-level fit review
5. return ranked recommendations using this rubric:
   - `Adopt now`
   - `Worth adapting`
   - `Interesting, not now`
   - `Skip`
   - `Risk notes`

### Semantic + diff review rules

If a local artifact links to a watched source, the review must consider:

- intent overlap
- structural drift
- meaningful upstream instruction or implementation changes
- whether local divergence looks intentional or stale
- whether upstream changed dependencies, setup burden, or safety posture

The review should not stop at "this is useful." It should compare implementation shape and recommend whether the local version should stay as-is, partially adapt, or be ignored.

## Acceptance Criteria

- [ ] `ai/watchlist.toml` defines watched sources in a human-editable, portable format.
- [ ] A local artifact can associate itself to one or more upstream sources with exactly one metadata field: `watch-sources`.
- [ ] `watch-sources` works as either a single string or multiline string.
- [ ] `bin/ai-watch --json` emits a report that links watched sources to matching local artifacts based on `watch-sources` when direct associations exist.
- [ ] For a watched source that maps to a pinned local source ref, the report includes current upstream head and changed file paths between pinned ref and current head when GitHub can provide them.
- [ ] For a watched source with no local mapping, the report still includes enough upstream context for high-level usefulness review.
- [ ] `ai/skills/watch-review/SKILL.md` consumes the watch report and returns ranked recommendations without editing files.
- [ ] The repo documents the workflow as `watch -> review -> adopt`.
- [ ] No part of the v1 system auto-installs, auto-vendors, auto-commits, or schedules background checks.

## Test Strategy

| Layer | What | How |
|-------|------|-----|
| Schema | Manifest validity | Parse sample `ai/watchlist.toml` and reject missing required fields |
| Parser | `watch-sources` parsing | Test single-line and multiline metadata parsing against fixture skills |
| Integration | GitHub source inspection | Run `bin/ai-watch --json` against a small sample manifest and verify report shape |
| Integration | Source-to-artifact linking | Add fixture metadata and verify local match resolution |
| Integration | Comparison range | For pinned refs behind upstream head, verify changed file list is populated |
| Skill smoke | `watch-review` output contract | Run the skill on a sample report and verify rubric sections are present |
| Docs review | Workflow consistency | Search repo docs for `watch -> review -> adopt` and `watch-sources` references |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Manifest becomes too abstract or verbose for casual use | Medium | Medium | Keep required fields minimal; push nuance into optional `notes` and `review` |
| `watch-sources` format becomes ambiguous | Low | Medium | Standardize `owner/repo/path@ref` and validate strictly |
| GitHub-only v1 feels limiting | Medium | Low | Keep manifest naming generic; make transport pluggable later |
| Review becomes noisy for large repos | Medium | Medium | Allow `path` scoping, `--source` filtering, and kind filtering from day one |
| Local drift gets misread as a bug | Medium | Medium | Review rules must treat divergence as potentially intentional, not automatically stale |
| Report generation duplicates too much LLM discovery work | Medium | Low | Include structured changed files, refs, and local match metadata so review starts informed |

## Trade-offs Made

| Chose | Over | Because |
|-------|------|---------|
| Portable-first Watch model | Dotfiles-only naming and structure | The pattern is strong enough to reuse across projects later |
| One association field `watch-sources` | Fine-grained provenance taxonomy | Association is what review needs most; provenance nuance can wait |
| Manual invocation in v1 | Scheduled checks from day one | Lower complexity, lower noise, and safer adoption |
| GitHub + `gh` in v1 | Host-agnostic fetch layer in v1 | This repo already relies on GitHub and `gh`; optimize for reality first |
| Read-only script + agent review | Script-only scoring or auto-sync | Relevance ranking is contextual and better handled by an LLM |

## Open Questions

- [ ] Should v2 add comment pragmas or another lightweight association mechanism for non-frontmatter files such as Pi extension code and shell scripts? -> Owner: repo maintainer
- [ ] Should `bin/ai-watch` later support persistent snapshots or cache for "since last review" reporting, or is pinned-ref comparison enough for v1? -> Owner: repo maintainer

## Success Metrics

- Adding a watched source takes less than five minutes and requires editing only `ai/watchlist.toml`.
- A local shared skill can express upstream comparison context with one metadata field.
- A manual Watch review identifies meaningful upstream changes without suggesting unsafe auto-adoption.
- Reviewing a small watchlist produces a concise ranked recommendation set instead of a raw change dump.
- The Watch pattern remains generic enough to reuse in another project with minimal renaming.
