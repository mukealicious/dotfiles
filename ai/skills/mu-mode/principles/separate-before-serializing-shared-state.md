# Separate Before Serializing Shared State

When actors may mutate the same state, first ask whether they need one shared write target at all.

1. Identify every file, branch, key, object, API, or generated output with multiple potential writers.
2. Default to separate ownership. Give actors independent files, keys, branches, worktrees, or state directories, then combine facts at a read or integration boundary.
3. When one shared writer is a real invariant, serialize structurally with sequential phases, a single-writer actor, lockfiles, atomic compare-and-swap, or another enforceable mechanism.

Instructions to "take turns" are not concurrency control. A shared document with separate fields is still shared mutation. Treat a lock as a design smell to examine, not the default solution.
