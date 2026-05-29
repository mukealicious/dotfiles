# Deep Modules

Deep modules are the central pattern for agent-friendly code. They reduce
reasoning load by concentrating behavior behind a small, stable interface.

## What Makes A Module Deep

- The interface is small relative to the behavior it provides.
- Callers do not need to know implementation details, ordering trivia, storage
  formats, retry strategy, parsing rules, or hidden invariants.
- Changes tend to concentrate inside the module instead of spreading through
  callers.
- Tests can exercise meaningful behavior through the public interface.

Depth is not measured by line count. A module can be internally large and still
deep if its interface has high leverage. A tiny wrapper can still be shallow if
callers must understand everything it forwards to.

## Design Heuristics

- **Deletion test**: imagine deleting the module. If complexity vanishes, the
  module was pass-through. If complexity reappears across many callers, it was
  hiding useful knowledge.
- **Interface first**: define what callers need to know before exposing helper
  seams.
- **Hide knowledge, not code**: group code by the design knowledge it owns, not
  by temporal steps like parse, validate, process, save.
- **Push complexity down**: callers should ask for outcomes, not orchestrate
  internal steps.
- **Avoid classitis**: many tiny modules can increase cognitive load if each adds
  a new interface without hiding real knowledge.

## Seam Discipline

- A seam exists where behavior can change without editing the caller.
- One adapter means a hypothetical seam. Two adapters mean the seam is real.
- Use internal seams freely when they help implementation tests, but do not
  expose them through the external interface unless callers need them.
- For true external dependencies, inject a port or adapter at the seam and test
  the deep module with a fake or local adapter.

## Review Questions

- What knowledge does this module hide?
- What facts must callers know that could be hidden?
- Does the interface expose implementation vocabulary?
- Would a new agent need to read the implementation before using it correctly?
- Does the test suite verify behavior through the interface or poke internals?
- Would merging two shallow modules improve locality?

## Red Flags

- Helper modules whose names are just verbs: `process`, `handle`, `utils`.
- Wrapper functions that forward parameters without changing the reasoning
  burden.
- Callers that must invoke methods in a fragile order.
- Duplicated validation, parsing, formatting, or retry decisions across callers.
- Configuration parameters that ask callers to decide internal behavior.
