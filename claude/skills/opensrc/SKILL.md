---
name: opensrc
description: Clone a repository and generate knowledge base. Use when exploring external libraries or GitHub repos. Invoke with /opensrc <repo-url>.
---

# OpenSrc

Clone a repository and generate an AGENTS.md knowledge base for it.

## Usage

```
/opensrc https://github.com/org/repo
/opensrc org/repo
```

## Workflow

### 1. Clone Repository

Use opensrc MCP tool or npx:

```bash
npx opensrc <repo-url>
```

This clones to `~/.opensrc/<org>/<repo>/`

### 2. Generate Knowledge Base

After cloning, run index-knowledge on the cloned repo:

```
/index-knowledge
```

Or manually explore and document key patterns.

### 3. Return Summary

```
Repository cloned to ~/.opensrc/<org>/<repo>/

AGENTS.md generated at ~/.opensrc/<org>/<repo>/AGENTS.md

Key findings:
- <stack/framework>
- <notable patterns>
- <entry points>

To explore further:
  cd ~/.opensrc/<org>/<repo>
  Use librarian agent for detailed analysis
```

## Prerequisites

- Node.js/npx available
- Or opensrc MCP server configured

## Integration with Librarian

For deep exploration of cloned repos, use the librarian agent:

```
Use the librarian agent to explore how <repo> implements <feature>
```

The librarian specializes in multi-repository analysis with:
- GitHub URL linking for references
- Mermaid diagrams for complex flows
- Comprehensive code tracing

## Notes

- Cloned repos are cached in `~/.opensrc/`
- Re-running on same repo updates the clone
- Large repos may take time to clone and index
