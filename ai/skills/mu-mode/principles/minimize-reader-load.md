# Minimize Reader Load

Maintainability is the work required to answer where a value or rule comes from and what can change it. Reduce both layers to trace and state to hold.

- Collapse one-caller wrappers, pass-through adapters, and layers that do not change abstraction.
- Demand interface compression. A boundary should hide meaningful decisions.
- Shrink mutable state from global to module, field, local, or pure return value where possible.
- Derive values instead of synchronizing copies.
- State an invariant once at its owning boundary rather than in every consumer.
- Use progressive disclosure so routine use does not load exceptional detail.

A new layer or state holder must reduce reader load elsewhere by at least as much as it adds.
