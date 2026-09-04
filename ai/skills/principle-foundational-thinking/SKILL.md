---
name: principle-foundational-thinking
description: Establishes core shapes, ownership, scaffolding, and concurrency boundaries before feature logic. Use when structural decisions affect later work or option value.
disable-model-invocation: true
metadata:
  watch-sources: cursor/plugins/pstack/skills/principle-foundational-thinking/SKILL.md@73f8be4873ea4ba2b7378243a036d3360c69e04d
---

# Foundational Thinking

Protect option value with early structural decisions and preserve simplicity in local code.

- Name the data shape and dominant access paths before writing logic.
- Decide which module owns each invariant and body of knowledge.
- Before actors share state, ask what happens under concurrent mutation. Isolate when interference is possible.
- Build scaffolding first only when every later slice benefits from it.
- DRY stable structures and models, not every repeated line.
- Prefer explicit boring code over an abstraction that predicts an unproven future.
- Let each increment establish or deepen one coherent module rather than spread special-case coordination through callers.

Subtract dead weight before laying foundations. Verify each foundational choice through the behavior it is meant to simplify or enable.
