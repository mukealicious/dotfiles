---
name: qmd
description: Search markdown files, Obsidian vaults, documentation, and knowledge bases using QMD hybrid search. Use when grep/ripgrep miss semantic matches or when searching large document collections. Combines BM25 keyword search, vector embeddings, and LLM re-ranking.
---

# QMD - Quick Markdown Search

Local hybrid search for markdown files. Three search modes: keyword (BM25), semantic (vectors), hybrid (best quality).

## Prerequisites

- **Bun**: Already installed
- **Ollama**: `brew install --cask ollama-app` (models auto-download on first use)
- **QMD**: `bun install -g https://github.com/tobi/qmd`

## Indexing

Before searching, index the target directory:

```bash
qmd add <path>           # Index markdown files (can be glob pattern)
qmd add .                # Index current directory
qmd embed                # Generate vector embeddings (required for vsearch/query)
qmd status               # Check index health
```

## Search Commands

| Command | Type | Use When |
|---------|------|----------|
| `qmd search "query"` | BM25 keyword | Exact terms, names, identifiers |
| `qmd vsearch "query"` | Semantic vectors | Concepts, similar ideas, fuzzy matches |
| `qmd query "query"` | Hybrid + LLM re-rank | Best quality, complex questions |

## Output Formats

```bash
qmd search "query" --json    # Machine-readable JSON
qmd search "query" --xml     # XML format
qmd search "query" --md      # Markdown format
qmd search "query" -n 10     # Limit to 10 results (default: 5)
qmd search "query" --files   # Show only file paths with scores
```

Use `--json` or `--xml` when parsing results programmatically.

## Retrieving Documents

```bash
qmd get "path/to/file.md"    # Get full document content
```

## When to Use QMD

- Large markdown collections (Obsidian vaults, documentation)
- Semantic search ("find notes about authentication" vs grep for "auth")
- Meeting transcripts, long documents
- When grep misses conceptually related content

## When NOT to Use

- Small codebases (use ripgrep/grep)
- Single known files (use Read tool)
- Code search (use Grep tool with regex)

## Example Workflow

```bash
# First time setup for a knowledge base
cd ~/obsidian-vault
qmd add .
qmd embed

# Search
qmd query "how does the auth system work"
qmd get "notes/auth-architecture.md"  # Read full doc
```
