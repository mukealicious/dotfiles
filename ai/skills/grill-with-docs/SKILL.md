---
name: grill-with-docs
description: Manually stress-test a plan against project language and durable domain docs, updating context or ADRs only as decisions crystallize. Use when the user explicitly asks to grill a plan with docs.
license: MIT. Copyright (c) 2026 Matt Pocock.
user-invocable: true
disable-model-invocation: true
metadata:
  watch-sources: mattpocock/skills/skills/engineering/grill-with-docs@9c9f36ccd3995266cd675468af71639c8dde1ec5
references:
  - ../grilling/SKILL.md
  - ../domain-modeling/SKILL.md
---

# Grill With Docs

This is a thin manual composition. When the user invokes
`/skill:grill-with-docs`:

1. Follow [grilling](../grilling/SKILL.md) for the dependency-aware design tree
   and batched frontier questions.
2. Apply [domain-modeling](../domain-modeling/SKILL.md) while exploring facts and
   decisions: challenge terminology, use concrete scenarios, and update
   `CONTEXT.md` or offer a qualifying ADR only when a decision crystallizes.
3. Use domain-modeling's [CONTEXT format](../domain-modeling/CONTEXT-FORMAT.md)
   and [ADR format](../domain-modeling/ADR-FORMAT.md) for any durable domain
   documentation.

Do not duplicate either skill's workflow, create context or ADR files lazily
without a resolved decision, or act before the user confirms shared understanding.
