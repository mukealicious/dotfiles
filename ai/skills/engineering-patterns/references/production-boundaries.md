# Production Boundaries

Any module that crosses I/O, network, persistence, queue, filesystem, process,
browser, or third-party seams needs explicit production behavior. Even in small
features, name the boundary contract early.

## Boundary Checklist

- **Timeouts**: what can hang, and how long do we wait?
- **Retries**: what is safe to retry, with what backoff and jitter?
- **Idempotency**: what happens if the same request/event runs twice?
- **Backpressure**: what happens when downstream cannot keep up?
- **Partial failure**: what degraded behavior is acceptable?
- **Observability**: what logs, metrics, traces, or audit events expose health?
- **Capacity**: what resource is likely to saturate first?
- **Data integrity**: what invariant must survive failure and concurrency?
- **Rollback**: can deploy and release be separated? Can the change be disabled?

## Stability Patterns

| Risk | Pattern |
|---|---|
| Slow or failed dependency | timeout, circuit breaker, fail-fast behavior |
| Retry storms | retry budget, exponential backoff, jitter |
| One dependency draining all resources | bulkhead, separate pools, queue limits |
| Duplicate external events | idempotency key, dedupe table, transactional outbox |
| Unknown health | shallow and deep health checks, RED/USE metrics |
| Risky rollout | feature flag, canary, blue-green, expand/contract migration |

## Data Boundaries

For persistence and data systems, name:

- system of record;
- derived data that can be rebuilt;
- consistency requirement;
- transaction boundary;
- migration path;
- retention and deletion behavior;
- stale-read tolerance;
- failure recovery path.

## Review Prompt

For any external boundary, ask:

```markdown
Boundary: <dependency or seam>
Invariant: <what must remain true>
Failure mode: <timeout/error/duplicate/stale data/etc.>
Current handling: <what code does now>
Missing production behavior: <specific gap>
```
