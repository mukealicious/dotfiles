---
name: principle-separate-before-serializing-shared-state
description: Eliminates shared mutation before adding coordination. Use when concurrent actors may write the same file, branch, key, object, or external resource.
disable-model-invocation: true
metadata:
  watch-sources: cursor/plugins/pstack/skills/principle-separate-before-serializing-shared-state/SKILL.md@73f8be4873ea4ba2b7378243a036d3360c69e04d
---

# Separate Before Serializing Shared State

When actors may mutate the same state, first ask whether they need one shared write target at all.

1. Identify every file, branch, key, object, API, or generated output with multiple potential writers.
2. Default to separate ownership. Give actors independent files, keys, branches, worktrees, or state directories, then combine facts at a read or integration boundary.
3. When one shared writer is a real invariant, serialize structurally with sequential phases, a single-writer actor, lockfiles, atomic compare-and-swap, or another enforceable mechanism.

Instructions to "take turns" are not concurrency control. A shared document with separate fields is still shared mutation. Treat a lock as a design smell to examine, not the default solution.
