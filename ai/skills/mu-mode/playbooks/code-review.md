# Code Review

## Contract

Return prioritized, evidence-backed findings on the requested changes. Review is advisory and read-only: reviewers do not edit, commit, push, or open a PR. The parent or implementing agent owns fixes, integration, approvals, and final validation.

Load these principle modules:

- [Minimize Reader Load](../principles/minimize-reader-load.md)
- [Boundary Discipline](../principles/boundary-discipline.md)
- [Prove It Works](../principles/prove-it-works.md)

Load [Code Review](../../code-review/SKILL.md) for the review workflow, proportional reviewer count, severity, final-pass checklist, and report requirements. Do not duplicate or replace that specialist's workflow here. Use [Composition and Checkpoints](../references/composition-and-checkpoints.md) for continuity and handoffs.

## Focus the review

Establish the requested PR, commit range, or working-tree scope and preserve unrelated changes. Inspect the diff and enough surrounding code to verify the behavioral contract and each potential finding. Separate a reproducible issue from an assumption or preference.

Choose additional lenses only for actual risks: Codebase Design for structural/interface issues, Production Readiness for service/data/async/deployment failures, and Impeccable for frontend experience. Load [Hunk Review](../../hunk-review/SKILL.md) only for a requested or existing interactive Hunk review; do not launch an interactive UI by default.

Use only non-mutating specialist workflows in this route. If required setup or a selected workflow would write files (for example, Impeccable's teach step or Hunk's Markdown-editing workflow), skip that workflow and report the limitation; do not bypass its prerequisites or weaken the read-only contract. Any needed edits belong to the parent in a separately authorized route. Delegation tools are optional mechanics, not a reason to add reviewers beyond the specialist's risk-based guidance.

## Hand back findings

Correlate overlapping findings and verify them against the real artifact. Return the specialist's concise unified report with severity, location, evidence, suggested correction, and what was not verified. If there are no findings, say so with the review scope and limitations rather than inventing issues or declaring universal correctness.

A small review needs no phase ceremony. For a substantial review, propose coherent scope/risk checkpoints rather than a handoff per file. Stop at agreed boundaries with evidence and the recommended next focus.

Fixing findings is not implicit in a review-only request. If the user has also authorized fixes, the parent may transition to the appropriate route after the review handback and any agreed checkpoint; a delegated reviewer remains read-only.
