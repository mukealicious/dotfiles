# Resilience Checklist

## Integration Points

- Does every outbound call have connect and read/deadline timeouts?
- Are retries bounded with exponential backoff and jitter?
- Is the operation safe to retry? If not, is there an idempotency key or
  dedupe mechanism?
- Can one slow dependency exhaust the whole process, worker pool, or connection
  pool?
- Is there a fallback, degraded mode, or clear fail-fast response?

## Load And Capacity

- What resource saturates first: CPU, memory, DB connections, queue depth, file
  handles, browser tabs, third-party quota?
- Is there a limit on result size, pagination, queue growth, and concurrency?
- Has the expected peak and a 2x spike path been considered?
- Are expensive operations rate-limited or protected from self-denial attacks?

## Observability

- Are logs structured and correlated with request/job IDs?
- Are success, error, latency, and saturation metrics emitted where useful?
- Can an operator tell whether the dependency is down, slow, or returning bad
  data?
- Is there enough context to debug without exposing secrets?
- Are alerts tied to user-facing symptoms or error-budget burn?

## Deployment And Rollback

- Can the change be hidden behind a flag or progressive rollout?
- Is rollback faster than debugging forward?
- Are old and new code compatible during deploy?
- Are database migrations expand/contract safe?
- Are background jobs and webhooks version-tolerant?

## Health Checks

- Is there a shallow liveness check?
- Is there a deeper readiness check for required dependencies?
- Do health checks avoid making the outage worse by hammering dependencies?
