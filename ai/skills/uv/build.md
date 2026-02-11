# uv Build & Publish Reference

## Project Setup

```bash
# Create new project
uv init my-package
cd my-package

# Create with specific structure
uv init --lib my-library    # src/ layout
uv init --app my-app        # flat layout
```

## pyproject.toml Essentials

```toml
[project]
name = "my-package"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "httpx>=0.27",
]

[dependency-groups]
dev = [
    "pytest>=8.0",
    "ruff>=0.8",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

## Dependency Management

```bash
# Add production dependency
uv add requests

# Add dev dependency
uv add --dev pytest ruff

# Add with version constraint
uv add "httpx>=0.27"

# Remove
uv remove requests

# Sync all deps from lock file
uv sync

# Sync including dev deps
uv sync --all-groups

# Upgrade a specific package
uv lock --upgrade-package httpx
```

## Building

```bash
# Build sdist + wheel
uv build

# Output in dist/
ls dist/
# my_package-0.1.0.tar.gz
# my_package-0.1.0-py3-none-any.whl
```

## Publishing

```bash
# Publish to PyPI
uv publish

# Publish to custom index
uv publish --index-url https://upload.pypi.org/legacy/
```

## Lock File

- `uv.lock` is the lock file — commit it for applications, optional for libraries
- `uv sync` installs exact versions from lock
- `uv lock` regenerates the lock file
