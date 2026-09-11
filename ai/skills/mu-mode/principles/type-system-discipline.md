# Type System Discipline

Use the type checker as a proof assistant, not an obstacle to bypass.

- Model variants explicitly instead of bags of optional fields or synchronized booleans.
- Construct valid values by design. Prefer shapes whose constructors cannot produce the illegal state.
- Distinguish semantic primitives such as different IDs when accidental interchange is dangerous.
- Parse external data at the boundary before granting it an internal type.
- Treat casts, unsafe coercions, broad `any`, and unchecked assertions as hazards that require proof or redesign.
- Make variant handling exhaustive so a new case produces a compiler error at every incomplete match.
- Derive types from authoritative schemas instead of duplicating them by hand.
- Strengthen a type where an operation would otherwise be partial, then stop. Extra precision that prevents no failure adds ceremony.

Apply the language's native idioms. Do not claim static guarantees in untyped files or force typed wrappers around simple data that has no meaningful invalid state.
