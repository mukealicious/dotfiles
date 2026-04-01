---
name: watch-review
description: Interpret watched upstream sources against this repo's local artifacts and rank whether they should be adopted or adapted. Use when reviewing `ai/watchlist.toml`, running `bin/ai-watch`, or deciding whether upstream changes are worth bringing in.
---

# Watch Review

Review watched upstream sources in the context of this repo's local artifacts.

## Goal

Use the portable Watch workflow:

`watch -> review -> adopt`

- `watch` collects structured upstream facts
- `review` evaluates relevance and drift
- `adopt` stays manual and explicit

Do not edit files, install dependencies, or vendor code as part of this skill.

## Workflow

1. Read `ai/watchlist.toml`.
2. Run `bin/ai-watch --json`.
3. Read the local artifacts referenced by `localMatches`.
4. For each watched source:
   - if linked via `metadata.watch-sources`, do semantic plus diff review
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

For each watched source include:

- source id
- upstream locator or URL
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

This skill is intentionally instruction-only in v1.
