---
name: qmd
description: Search markdown/docs/Obsidian with QMD hybrid search. Use when ripgrep misses semantic matches or for large knowledge bases.
---

# QMD - Quick Markdown Search

Local hybrid search for markdown files. Three search modes: keyword (BM25), semantic (vectors), hybrid (best quality).

## Prerequisites

- **mise-managed Node**: QMD is installed by `mise/install.sh` from `mise/node-globals.reqs`.
- **Do not install QMD with Bun**: QMD uses native Node dependencies such as `better-sqlite3`, so it should run under the same mise-pinned Node runtime that installed it.

## Per-Project Config

Projects with a `.qmd/` directory get their own local index. The dotfiles `qmd` wrapper auto-detects this and routes QMD to the local config + SQLite index.

### Setup

Create `.qmd/index.yml` in the project root:

```yaml
global_context: "Description of what this project/vault contains."

collections:
  docs:
    path: /absolute/path/to/docs
    pattern: "**/*.md"
    context:
      "": "What this collection contains."
      "/subdir": "What this subdirectory contains."

  code:
    path: /absolute/path/to/src
    pattern: "**/*.{ts,js,py}"
    ignore: ["node_modules/**", "*.test.*"]
    context:
      "": "Source code for the application."
```

Then index: `qmd update && qmd embed`

### Key fields

- **`global_context`**: Applied to all collections. Helps LLMs understand the overall project.
- **`context`**: Per-collection and per-path descriptions returned with search results. This is QMD's key feature — it tells LLMs *what kind* of content they're looking at. Use `""` for the root context.
- **`pattern`**: Glob pattern for files to index (not just `*.md` — can index any text files).
- **`ignore`**: Glob patterns to exclude from indexing.
- **`update`**: Shell command to run before indexing (e.g., `git pull --ff-only` for external repos).

### How the wrapper works

`~/.dotfiles/bin/qmd` runs the real QMD binary through the mise-managed Node runtime and sets `QMD_CONFIG_DIR` / `INDEX_PATH` when it finds `.qmd/` in the current directory or an ancestor. Without `.qmd/`, QMD falls back to the global index at `~/.cache/qmd/`.

`~/.dotfiles/bin` should be first on PATH so plain `qmd` uses this wrapper in Fish, Bash, Zsh, and agent contexts. Run `dot doctor` if plain `qmd` appears to ignore a project index.

### Agent and MCP contexts

For **search**, prefer the MCP server (`qmd mcp`) when a project config provides it — configure it in `.mcp.json` with `INDEX_PATH` and `QMD_CONFIG_DIR` env vars baked in. Agents then use `mcp__qmd__query` etc. without shell PATH dependence.

For **maintenance commands** (`qmd update`, `qmd embed`) that aren't in MCP, plain `qmd` is safe when the dotfiles wrapper is first on PATH:

```bash
qmd update
qmd embed
```

Use explicit env vars as a fallback when running in a constrained environment that does not load the dotfiles PATH:

```bash
QMD_CONFIG_DIR="$PWD/.qmd" INDEX_PATH="$PWD/.qmd/index.sqlite" qmd update
QMD_CONFIG_DIR="$PWD/.qmd" INDEX_PATH="$PWD/.qmd/index.sqlite" qmd embed
```

Without env vars, MCP, or the wrapper, QMD silently falls back to the global index, which may be empty or stale.

## Indexing

```bash
qmd update               # Re-index using .qmd/index.yml (or global config)
qmd embed                # Generate vector embeddings
qmd status               # Check index health, collections, and context

# Manual collection management (when not using index.yml)
qmd collection add <path> --name <name>
qmd context add qmd://<collection> "description"
```

## Search Commands

| Command | Type | Use When |
|---------|------|----------|
| `qmd search "query"` | BM25 keyword | Exact terms, names, identifiers |
| `qmd vsearch "query"` | Semantic vectors | Concepts, similar ideas, fuzzy matches |
| `qmd query "query"` | Hybrid + LLM re-rank | Best quality, complex questions |

### Options

```bash
-n 10                    # Limit results (default: 5)
-c <collection>          # Search specific collection
--intent "context"       # Disambiguate query (e.g., --intent "database connections")
--json / --xml / --md    # Output format
--files                  # File paths with scores only
--all --min-score 0.3    # All results above threshold
```

## Retrieving Documents

```bash
qmd get "path/to/file.md"       # Get full document content
qmd get "#abc123"                # Get by docid (shown in search results)
qmd multi-get "docs/**/*.md"    # Batch retrieve by glob
```

## When to Use QMD

- Large markdown collections (Obsidian vaults, documentation)
- Semantic search ("find notes about authentication" vs grep for "auth")
- Meeting transcripts, long documents
- When grep misses conceptually related content
- Any project with a `.qmd/index.yml` config

## When NOT to Use

- Small codebases (use ripgrep/grep)
- Single known files (use Read tool)
- Code search with exact patterns (use Grep tool with regex)
