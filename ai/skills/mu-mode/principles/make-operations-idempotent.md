# Make Operations Idempotent

Design state-changing operations to converge on the correct state regardless of repetition or partial prior execution.

1. Inspect existing state before writing.
2. Distinguish correct, missing, stale, broken, and conflicting state by content or identity rather than creation order.
3. Reconcile each state explicitly.
4. Use atomic replacement, exclusive ownership, or recoverable locks where interruption can corrupt shared state.
5. Verify that rerunning after success changes nothing meaningful.

Test two cases: run the operation twice, and resume after interruption at each consequential write. If the result depends on accidental leftovers, add reconciliation. Do not add locks, schedulers, or recovery machinery unless the operation actually faces those failure modes.
