---
name: principle-fix-root-causes
description: Traces reproduced symptoms to the owning failure mechanism instead of masking them. Use when debugging defects, regressions, or restart-sensitive behavior.
disable-model-invocation: true
metadata:
  watch-sources: cursor/plugins/pstack/skills/principle-fix-root-causes/SKILL.md@73f8be4873ea4ba2b7378243a036d3360c69e04d
---

# Fix Root Causes

Reproduce the symptom, trace why it occurs, and change the owner of the failure rather than silencing its visible effect.

- Reproduce first so the correction can be checked on the same surface.
- Follow data and control flow until the causal mechanism is explicit.
- Inspect actual state and errors. Instrument when evidence is missing; do not guess.
- Treat deep guards, swallowed errors, retries, and explanatory workaround comments as possible symptom fixes.
- Search for the failure pattern, not only the reported instance.
- For restart-only failures, inspect persisted config, cache, locks, serialized state, and generated output before assuming code changed.

A narrow workaround may be necessary for safety or external constraints. Name it as such, preserve the underlying diagnosis, and give the workaround an owner or exit condition.
