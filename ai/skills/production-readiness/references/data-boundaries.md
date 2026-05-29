# Data Boundaries

## Invariants

Name the invariant before choosing the mechanism.

Examples:

- an order is charged at most once;
- account balance never goes negative;
- webhook event is processed once per external ID;
- a derived search index may lag but can be rebuilt;
- deleted user data is not reintroduced by async jobs.

## Consistency

- What must be strongly consistent?
- What can be eventually consistent?
- What stale-read behavior is acceptable?
- Is the database isolation level strong enough for the invariant?
- Could write skew, duplicate delivery, or out-of-order events violate the rule?

## Transactions And Async Work

- Keep transaction boundaries explicit.
- Avoid distributed transactions unless the system already owns that complexity.
- Prefer transactional outbox or idempotent sagas for cross-system workflows.
- Workers should tolerate duplicate, delayed, and reordered messages.

## Migrations

- Use expand/contract for live systems:
  1. add new schema in a backward-compatible way;
  2. deploy code that writes both or reads both;
  3. backfill;
  4. switch reads;
  5. remove old schema later.
- Keep migrations reversible when possible.
- Avoid long locks on hot tables.

## Derived Data

- Identify the system of record.
- Identify derived stores: caches, indexes, reports, materialized views.
- Document how derived data is rebuilt.
- Treat cache invalidation and replay logic as production behavior, not cleanup.
