# Effect in Mu Stack

Effect, formerly commonly called Effect-TS or EffectTS, is a project-level architecture choice. Prefer it from the start when its model matches the application; do not install it as a badge on ordinary TypeScript code.

## Adoption rubric

Effect is favored when several of these are central rather than incidental:

- Typed domain failures that callers must handle differently.
- Multiple services or infrastructure dependencies.
- Retries, timeouts, cancellation, scheduling, streaming, or structured concurrency.
- Resource acquisition and cleanup across asynchronous work.
- Long-running workflows, queues, agents, or durable processes.
- Boundary schemas shared across configuration, APIs, persistence, RPC, or AI tools.
- A strong need to swap service implementations in tests or across runtimes.
- Structured logs, traces, metrics, and failure causes that must compose with execution.

Plain TypeScript is favored when most of these are true:

- The project is primarily UI rendering or static content.
- It has few external boundaries and simple failure behavior.
- Ordinary promises, discriminated unions, and small explicit adapters remain clear.
- Effect would be isolated to a thin leaf with no compositional benefit.
- Contributors would carry a large learning cost for little operational gain.

Do not decide from project size alone. A small Worker coordinating several fallible services may benefit more than a large component library.

## Compare before adopting

Describe one representative workflow both ways:

| Concern | Plain TypeScript baseline | Effect candidate |
|---|---|---|
| Success and failures | Promise plus discriminated error result or exceptions | Typed success, error, and requirements channels |
| Dependencies | Explicit parameters or small service objects | Services and Layers |
| Validation | Existing schema/parser at the boundary | Effect Schema when it reduces duplication |
| Concurrency | Platform promises and abort signals | Structured concurrency, interruption, schedules |
| Resource lifetime | `try/finally`, disposables, framework lifecycle | Scoped acquisition and finalizers |
| Testing | Direct fakes around explicit interfaces | Test Layers and controlled runtimes |

Adopt Effect when the Effect version materially simplifies the whole workflow, makes failures or lifecycles harder to misuse, and will be used coherently across the service core.

## Architecture boundary

- Keep UI components and simple pure transformations idiomatic. They do not need to return `Effect` merely because the application uses Effect.
- Use Effect consistently in the service/workflow core where failures, dependencies, concurrency, and resources compose.
- Parse external data once at boundaries and expose named domain values internally.
- Define domain errors with stable tags and useful context. Do not collapse unrelated failures into strings.
- Provide concrete Layers at executable boundaries. Avoid rebuilding runtimes or duplicate Layer graphs per operation without a lifecycle reason.
- Run the program at a small number of application edges. Keep interop with framework handlers explicit.
- Prefer stable modules. Imports under `effect/unstable/*` require an explicit reason and an upgrade plan.

## Cloudflare considerations

Effect is a strong candidate for nontrivial Cloudflare Workers, Durable Objects, queues, workflows, and AI applications, but the Worker lifecycle remains authoritative.

- Model bindings and environment as explicit services.
- Decide whether services and runtimes are isolate-scoped or request-scoped based on their actual lifecycle.
- Connect cancellation and deadlines to request signals where possible.
- Use `ExecutionContext.waitUntil` deliberately for background work and flushes; do not assume Node-style process longevity.
- Verify stream behavior, cleanup, observability export, and Durable Object serialization in the real local/runtime path.
- Do not import Node-specific platform implementations into a Worker unless the compatibility boundary is intentional and tested.

## Version policy

Before installation, check Effect's current npm dist-tags, release notes, migration guide, and ecosystem package compatibility.

- Use the current stable major by default.
- Use a release candidate only for an explicit trial or when the user accepts prerelease churn.
- Keep related Effect ecosystem packages on compatible versions.
- If stable and next-major lines coexist, write the chosen line into project-local guidance rather than relying on global memory.

## First Effect slice

Choose one real vertical path with external input, a domain service, at least two distinct failures, and a testable runtime boundary. Include timeout or resource behavior only when genuine. Verify:

1. invalid input is rejected at the boundary;
2. failures remain distinguishable;
3. service implementations can be replaced in tests;
4. interruption and finalization behave as intended when the workflow actually uses them;
5. the production runtime adapter builds and runs.

If this slice is harder to understand and operate than the plain-TypeScript baseline, defer Effect instead of forcing adoption.

## Sources

- [Effect documentation](https://effect.website/docs/)
- [Effect repository and migration guides](https://github.com/Effect-TS/effect)
- [Effect Platform](https://effect.website/docs/platform/introduction)
- [Effect AI](https://effect.website/docs/ai/introduction)
