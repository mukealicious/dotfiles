---
name: librarian
description: Explore external/open-source codebases. Use for library internals, remote repo structure, implementation patterns, or comparing GitHub/npm/PyPI/crates projects.
references:
  - references/tool-routing.md
  - references/opensrc-api.md
  - references/opensrc-examples.md
  - references/linking.md
  - references/diagrams.md
---

# Librarian

Source-first external code investigation.

## Workflow

1. Read [references/tool-routing.md](references/tool-routing.md) and choose
   discovery or investigation. Discovery ends with an identified target;
   investigation starts from its source.
2. If source acquisition is needed, load the shared `opensrc` skill for the
   current CLI/cache workflow. Use existing local or authorized private access
   when fetching is unsuitable.
3. Read repository metadata and the relevant examples, tests, callers, and
   implementation until each substantive claim has file evidence. Search results
   identify candidates; they do not establish implementation behavior.
4. Before responding, read [references/linking.md](references/linking.md).
   For complex architecture or flow, also read
   [references/diagrams.md](references/diagrams.md) and load `mermaid` before
   producing a Mermaid chart.

## Evidence Standard

For investigative answers, include:

- package/repo identity and the inspected version/ref, when established
- file citations for key claims
- short snippets for non-obvious behavior
- whether evidence comes from README/docs, examples/tests, or implementation
- uncertainty and any source or coverage limits

Discovery-only answers can be lighter; label them exploratory. Describe the work
rather than tool choreography, and use a comparison table when comparing targets.

## Direct MCP Branch

Only when the runtime actually exposes opensrc MCP primitives, consult
[references/opensrc-api.md](references/opensrc-api.md) for API patterns and
[references/opensrc-examples.md](references/opensrc-examples.md) for compositions.
Verify the live tool schema before using those examples; they are not CLI syntax.
