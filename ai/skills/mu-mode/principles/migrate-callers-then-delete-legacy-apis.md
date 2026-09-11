# Migrate Callers Then Delete Legacy APIs

When callers are under coordinated control, inventory them, migrate them to the chosen interface, and remove the obsolete path in the same migration wave.

- Do not preserve an old API only because internal callers have not been updated.
- Update tests to assert the new contract; remove tests that protect only retired implementation details.
- Treat temporary adapters as exceptional, owned, and time-bounded.
- Delete the adapter once its last required consumer migrates.

First establish whether external consumers, compatibility promises, or staged rollout prevent coordinated removal. When they do, keep the narrowest safe adapter and document its exit condition. The goal is one eventual contract, not unsafe breakage disguised as cleanliness.
