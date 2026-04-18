---
name: librarian
description: Multi-repository codebase exploration. Research library internals, find code patterns, understand architecture, compare implementations across GitHub/npm/PyPI/crates. Use when needing deep understanding of how libraries work, finding implementations across open source, or exploring remote repository structure.
references:
  - references/tool-routing.md
  - references/opensrc-api.md
  - references/opensrc-examples.md
  - references/linking.md
  - references/diagrams.md
---

# Librarian Skill

Source-first external code investigation across remote repositories.

## Core Model

Separate work into two phases:

1. **Discovery** — find the right package/repo or gather candidate implementations across the ecosystem.
2. **Investigation** — once a concrete target is known, fetch source and answer from repo files, examples, tests, and implementation.

Default to **scratch mode** under `.context/opensrc/<slug>/` for one-off exploration. Use **project mode** when the fetched source is likely to be reused by the current repo.

## How to Use This Skill

### Reference Structure

| File | Purpose | When to Read |
|------|---------|--------------|
| `tool-routing.md` | Discovery vs investigation routing | **Always read first** |
| `opensrc-api.md` | API reference, types | When your runtime exposes opensrc MCP primitives |
| `opensrc-examples.md` | JavaScript patterns, workflows | When your runtime exposes opensrc MCP primitives |
| `linking.md` | GitHub URL patterns | Before citing files |
| `diagrams.md` | Mermaid patterns | When visualizing architecture |

### Reading Order

1. **Start** with `tool-routing.md` -> choose discovery vs investigation
2. **If source fetch is needed:**
   - Use the shared `opensrc` skill for CLI-based project/scratch workflows
   - Read `opensrc-api.md` + `opensrc-examples.md` only when your runtime exposes opensrc MCP calls directly
3. **Before responding:** read `linking.md` + `diagrams.md`

## Current Repo Mapping

Shared guidance is capability-first, but the current repo mapping is:

| Capability | Default Mapping | Use When |
|------------|-----------------|----------|
| GitHub-wide discovery | `grep_app` | Target is unclear, broad pattern search, cross-repo scouting |
| Source fetch + local inspection | `opensrc` | Target is known, internals matter, call flow/architecture tracing |

## Default Workflow Contract

For concrete implementation questions, default to:

`identify target -> fetch source -> read README/package metadata/entrypoints/examples/tests -> trace implementation -> answer with evidence`

Use GitHub-wide discovery only when the target is unclear or when ecosystem comparison materially improves the answer.

## Quick Decision Trees

### "How does X work?"

```
Concrete package/repo known?
|- Yes -> fetch source -> read README/package.json/entrypoints -> trace implementation
\- No  -> broad GitHub search -> choose target -> fetch source -> investigate
```

### "Find pattern X"

```
Specific repo?
|- Yes -> fetch source -> grep/read matches
\- No  -> broad GitHub search -> choose promising repos -> fetch source -> compare
```

### "Explore repo structure"

```
1. Fetch source
2. Inspect tree / entrypoints
3. Read subsystem docs/examples/tests if relevant
4. Trace implementation
5. Create architecture diagram (see diagrams.md)
```

### "Compare X vs Y"

```
1. Fetch both/all targets
2. Read comparable entrypoints and implementation files
3. Use broader search only if extra ecosystem examples materially help
4. Answer with a comparison table grounded in source
```

## Evidence Standard

For investigative answers, aim to include:

- package or repo identity
- version or ref when known
- file citations for key claims
- short code snippets for non-obvious implementation details
- explicit note when a claim comes from README/examples/tests versus core implementation

This standard can be lighter during early discovery when the goal is just to identify promising targets.

## When NOT to Start With Source Fetch

| Scenario | Start With |
|----------|------------|
| Target is still unclear | GitHub-wide discovery |
| Need examples across many repos | GitHub-wide discovery |
| Repo is private or too large for the fetch workflow | Direct local/authorized access |

For quick usage questions about a known library, prefer the library's own README/examples/tests after fetching or identifying the target rather than reverting to docs-first routing.

## Output Guidelines

1. Hide tool choreography in user-facing prose — describe what you will inspect, not internal tool names.
2. Link every file reference (see `linking.md`).
3. Use diagrams for complex relationships (see `diagrams.md`).
4. Be explicit about provenance: README/docs/tests vs implementation.
5. Say when an answer is exploratory and not yet source-grounded.

## References

- [Tool Routing Decision Trees](references/tool-routing.md)
- [opensrc API Reference](references/opensrc-api.md)
- [opensrc Code Examples](references/opensrc-examples.md)
- [GitHub Linking Patterns](references/linking.md)
- [Mermaid Diagram Patterns](references/diagrams.md)
