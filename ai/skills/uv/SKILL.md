---
name: uv
description: Python development with uv package manager. Use when working with Python scripts, dependencies, or virtual environments. Always prefer uv over pip/python/poetry.
---

# uv

[uv](https://docs.astral.sh/uv/) is the Python package manager and runner. Always use `uv` instead of bare `python`, `pip`, or `poetry`.

## Quick Reference

### Run scripts

```bash
# Run a script (auto-creates venv, installs deps)
uv run script.py

# Run with extra dependencies
uv run --with requests --with rich script.py

# Run in a project (uses pyproject.toml)
uv run pytest
```

### Manage dependencies

```bash
# Add a dependency to pyproject.toml
uv add requests

# Add dev dependency
uv add --dev pytest

# Remove
uv remove requests

# Sync (install all deps from lock)
uv sync
```

### Create projects

```bash
# New project
uv init my-project

# New standalone script with inline metadata
uv init --script script.py
```

### Inline script metadata

For standalone scripts, embed dependencies directly:

```python
# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "requests",
#     "rich",
# ]
# ///

import requests
from rich import print
```

Then just: `uv run script.py` — uv reads the metadata and handles deps.

## Rules

- **Never** use bare `python script.py` — use `uv run script.py`
- **Never** use `pip install` — use `uv add` (projects) or `--with` (one-off)
- **Never** use `python -m venv` — uv manages venvs automatically
- In projects with `pyproject.toml`, `uv run` uses the project's venv
- For one-off scripts, prefer inline script metadata over `--with` flags

## See Also

- [scripts.md](scripts.md) — detailed script patterns and inline metadata
- [build.md](build.md) — building and publishing packages
