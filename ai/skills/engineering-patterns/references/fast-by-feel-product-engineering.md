# Fast-by-Feel Product Engineering

Use this when building or reviewing user-facing workflows where perceived speed
matters: frontend interactions, sync flows, startup paths, command palettes,
real-time updates, offline-capable tools, or any product surface that currently
waits on network, broad rendering, or multi-step UI paths.

The principle is not "copy Linear" or "always build local-first." The principle
is: make the common successful path feel immediate, then reconcile correctness in
the background at a clear boundary.

## Core Heuristic

> If the user already gave valid intent, the interface should usually respond
> before the network answers.

Apply this only when you can name:

- the local state being updated
- the durable/server state it must reconcile with
- the failure mode if reconciliation rejects it
- the user-visible rollback, retry, or repair behavior
- the telemetry/test that proves the path is safe

If you cannot name those, keep the synchronous boundary explicit instead of
hiding it.

## Default Moves

| Goal | Prefer | Avoid |
|---|---|---|
| Immediate mutation feedback | optimistic local update + background commit | disabling the UI until a successful response |
| Fast startup | render cached/local data or an app shell first | fetch-auth-fetch-data before showing anything |
| Smooth real-time updates | update the smallest affected model/field/component | invalidating whole lists/pages for one changed field |
| Repeat use | cache assets/data likely to be needed next | refetching identical app/data on every navigation |
| Frequent actions | keyboard shortcut, command palette, contextual actions | burying common work behind menus/modals |
| Motion | transform/opacity, short durations, spatial origin | animating layout properties or decorative delays |

## Technical Guidance Without Over-Prescribing

### 1. Separate user-facing state from authority

For interactive products, the server/database may be authoritative without being
the thing every UI read blocks on.

Good shapes:

- in-memory state updated immediately, then persisted/reconciled
- IndexedDB/local storage cache hydrated before remote refresh
- optimistic mutation queue with retry/rollback semantics
- stale-while-revalidate views where old data is better than blank UI

Do not hide latency when the operation is high-risk, irreversible, rare, or
permission-sensitive unless the failure behavior is excellent.

### 2. Make reconciliation a named module

Fast-by-feel behavior becomes dangerous when it is scattered across components.
Put the hard behavior behind a deep module: `syncEngine`, `mutationQueue`,
`optimisticStore`, `localCache`, or equivalent.

That module should own:

- idempotency keys / client mutation IDs
- queue durability if reload/offline matters
- retry/backoff and conflict handling
- rollback or compensating updates
- server error classification
- observability for pending, failed, retried, and reverted mutations

Components should express intent; the module should hide the protocol.

### 3. Optimize first paint as a product path

Startup is a workflow, not just a bundle metric. Decide what the user should see
before the full app is ready.

Useful techniques:

- inline only the CSS/JS needed for the initial shell or loading state
- preload critical chunks/fonts with matching attributes so requests are reused
- code split by route/workflow and preload likely next paths
- cache stable assets with a service worker when repeat use matters
- render cached user/workspace data while validating auth/session later

Avoid turning this into cargo-cult optimization. Measure the current bottleneck
first: bytes, request waterfall, auth/data dependency, main-thread work, or
render invalidation.

### 4. Keep updates granular

Perceived speed often dies after the network is solved because one change causes
too much UI work.

Prefer state and rendering models where:

- a field change rerenders field-level dependents, not whole pages
- list updates preserve row identity and scroll position
- indexes/derived data are maintained close to the data store
- background sync applies deltas instead of replacing entire collections

### 5. Shorten the interaction path

A fast backend cannot save a slow input model. For high-frequency workflows,
count user steps as part of latency.

Prefer:

- one-keystroke command palette for broad actions
- visible shortcuts near menu items
- contextual default actions for the current selection
- mouse paths for discoverability, keyboard paths for mastery

### 6. Treat animation as performance work

Motion should clarify cause/effect and preserve responsiveness.

Defaults:

- animate `transform` and `opacity`
- avoid layout-triggering properties like `height`, `top`, `left`, `margin`, or
  `width` in hot UI paths
- make entry instant or near-instant for summoned UI
- keep exits short; do not block the next action on animation
- use spatial origin: popovers come from their trigger, panels from their edge

## Review Questions

Ask these during implementation or review:

1. What common user action currently waits on the network?
2. Can the UI safely show the expected result immediately?
3. Where is the authoritative reconciliation boundary?
4. What happens on rejection, timeout, reload, or offline use?
5. Are we rerendering more UI than the changed data requires?
6. Is the first useful paint blocked by auth, data, JS, CSS, or main-thread work?
7. Is a frequent workflow slow because of interaction steps rather than compute?
8. Are any animations consuming time without explaining state or spatial origin?

## Escape Hatches

Prefer explicit waiting when:

- the action transfers money, deletes important data, escalates permissions, or
  changes security/privacy state
- the optimistic result could mislead the user into taking harmful follow-up
  action
- conflicts are common and hard to explain
- the system lacks durable retry/rollback semantics
- the team cannot observe failed or reverted optimistic paths

Fast-by-feel engineering is a product contract. If the contract cannot be made
honest, show the wait clearly instead.
