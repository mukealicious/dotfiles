---
name: engineering-patterns
description: Apply agent-native software engineering patterns for implementation, refactoring, and architecture decisions. Use when building features, shaping code structure, reducing complexity, designing module interfaces, planning vertical slices, doing final cleanup, or deciding how to change code safely.
metadata:
  watch-sources: |
    mattpocock/skills/skills/engineering/improve-codebase-architecture@b843cb5ea74b1fe5e58a0fc23cddef9e66076fb8
    wondelai/skills/software-design-philosophy@eff8b3cab2d9afab9dc09c4cc04e80ad9641db29
    wondelai/skills/refactoring-patterns@eff8b3cab2d9afab9dc09c4cc04e80ad9641db29
    wondelai/skills/release-it@eff8b3cab2d9afab9dc09c4cc04e80ad9641db29
references:
  - references/deep-modules.md
  - references/vertical-slices.md
  - references/safe-refactoring.md
  - references/final-pass.md
  - references/production-boundaries.md
  - references/fast-by-feel-product-engineering.md
  - references/agent-friendly-code-topology.md
  - references/thin-ai-clients.md
---

# Engineering Patterns

Use this skill as the default engineering doctrine for agentic coding. The goal
is code that is easier for agents and humans to reason about: small public
surfaces, substantial hidden behavior, end-to-end slices, and safe changes.

## Core Defaults

1. **Prefer deep modules.** Put meaningful behavior behind a small interface so
   callers and future agents can reason at the interface first. See
   [deep-modules.md](./references/deep-modules.md).
2. **Start with a thin vertical slice.** Prove the riskiest path end to end
   before broadening the feature. See
   [vertical-slices.md](./references/vertical-slices.md).
3. **Refactor in verified steps.** Keep behavior stable, change one structure at
   a time, and rerun the narrowest useful checks. See
   [safe-refactoring.md](./references/safe-refactoring.md).
4. **Clean up before handoff.** Remove AI-shaped excess: weak wrappers,
   duplicate types, debug residue, and defensive clutter that duplicates trusted
   boundaries. See [final-pass.md](./references/final-pass.md).
5. **Treat external boundaries as production boundaries.** Name timeouts,
   retries, idempotency, observability, and failure behavior where a module
   crosses I/O, network, data, or third-party seams. See
   [production-boundaries.md](./references/production-boundaries.md).
6. **Engineer fast-by-feel product paths.** For user-facing workflows, respond
   locally on the common successful path, then reconcile with authority at a
   named boundary. See
   [fast-by-feel-product-engineering.md](./references/fast-by-feel-product-engineering.md).
7. **Optimize change locality for agents and humans.** Prefer structures where
   related intent, constraints, and implementation live near each other,
   especially on high-churn paths. See
   [agent-friendly-code-topology.md](./references/agent-friendly-code-topology.md).

## Vocabulary

- **Module**: anything with an interface and an implementation: function, class,
  package, subsystem, or vertical slice.
- **Interface**: everything callers must know: types, invariants, ordering,
  errors, configuration, performance, and ownership. Not just the signature.
- **Implementation**: what sits behind the interface.
- **Depth**: leverage at the interface. A deep module gives callers a lot of
  behavior through a small surface.
- **Shallow module**: interface complexity is close to implementation
  complexity. The module is probably not hiding enough.
- **Seam**: a place where behavior can vary without editing that place.
- **Adapter**: a concrete implementation that satisfies an interface at a seam.
- **Locality**: change, bugs, and knowledge concentrate in one place.
- **Leverage**: one interface pays back across many callers and tests.
- **Topology**: how code, files, indirection, and seams shape the path from an
  intended change to the safe edit surface.

## Working Rules

- Read the existing code shape first. Prefer local patterns over imported
  doctrine when they are coherent.
- Use the **deletion test**: if deleting a module makes complexity disappear, it
  was probably pass-through. If complexity reappears across callers, it was
  earning its keep.
- The **interface is the test surface**. Tests should cross the same seam as
  callers and survive internal refactors.
- One adapter is a hypothetical seam. Two adapters are evidence that a seam is
  real.
- Do preparatory refactoring when it makes the requested change smaller or less
  risky. Do not turn a task into an unrelated redesign.

## Task Routing

| Task | Read |
|---|---|
| Design or critique module shape | `references/deep-modules.md` |
| Plan implementation order | `references/vertical-slices.md` |
| Refactor existing code | `references/safe-refactoring.md` |
| Final cleanup before commit/PR | `references/final-pass.md` |
| External service, DB, queue, deployment, or reliability concern | `references/production-boundaries.md` |
| User-facing workflow feels slow, waits on network, rerenders broadly, or has high-frequency interaction friction | `references/fast-by-feel-product-engineering.md` |
| Choosing between equivalent implementation shapes, especially for AI-heavy maintenance or high-churn code | `references/agent-friendly-code-topology.md` |
| AI/agent product architecture, chat/agent UX, local-vs-cloud inference, or deciding how much UI to build around AI | `references/thin-ai-clients.md` |

## Output Expectations

When this skill informs a decision, name the pattern explicitly: “thin vertical
slice,” “deep module,” “deletion test,” “preparatory refactoring,” “production
boundary,” “fast-by-feel product path,” or “agent-friendly topology.” Explain
the tradeoff in terms of locality, leverage, blast radius, agent/human reasoning
load, and user-visible responsiveness, not abstract cleanliness.
