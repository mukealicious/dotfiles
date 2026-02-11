# uv Scripts Reference

## Running Scripts

```bash
# Basic run
uv run script.py

# With dependencies (not in pyproject.toml)
uv run --with httpx --with beautifulsoup4 scraper.py

# With specific Python version
uv run --python 3.12 script.py

# Pass arguments
uv run script.py --verbose --output result.json
```

## Inline Script Metadata (PEP 723)

Embed dependencies directly in the script file:

```python
# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "httpx>=0.27",
#     "beautifulsoup4",
# ]
# ///

import httpx
from bs4 import BeautifulSoup

resp = httpx.get("https://example.com")
soup = BeautifulSoup(resp.text, "html.parser")
print(soup.title.string)
```

Run with just `uv run script.py` — uv handles the rest.

### Create a script with metadata

```bash
uv init --script fetch.py
uv add --script fetch.py httpx beautifulsoup4
```

## Project Scripts

In projects with `pyproject.toml`, define scripts:

```toml
[project.scripts]
my-cli = "my_package.cli:main"
```

Then: `uv run my-cli`

## Tool Running

Run CLI tools without installing globally:

```bash
# Run a tool directly
uvx ruff check .
uvx black .
uvx mypy src/

# Equivalent to
uv tool run ruff check .
```
