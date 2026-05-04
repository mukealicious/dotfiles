---
name: upstream-review
description: Compare local artifacts with their upstream inspiration sources. Use when reviewing metadata.watch-sources, VENDORED_FROM.md, ai/watchlist.toml, bin/ai-watch output, or deciding whether upstream changes are worth adopting.
---

# Upstream Review

Review upstream provenance and drift in the context of this repo.

## Mental Model

`provenance -> optional review -> manual adopt`

- `metadata.watch-sources` and `VENDORED_FROM.md` preserve where a local artifact came from or what inspired it.
- `ai/watchlist.toml` is the optional batch list of upstream sources worth checking periodically.
- `bin/ai-watch` collects read-only upstream facts and links them to local artifacts.
- Adoption stays manual and explicit.

Do not edit files, install dependencies, vendor code, or sync upstream content as part of this skill.

## Workflow

### If the user names a local artifact

1. Inspect the artifact first.
2. If it is a directory, read its `VENDORED_FROM.md` when present.
3. If it is a frontmatter file, read `metadata.watch-sources` when present.
4. If no direct metadata exists, search nearby docs for upstream/source notes before using the watchlist.
5. Review only the relevant upstream source unless the user asks for a full watchlist pass.

### If the user asks for a full watchlist pass

1. Read `ai/watchlist.toml`.
2. Run `bin/ai-watch --json`.
3. Read the local artifacts referenced by `localMatches`.
4. For each watched source:
   - if linked via `metadata.watch-sources` or `VENDORED_FROM.md`, do semantic plus diff review
   - if unlinked, do high-level fit review
5. Return ranked recommendations for human review.

## Review Rules

For linked sources, assess:

- intent overlap
- structural drift
- whether upstream changes look meaningful or cosmetic
- whether local divergence appears intentional or stale
- whether upstream changed setup burden, dependencies, or safety posture

For unlinked sources, assess:

- fit with this repo's portable-first architecture
- whether the source suggests a reusable shared skill, script, or doc improvement
- whether adoption would increase supply-chain or maintenance risk

Do not stop at "useful" or "interesting." Explain whether the repo should stay as-is, partially adapt, or ignore the change.

## Output Contract

Return a ranked list using these labels:

- `Adopt now`
- `Worth adapting`
- `Interesting, not now`
- `Skip`
- `Risk notes`

For each relevant source include:

- source id, locator, or URL
- local artifact match, if any
- recommendation label
- concise rationale tied to this repo
- notable changed files when a pinned comparison exists

Keep the output concise. Prioritize decisions and risk over raw diff narration.

## Guardrails

- Never auto-adopt or sync upstream content
- Never overwrite local artifacts from watched sources
- Treat local drift as potentially intentional
- Prefer repo-authored shared workflows over harness-specific wrappers
- Flag supply-chain or setup burden increases clearly

This skill is intentionally instruction-only.
