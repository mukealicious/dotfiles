---
name: code-review
description: Review code changes proportionally for correctness, security, structure, and production risk. Use when reviewing a PR, recent commit, or uncommitted diff, or when the user explicitly invokes /skill:code-review.
references:
  - references/final-pass.md
  - ../codebase-design/SKILL.md
  - ../production-readiness/references/resilience-checklist.md
---

# Code Review

Review changes as an advisory, read-only workflow. The parent session or worker
owns fixes, integration, approvals, and final validation; reviewers do not edit,
commit, push, or create a PR.

## Workflow

1. Determine the review scope: a supplied PR, the uncommitted diff, or the
   requested recent commits. Read the changed files and enough surrounding code
   to verify each finding.
2. Scale the review to risk:
   - **Small, local, low-risk change:** use one reviewer.
   - **Substantial, cross-module, or higher-risk change:** use two or three
     reviewers with distinct lenses such as correctness, security, structure,
     or production behavior.
   - Add a specialist security, production-readiness, or codebase-design lens
     only when the change crosses that risk boundary. There is no mandatory
     fourth architecture pass.
3. Correlate evidence-backed findings by severity. Confirm or dismiss findings
   against the surrounding code instead of reporting speculation.
4. Run the [final-pass checklist](references/final-pass.md) before returning the
   report. Use [codebase-design](../codebase-design/SKILL.md) vocabulary for
   structural/interface findings and
   [production-readiness](../production-readiness/references/resilience-checklist.md)
   for service, data, async, deployment, or external-dependency risk.
5. Return a concise unified report. Findings include severity, exact path and
   line when available, evidence, and a suggested fix. State what was not
   verified.

## Severity

- **Critical:** data loss, security breach, or system failure.
- **High:** likely production bug or broken contract.
- **Medium:** conditional correctness, maintainability, or operational risk.
- **Low:** minor improvement or non-blocking suggestion.

## Review principles

- Be certain: investigate before flagging.
- Review public behavior and contracts, not just implementation style.
- Prefer the smallest clear fix and preserve local ownership boundaries.
- Keep findings advisory; confirmed fixes return to the parent or worker.
