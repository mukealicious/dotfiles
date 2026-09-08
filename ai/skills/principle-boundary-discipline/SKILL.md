---
name: principle-boundary-discipline
description: Concentrates parsing, validation, and defensive handling at system boundaries. Use when wiring external inputs, errors, configuration, protocols, or framework adapters.
disable-model-invocation: true
metadata:
  watch-sources: cursor/plugins/pstack/skills/principle-boundary-discipline/SKILL.md@73f8be4873ea4ba2b7378243a036d3360c69e04d
---

# Boundary Discipline

Treat external data as untrusted at the edge, convert it to the system's internal model once, then let internal logic rely on that contract.

- Validate CLI arguments, environment variables, config, files, network payloads, database rows, and external API responses when they enter.
- Return useful errors at the boundary rather than scattering guards through business logic.
- Keep transport, storage, framework, and wire representations out of public domain interfaces.
- Put domain transformations in pure functions where practical; keep adapters thin and mechanical.
- Propagate internal errors according to the module contract instead of swallowing or repeatedly wrapping them.
- Do not revalidate a fact already guaranteed by a trusted internal type or constructor.

Ask whether data is crossing a real system boundary now. If not, another defensive check may be noise or evidence that the internal model is too weak.
