---
name: uncomplect
description: Pressure-test a stateful system or replacement design through Rich Hickey's simplicity and complection, Greg Young's deletability, Ousterhout's deep modules, DDD boundaries, typed effects, explicit lifecycle modeling, and Lauren Tan's agent-sized context. Use when the user asks "what would Rich Hickey do", "optimize for deletion", "make this simpler", "define this error out of existence", "review this state machine", "design it twice", or wants to replace a working prototype without preserving its accidental architecture.
metadata:
  watch-sources: joelhooks/skills/skills/uncomplect@022f29cbfa2ddd36916622d49c02b763060f6847
basis:
  - https://github.com/matthiasn/talk-transcripts/blob/master/Hickey_Rich/SimpleMadeEasy-mostly-text.md
  - https://www.youtube.com/watch?v=1FPsJ-if2RU
  - https://web.stanford.edu/~ouster/cgi-bin/book.php
  - https://www.domainlanguage.com/ddd/reference/
  - https://effect.website/docs/
  - https://stately.ai/docs/
  - https://x.com/poteto/status/2102050467505430555
  - https://github.com/joelhooks/rat-stack/blob/main/VISION.md
---

# Uncomplect

Treat the current system as a functional prototype. It proves which behavior matters; it does not prove its structure was right. Keep the behavior and the evidence, and let the accidental structure go.

The goal is fewer braided concerns, not fewer lines. A replacement that adds a type and deletes three special cases is simpler. A replacement that adds a layer and deletes nothing is not.

## Read first

Recommendations built on guesses about the code tend to fix a system that does not exist, so ground every one in what you read. Start with the nearest project instructions, decisions, source, tests, runtime receipts, and current incidents.

For state-machine code, read the machine, the persisted state, the restoration path, invoked actors, guards, and transition tests. For effect-system code, read the project's pinned version and its existing service, error, retry, and transaction boundaries, and check APIs against that version's source.

You are done when every recommendation names the fact it rests on, the behavior it preserves, and the complexity it deletes.

## Hickey: separate what was braided

Complection is two independent concerns woven together so that neither can change alone. Build a table of them:

| Concern | What is braided together? | Independent values | Separation move |
| --- | --- | --- | --- |

Common braids:

- value mixed with time;
- identity mixed with changing state;
- behavior mixed with storage or transport;
- behavior mixed with the interface that reaches it, so the same rule is rewritten for the CLI, the HTTP route, and the agent tool;
- policy mixed with mechanism;
- current truth mixed with historical facts;
- lifecycle state mixed with domain data;
- retry policy mixed with business failure;
- one generic status hiding distinct facts.

Prefer immutable values and pure functions. Define a behavior once, with its input, output, and failures as types, and derive each interface from that definition. Historical facts stay true, but they report what happened; they do not decide what happens next.

## Ousterhout: make the interface deep

A deep module hides a hard problem behind a small interface. Judge a design by change amplification, cognitive load, and unknown unknowns.

For every proposed type, state, service, interface, or configuration value, ask:

1. What complexity does this element remove?
2. Does it hide a hard problem behind a small interface?
3. Can the API define an accidental error or special case out of existence?
4. Does it pull complexity into one module, or spread policy across callers?
5. What can we delete after adding it?

Infrastructure that adds names without removing dependencies or obscurity makes the system harder to read, so leave it out.

For consequential replacements, design it twice. Sketch two materially different interfaces, then compare caller burden, hidden knowledge, dependencies, failure semantics, and what each one deletes before choosing.

## Young: optimize for deletion

Greg Young's [The Art of Destroying Software](https://www.youtube.com/watch?v=1FPsJ-if2RU) argues for small programs you can replace when their model stops fitting reality. Replacement is cheap only when a unit carries everything it needs and nothing else reaches into it.

Ask:

1. Could this module be rewritten from its contracts, tests, and receipts within about a week?
2. If not, which dependency, hidden invariant, or shared state makes it dangerous to replace?
3. Does the unit own its own configuration, storage, and infrastructure, so that removing it removes all of them?
4. If you pull it out, does the rest still build, with the compiler naming every place that used it?
5. Can a new implementation shadow the old one behind the same seam?
6. What becomes deletable after cutover?

The one-week horizon is a pressure test. Small replaceable units can share one process and one repository; splitting services is a different decision.

## DDD: put authority in the right boundary

Name the bounded contexts and their trust boundaries, in domain language rather than storage language.

Identify:

- the aggregate that owns each invariant;
- immutable facts versus current decisions;
- commands, events, policies, and read models;
- upstream and downstream contract ownership;
- translation at context boundaries;
- terms that hide several domain meanings.

