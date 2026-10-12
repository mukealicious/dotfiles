# Custom Git Commands

Read this reference before adding or changing `~/.dotfiles/bin/git-*`.
Executable files named `git-<name>` become `git <name>` subcommands.

Inspect existing `bin/git-*` scripts for the nearest convention instead of
maintaining a second command inventory here.

## Add a Command

1. Create `~/.dotfiles/bin/git-<name>` with a purpose and usage header.
2. Use the Bash template below, or the uv template for Python.
3. Make it executable with `chmod +x`.
4. Validate against a disposable repository when it changes Git state; invoke
   it as `git <name>` only within the user's authorized scope.

### Bash

```bash
#!/usr/bin/env bash
#
# git-example - Description of what this does
#
# Usage: git example [options]

set -e

# Implementation here
```

### Python

Use the shared `uv` skill for dependencies and script locking.

```python
#!/usr/bin/env -S uv run --script
"""
git-example - Description of what this does

Usage: git example [options]
"""


def main():
    # Implementation here
    pass


if __name__ == "__main__":
    main()
```
