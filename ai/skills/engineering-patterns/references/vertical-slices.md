# Vertical Slices

A vertical slice proves a useful path end to end with the smallest coherent
surface area. It is the default unit for agentic implementation because it
reveals integration risks early.

## Shape

A good first slice:

- starts from a real caller or user-visible entry point;
- crosses the important seams: UI/API, domain logic, persistence, external I/O;
- handles one narrow happy path and one important failure path;
- has verification that exercises the full path;
- leaves breadth, polish, and edge-case expansion for later slices.

## When Planning

1. Name the riskiest assumption.
2. Choose the smallest end-to-end path that validates or invalidates it.
3. List what is intentionally excluded.
4. Define the interface that later breadth will reuse.
5. Add follow-up slices only after the first slice works.

## Slice Examples

| Broad request | First vertical slice |
|---|---|
| Add file import | Import one valid file type through UI/API, persist one record, show result |
| Add notifications | Send one notification from one event with idempotency and logging |
| Add dashboard | Show one real metric from production-shaped data with loading/error states |
| Add payment flow | Create one test-mode checkout path and handle one webhook event |
| Add search | Index one entity type and return basic ranked results |

## Anti-Patterns

- Building database schema, API, UI, and tests as separate phases with no usable
  path until the end.
- “Framework first” work that proves only folder structure.
- A slice that is so thin it avoids the risky seam.
- Expanding to all entities, all states, or all providers before one path works.
- Treating mock-only demos as validation of integration.

## Output Pattern

When proposing a slice, write:

```markdown
First slice: <narrow path>
Risk proven: <assumption or integration risk>
Includes: <entry point, core logic, persistence/I/O, verification>
Excludes for now: <breadth intentionally deferred>
Next slices: <ordered follow-ups>
```