A read model (DDD's projection) can report a decision, but only the aggregate that owns the invariant makes it. When a dashboard or cache starts deciding, two places now own the truth.

Model a workflow as a command plus current facts that produce explicit events. The pure workflow returns events; publishing and persisting them are separate effects.

## Typed effects: keep the pure core pure

An effect system earns its place at effectful boundaries. Pure rules written in effect syntax look sophisticated and hide their simplicity.

- Keep domain decisions as pure functions over tagged values.
- Decode untrusted input at the boundary, so everything inside works with parsed domain types.
- Put database, network, filesystem, clock, configuration, and provider work behind named services.
- Model expected failures as typed errors, and keep defects separate.
- Retry only typed transient failures, and only when the operation is proven idempotent.
- Keep provider calls outside authoritative database transactions.
- Use one effect-system version per workflow.

If the project has no compatible effect system at this boundary, plain language-native code is the simpler choice. A framework migration presented as a simplification is a different project.

## Lifecycle: make essential time visible

Use an explicit state machine when modes change which events are legal, or when the work needs cancellation, retries, resumability, or child work. Parsing, validation, and one-shot migrations are plain functions.

- States represent modes with different allowed events.
- Context holds minimal actor data, not copies of the state label.
- Guards are pure and synchronous.
- Effects live in invoked actors or boundary services.
- Normalize persisted state before it gets current authority.
- A transient computation does not need a durable state.
- Restoration tests cross version and deployment boundaries.

A small machine fed validated domain values beats a large one that interprets raw rows.

## Agent-sized context: make the separation stick

Agents copy the patterns they find. A separation that exists only in one reviewer's head will be braided again by the next change. Lauren Tan's [Dune](https://x.com/poteto/status/2102050467505430555) is built so that "the shortcut, the easy path, is the right path for agents." Her ladder for where a correction lives, hardest first, is the codebase, static analysis, rules, skills, and the style guide.

For each separation you propose:

1. Give each concern one named place, such as a folder, a package, or a type, so the tree shows where code runs and which imports are legal.
2. Choose the highest rung that can hold it: a type or API that makes the braid impossible to write, then a lint rule or import boundary, and only then a written rule.
3. Keep one paved path. When two ways to do the same thing exist, delete one.

A narrow edit in one file should keep the whole system correct. If it cannot, the context an agent needs is too large, and that is a design problem.

## Replacement pass

Work through this sequence:

1. **Essential behavior**: what the prototype proves and must preserve.
2. **Complection map**: what is braided today.
3. **Domain map**: contexts, aggregate, invariants, commands, events, read models.
4. **Deep seam**: the smallest public operation that can hide the unavoidable complexity.
5. **Effect boundary**: pure core, typed failures, effectful adapters, transaction edge, retry owner.
6. **Lifecycle**: the smallest state machine that still makes time explicit.
7. **Rewrite horizon**: what keeps this unit from being replaced within about a week.
8. **Deletion list**: states, flags, exceptions, operator steps, and modules the replacement removes.
9. **Fence**: the type, lint rule, or boundary that keeps each separation from coming back.
10. **Adoption path**: tracer, shadow comparison, cutover, and rollback without two sources of authority.
11. **Unknowns ledger**: known facts, known unknowns, unknown knowns, suspected unknown unknowns.

This is a reasoning checklist. Combine items when one table or type definition carries the evidence, and scale the review to the risk of the decision.

## Output

Lead with one verdict, either `More complicated locally, simpler overall` or `More machinery, no net simplification`.

Then include the source-grounded complection table, the proposed domain language, one deep interface, the pure decision types, the split between effects and lifecycle, old versus proposed state count, the rewrite horizon, the deletion list, the fence for each separation, and the risks with one material question.

Report what becomes impossible, what becomes obvious, and what disappears. Leave praise out; the deletion list makes the case.

## Compact invocation

```text
Treat the current system as a functional prototype, not an architecture to preserve. Keep its proven behavior. Find what is complected. Separate values from time, policy from mechanism, behavior from the interfaces that reach it, and facts from read models. Define accidental errors out of existence. Draw the domain boundaries and aggregate invariants. Keep effects at effectful boundaries and state machines on essential lifecycle. Make each unit carry its own infrastructure so it can be deleted whole. Enforce each separation with a type or lint rule so the next change cannot braid it again. Propose the smallest deep replacement, show what it deletes, and name the remaining unknowns.
```

For the source map and the job each lens performs, read [references/source-map.md](references/source-map.md). For a stack built on these principles, see [rat-stack](https://github.com/joelhooks/rat-stack).
