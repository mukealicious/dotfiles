# Tool Routing

Read before starting an external-code investigation.

## Discovery vs Investigation

- **Discovery** identifies the right package/repo or candidate implementations.
  Use available GitHub-wide code search (`grep_app` when exposed) or public web
  search. Completion: a target is identified with enough provenance to fetch it.
- **Investigation** answers from a known target's source. Use the shared `opensrc`
  skill for acquisition, or existing local/authorized access. Read the target's
  README, package metadata, exports, examples, and tests before tracing internals.

A known-library usage question starts with that library's own source materials;
broader discovery earns its place only when it narrows an unknown target or adds
useful comparison evidence.

## Route by Question

| Question | Route | Completion |
|---|---|---|
| How does X work? | Known target: read source and trace the implementation. Unknown target: discover, select, then investigate. | Behavior explained with source evidence. |
| Find pattern X | Known repo: search its files and read matching context. Ecosystem search: shortlist repos, then inspect real implementations. | Relevant implementations identified and verified. |
| Explore repo structure | Inspect tree/exports, then the relevant subsystems and their callers. | Relationships grounded in files; diagram complex flows. |
| Compare X vs Y | Inspect comparable entrypoints and implementations for each target. Broaden search only if more examples improve the answer. | Comparison table with citations and evidence limits. |

For broad code search, use literal patterns and language filters when helpful.
Fetch shortlisted targets before making architectural claims.
[SKILL.md](../SKILL.md#evidence-standard) owns the evidence and response requirements.
