---
name: tdd
description: Test-driven development. Use when the user requests test-first implementation or red-green-refactor, or the task explicitly adopts TDD. Ordinary test additions do not require this workflow.
metadata:
  watch-sources: dmmulroy/.dotfiles/home/.agents/skills/tdd@f9f7aa1a3638d6bfb6fa0b94fd110185534a2895
references:
  - tests.md
  - mocking.md
  - ../codebase-design/SKILL.md
---

# Test-Driven Development

TDD uses red → green → refactor cycles to produce tests worth keeping. Apply the guidance below throughout the work; consult examples when needed.

When exploring the codebase, read `CONTEXT.md` (if it exists) so test names and interface vocabulary match the project's domain language, and respect ADRs in the area you're touching.

## What a good test is

Tests verify behavior through public interfaces, not implementation details. Code can change entirely; tests shouldn't. A good test reads like a specification — "user can checkout with valid cart" tells you exactly what capability exists — and survives refactors because it doesn't care about internal structure.

See [tests.md](tests.md) for examples and [mocking.md](mocking.md) for mocking guidelines.

## Seams — where tests go

A **seam** is the public boundary you test at: the interface where you observe behavior without reaching inside. Tests live at seams, never against internals.

Choose seams from the requested behavior, established public interfaces, and existing tests. Preserve already-agreed seams and prioritize critical paths and complex logic. State a new seam briefly when it matters; do not require confirmation for an established boundary.

Ask only when choosing a seam would materially change scope or interface design and the available context does not settle that choice.

When the shape of that interface is itself in question — how deep the module is, where the seam belongs, what the interface should expose — use the `codebase-design` skill for the vocabulary. It is the shared source of the module, interface, depth, seam, adapter, leverage and locality terms, and it is a reference to consult, not a session to run.

## Anti-patterns

- **Implementation-coupled** — mocks internal collaborators, tests private methods, or verifies through a side channel (querying the database instead of using the interface). The tell: the test breaks when you refactor but behavior hasn't changed.
- **Tautological** — the assertion recomputes the expected value the way the code does (`expect(add(a, b)).toBe(a + b)`, a snapshot derived by hand the same way, a constant asserted equal to itself), so it passes by construction and can never disagree with the code. Expected values must come from an independent source of truth — a known-good literal, a worked example, the spec.
- **Horizontal slicing** — writing all tests first, then all implementation. Bulk tests verify _imagined_ behavior: you test the _shape_ of things rather than user-facing behavior, the tests go insensitive to real changes, and you commit to test structure before understanding the implementation. Work in **vertical slices** instead — one test → one implementation → repeat, each test a **tracer bullet** that responds to what the last cycle taught you.

## Rules of the loop

- **Red before green.** Write the failing test first, then only enough code to pass it. Don't anticipate future tests or add speculative features.
- **One slice at a time.** One seam, one test, one minimal implementation per cycle.
- **Refactor while green.** Make small, behavior-preserving improvements when they reduce complexity, then rerun the relevant tests. Keep unrelated cleanup out of the slice.
