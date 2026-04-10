---
name: deslop
description: Run a focused pre-commit de-slop pass on nearly finished changes. Use when the code works but likely needs cleanup before commit, PR, or final review.
---

# Deslop

Use this skill after the change is functionally correct and before commit. The goal is not to reopen product design or expand scope. The goal is to remove avoidable AI-shaped slop: extra wrappers, weak type decisions, drift from repo rules, and cleanup debt that should not survive into the final diff.

## When to Use

- The feature works, but the diff still feels heavier than it should
- You want a final cleanup pass before commit or PR
- The user asks to “deslop”, simplify, tighten, or make the implementation feel more native to the repo
- You suspect overengineering, duplicate types, or instruction drift

## Goals

- Keep the smallest clear diff that still solves the problem
- Preserve behavior while improving readability and maintainability
- Catch type drift, duplicated source-of-truth decisions, and repo-conformance issues
- Prefer a few high-value fixes over a broad refactor

## Core Workflow

### 1) Build the context bundle

Before reviewing, gather the smallest set of files that gives reviewers enough truth to judge the change:

- repo-root instruction files such as `AGENTS.md`, `CLAUDE.md`, or equivalent
- nested instruction files relevant to the touched area
- the changed files plus nearby context
- relevant specs, plans, design docs, ADRs, or README sections
- canonical type/schema definitions when types are involved
- any current workplan or exec-plan if one exists

If a file does not exist, skip it. Prefer real local sources over memory.

### 2) Run 3 focused review passes

If the harness supports parallel reviewers, run these in parallel. Otherwise run them as three explicitly separate passes and keep the findings separated until synthesis.

#### Pass A — Rules and documentation conformance

Check:
- are we following repo instructions and documented ownership boundaries?
- did the implementation drift from nearby patterns without a strong reason?
- do names, file placement, and abstractions match the repo's normal style?

#### Pass B — Type safety and source of truth

Check:
- are canonical types, schemas, and contracts preserved?
- did we widen types, duplicate type definitions, or cast around uncertainty?
- did we validate data at the boundary instead of re-validating it everywhere downstream?

Bias:
- prefer compile-time guarantees over runtime defensive clutter in typed code
- validate or parse once at an untrusted boundary, then trust the inferred repo-owned type
- avoid creating “temporary” types when a canonical one already exists

#### Pass C — Overengineering and simplification

Check:
- did we write more code than needed?
- did we add wrappers, helpers, factories, or indirection without enough payoff?
- could the same behavior be expressed more directly?
- is there dead code, debug residue, placeholder text, or unnecessary branching?

### 3) Do local verification while reviews run

In parallel with the review passes, run the narrowest useful local checks for the touched area:

- if the repo defines `lint:slop:delta`, run it first to see only files whose slop score moved
- if the repo defines `lint:slop`, use it as the full baseline-vs-current slop gate
- formatter or lint check
- typecheck
- targeted tests
- repo-specific delta checks if the repo has them

Do not block delegation on finishing these first. The point is to overlap review and verification.

These commands are **repo-specific**, not bundled by this shared skill. When they do not exist, skip them and continue with the review vectors above.

### 4) Synthesize findings

Merge the three passes into one balanced report with these headings:

- `How did we do?`
- `Feedback to keep`
- `Feedback to ignore`
- `Plan of attack`

Prefer the balanced synthesis over any one reviewer's extreme take.

## What to Fix Automatically

Apply fixes immediately when they are clearly correct and stay inside scope, especially:

- duplicated or widened type definitions
- unnecessary casts or weak type fallbacks
- violations of documented repo boundaries
- dead helpers, dead code, or debug leftovers
- unnecessary wrappers or indirection that can be removed locally
- naming or placement fixes that clearly align with existing patterns

Leave feedback un-applied when it:

- is speculative
- conflicts across review passes
- expands scope beyond the ticket
- turns into a refactor unrelated to the user request

## Output Contract

When reporting a deslop pass, include:

- scope reviewed
- the 3 review vectors used
- key fixes applied
- any feedback intentionally ignored
- remaining risks or follow-ups, if any

If you changed code, make sure the final summary and any commit/PR text describe the post-deslop state, not the earlier draft state.

## Guardrails

- Do not turn deslop into an unrelated refactor
- Do not churn stable code outside the changed area just to make it prettier
- Do not keep defensive runtime checks that duplicate trusted typed boundaries without a concrete need
- Do not blindly apply every suggestion from every pass
- If a cleanup is subjective and not clearly better, leave it alone

## Minimal Checklist

Before finishing, confirm:

- behavior still matches the original intent
- the diff is smaller or clearer than before
- canonical types and boundaries remain intact
- docs/instructions are still followed
- verification still passes after cleanup
