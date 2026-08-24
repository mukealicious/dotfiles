---
name: grill-me
description: Manually enter the grilling workflow to stress-test a plan or design through its unresolved decision tree. Use when the user explicitly asks to be grilled.
license: MIT. Copyright (c) 2026 Matt Pocock.
user-invocable: true
disable-model-invocation: true
metadata:
  watch-sources: mattpocock/skills/skills/productivity/grill-me@9c9f36ccd3995266cd675468af71639c8dde1ec5
---

# Grill Me

This is a thin manual entry point. When the user invokes this skill, follow
[grilling](../grilling/SKILL.md) for the complete dependency-aware design-tree
workflow.

Do not start grilling automatically, duplicate its question loop, or make
unresolved decisions on the user's behalf. Keep asking frontier questions until
the decision tree is settled and wait for the user's confirmation before acting.
