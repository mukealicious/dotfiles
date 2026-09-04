---
name: principle-guard-the-context-window
description: Protects reasoning quality by keeping bulk inputs and outputs out of the main thread. Use for large files, verbose commands, broad searches, repeated reads, or fan-out.
disable-model-invocation: true
metadata:
  watch-sources: cursor/plugins/pstack/skills/principle-guard-the-context-window/SKILL.md@73f8be4873ea4ba2b7378243a036d3360c69e04d
---

# Guard the Context Window

Context is finite within a session. Spend it on evidence and decisions that affect the current task.

- Read selectively. Do not load a file or reference without a reason to use it.
- Isolate large command output, screenshots, documents, and broad reconnaissance; bring back concise evidence-backed summaries.
- Use bounded delegation when it meaningfully protects the main thread, not as mandatory ceremony.
- Keep guidance used on every invocation in the entry file; place route-specific or exceptional detail behind targeted references.
- Size phases so a coherent result and continuation state fit before compaction.
- Avoid repeated reads when a verified summary remains authoritative.

Stay harness-neutral. No fixed model, mandatory subagent, or arbitrary turn budget is part of this principle.
