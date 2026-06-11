# Agent-Friendly Code Topology

Use this when choosing between otherwise reasonable implementation shapes,
especially on code that agents will maintain often: UI styling, component APIs,
route handlers, forms, data access, generated clients, configuration, and tests.

The principle is not "inline everything" or "use Tailwind." The principle is:
make the likely change path short, local, and obvious while still hiding real
complexity behind deep modules.

## Core Heuristic

> Prefer structures where related intent, constraints, and implementation are
> discoverable from the same small neighborhood of code.

An agent-friendly topology usually has:

- **High locality**: a focused change can be understood and edited in one place
  or a small set of predictable files.
- **Low indirection**: names and call paths reveal where behavior lives; agents
  do not need to chase aliases, generated glue, or framework trivia before
  acting.
- **Familiar primitives**: the code uses common, well-represented language,
  framework, or domain vocabulary where possible.
- **Small edit surfaces**: a typical change touches fewer files and fewer
  concepts.
- **Named boundaries**: when logic must be separated, the seam has a clear owner
  and interface instead of scattering policy across callers.

## Motivating Example: Styling Topology

For simple UI styling tasks, utility-first classes can be cheaper for agents
than separate stylesheet modules because the target element, style intent, and
implementation often live in the component markup. A change like "make this
button more compact" can be a one-file class edit.

With a split style topology, the agent may need to inspect both the component
and a stylesheet to understand which class maps to which element, whether the
selector is shared, and whether changing it has broader effects. That extra
navigation can become extra tool reads, assistant turns, tokens, and mistakes.

This does **not** mean Tailwind is universally better. Large utility strings,
inconsistent class composition, or duplicated variants can be worse than a deep
component or variant module. The useful lesson is locality and obviousness, not
a specific styling tool.

## Default Moves

| Goal | Prefer | Avoid |
|---|---|---|
| Local styling edits | obvious component classes, variant helpers, or colocated style ownership | style rules whose affected elements require cross-file detective work |
| Repeated component variants | `button({ variant, size })` or an equivalent deep component API | duplicated class strings or selector overrides across many callers |
| API access | typed client or small data module with named operations | ad hoc `fetch` calls with repeated URL, auth, parsing, and error logic |
| Forms | schema/field definitions that colocate validation, labels, and defaults | validation, UI copy, and submit mapping spread across unrelated files |
| Routes/workflows | vertical slice files or predictable route modules | handlers, loaders, view glue, and mutations hidden in unrelated utility folders |
| Tests | tests at the same seam callers use | brittle tests that require reading internals before changing behavior |

## Balance With Deep Modules

Locality is not the same as shallow code. Do not collapse useful modules just to
reduce file count. A deep module is agent-friendly when it hides meaningful
knowledge behind a small interface.

Good separation concentrates knowledge:

- a `Button` component owns focus, pressed, disabled, size, and variant rules
- an API client owns authentication, retries, parsing, and typed errors
- a form schema owns field validation and defaulting
- a sync module owns optimistic updates and reconciliation

Bad separation spreads knowledge:

- callers must coordinate several helpers in the right order
- style intent is split between class names, selectors, theme aliases, and
  overrides with no obvious owner
- every feature repeats the same parsing, validation, or error policy
- changing one product behavior requires edits in many generic utility files

Use the deletion test: if removing the abstraction makes the change path simpler
without pushing complexity into callers, it may be shallow. If removing it would
spread policy everywhere, keep or deepen it.

## Measuring Agent Cost

When evaluating two code shapes, measure accepted-change cost instead of only
subjective cleanliness.

Useful signals:

- number of files read before the edit
- number of files changed for the accepted result
- assistant/tool turns needed to complete the task
- tokens or provider cost, including cache reads/writes when relevant
- review corrections caused by missed indirection or hidden coupling
- whether the next similar change becomes easier or harder

Token totals are directional, not absolute. Provider pricing, caching,
harness behavior, session length, and model family can change the dollar impact.
Prefer small benchmarks on real tasks from the codebase.

## Review Questions

1. Where would a new agent start looking for this change?
2. Can the agent identify the right edit surface without reading unrelated
   plumbing?
3. Are intent, constraints, and implementation close enough to avoid guessing?
4. Does an abstraction hide real knowledge, or just force another file jump?
5. Would a common change touch one deep owner or many shallow callers?
6. Are names aligned with product/domain concepts or implementation trivia?
7. Can tests verify behavior at the same seam the agent is meant to edit?
8. Is any token/cost optimization trading away long-term correctness or human
   maintainability?

## Red Flags

- "Go look in three places before editing anything" conventions.
- Generic `utils`, `helpers`, or `styles` modules that own no clear domain.
- Wrapper abstractions whose only effect is to obscure familiar framework code.
- Repeated cross-file edits for simple product copy, styling, validation, or API
  changes.
- Clever indirection that humans remember but agents must rediscover every run.
- Choosing a tool solely for token cost without measuring accepted changes on
  real workflows.
