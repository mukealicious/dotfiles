---
name: principle-encode-lessons-in-structure
description: Converts recurring corrections into enforceable mechanisms instead of repeated prose. Use when the same instruction, failure, or human correction appears again.
disable-model-invocation: true
metadata:
  watch-sources: cursor/plugins/pstack/skills/principle-encode-lessons-in-structure/SKILL.md@73f8be4873ea4ba2b7378243a036d3360c69e04d
---

# Encode Lessons in Structure

A recurring correction belongs in the strongest mechanism the system can support, not another reminder readers may miss.

1. Decide whether the event is a one-off or a pattern.
2. Locate the layer that owns the rule.
3. Prefer, in order where applicable, an unrepresentable state, compiler constraint, lint or banned API, canonical helper, metadata rule, validator, runtime check, or automation script.
4. Remove duplicated prose once the structural mechanism reliably owns the rule.
5. Verify the mechanism catches the original failure without blocking valid behavior.

Some rules require judgment. Keep those as concise guidance with a concrete failure example. Do not record a structural problem only as a session note or todo; either implement the guard now or create a scoped follow-up with an owner.
