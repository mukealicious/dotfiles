---
name: grill-with-docs
description: Manually stress-test a plan against project language and its durable glossary. Use when the user explicitly asks to grill a plan with docs.
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

This is a thin manual composition. When the user invokes this skill:

1. Follow [grilling](../grilling/SKILL.md) for the dependency-aware design tree
   and batched frontier questions.
2. Apply [domain-modeling](../domain-modeling/SKILL.md) while exploring facts
   and terminology: challenge fuzzy language, use concrete scenarios, and update
   `CONTEXT.md` when a domain term is resolved. The context is a glossary only.
3. Use domain-modeling's [CONTEXT format](../domain-modeling/CONTEXT-FORMAT.md)
   for durable glossary entries.

Do not duplicate either skill's workflow, create a `CONTEXT.md` without a
resolved term, or act before the user confirms shared understanding.
