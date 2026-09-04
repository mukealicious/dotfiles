---
name: principle-prove-it-works
description: Requires direct evidence from the real artifact or execution path before declaring success. Use when verifying completed work or delegated output.
disable-model-invocation: true
metadata:
  watch-sources: cursor/plugins/pstack/skills/principle-prove-it-works/SKILL.md@73f8be4873ea4ba2b7378243a036d3360c69e04d
---

# Prove It Works

Verify the actual result. Compilation, freshness, a proxy signal, or an agent's self-report may support proof but cannot substitute for it.

- Define what observable result would falsify the claim.
- Exercise the real input-to-output path at the appropriate boundary.
- Read the actual value or artifact rather than a cached or derived representation.
- Inspect delegated diffs, files, and runtime behavior yourself.
- When a check passes too easily or fails unexpectedly, test the observation method before drawing conclusions.
- Report untested, negative, and inconclusive results plainly.

Use the strongest proportionate evidence. Documentation work may need link and projection checks; code may need tests plus a real feature path; an integration may need end-to-end communication. Script repeatable checks when risk or recurrence justifies it, but do not create permanent harnesses for trivial one-off proof.
