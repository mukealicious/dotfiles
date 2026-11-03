---
name: production-readiness
description: Review production resilience for explicit readiness or reliability reviews, or changes with concrete risks to availability, data integrity, or recovery, such as destructive migrations, retry semantics, or rollout safety.
metadata:
  watch-sources: |
    wondelai/skills/release-it@eff8b3cab2d9afab9dc09c4cc04e80ad9641db29
    wondelai/skills/ddia-systems@eff8b3cab2d9afab9dc09c4cc04e80ad9641db29
references:
  - references/resilience-checklist.md
  - references/data-boundaries.md
---

# Production Readiness

Use this review for explicit readiness or reliability assessments, or when a
change creates a concrete risk to production availability, data integrity, or
recovery. Name that risk before expanding the review; routine boundary edits
follow the project’s normal implementation and validation workflow.

## Workflow

1. **Name the boundary.** Identify every external dependency, persistent store,
   async path, migration, and deployment gate touched by the change.
2. **State invariants.** What must remain true under retries, concurrency,
   partial failure, stale reads, or duplicate events?
3. **Check resilience.** Use
   [resilience-checklist.md](./references/resilience-checklist.md) for
   timeouts, retries, circuit breakers, bulkheads, backpressure, observability,
   rollout, and rollback.
4. **Check data.** Use [data-boundaries.md](./references/data-boundaries.md)
   for consistency, transactions, migrations, idempotency, derived data, and
   rebuild paths.
5. **Return risks first.** Findings should identify concrete production failure
   modes and the smallest change that controls each one.

## Output Format

```markdown
### Production Readiness
Verdict: ready | needs changes | not ready

Risks:
- [severity] <failure mode> — <specific fix>

Boundary notes:
- <dependency/store/job>: invariant, timeout/retry/idempotency/observability notes

Verification:
- <tests/checks/load/smoke/rollback exercises run or recommended>
```

## Principles

- Every outbound call needs a timeout.
- Retries require idempotency, backoff, jitter, and a retry budget.
- A dependency failure should not drain unrelated resources.
- Alert on user-visible symptoms and SLO burn, not just machine discomfort.
- Deploy and release should be separable when blast radius matters.
- Data outlives code: protect invariants, migrations, and rebuild paths.
