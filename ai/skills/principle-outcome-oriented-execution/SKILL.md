---
name: principle-outcome-oriented-execution
description: Keeps rewrites and migrations converging on a verifiable target state. Use when work has explicit phases, compatibility constraints, or tempting temporary architecture.
disable-model-invocation: true
metadata:
  watch-sources: cursor/plugins/pstack/skills/principle-outcome-oriented-execution/SKILL.md@73f8be4873ea4ba2b7378243a036d3360c69e04d
---

# Outcome-Oriented Execution

Optimize for the intended, verifiable end state rather than letting transitional machinery become the architecture.

- Define the target and its completion predicate before migration work.
- Make temporary states explicit, scoped, reversible, and time-bounded.
- Preserve compatibility, safe rollout, and usable intermediate states when real consumers or operations require them.
- Avoid compatibility code that exists only because internal callers have not been migrated.
- Keep high-signal checks on touched areas throughout the transition.
- Run full relevant verification at the final boundary.

End-state integrity does not excuse unsafe breakage. Choose the shortest safe path that honors actual consumers and operational constraints.
