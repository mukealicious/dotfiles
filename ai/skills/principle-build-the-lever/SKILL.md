---
name: principle-build-the-lever
description: Builds the smallest rerunnable tool that performs or proves repeated, risky, or auditable work. Use when automation materially improves throughput or confidence.
disable-model-invocation: true
metadata:
  watch-sources: cursor/plugins/pstack/skills/principle-build-the-lever/SKILL.md@73f8be4873ea4ba2b7378243a036d3360c69e04d
---

# Build the Lever

When repetition, risk, or auditability warrants it, build the smallest deterministic tool that does or proves the work.

- Learn the recipe on one unit before automating it.
- Prefer a codemod or script for repeated edits, a generator for repeated artifacts, and a rerunnable check for verification.
- Make the lever safe to rerun and easy for a reviewer to inspect.
- Prefer one deterministic tool over many workers hand-applying the same recipe.
- Keep shared worker contracts outside workers' write scope when delegation is used.
- Preserve the lever when the work will recur; discard one-off scaffolding that has no ongoing value.

Do not automate by reflex. A few obvious, low-risk edits may be clearer by hand. The lever must cost less than the uncertainty or repetition it removes, and it must not become a framework.
