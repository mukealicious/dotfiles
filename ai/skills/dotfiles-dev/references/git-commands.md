# Custom Git Commands

Located in `~/.dotfiles/bin/`. Executable scripts named `git-*` become git subcommands.

## Existing Commands

| Command | Purpose |
|---------|---------|
| `git-up` | Smart pull with stash/rebase |
| `git-wtf` | Branch status overview |
| `git-undo` | Undo recent operations |
| `git-promote` | Promote to tracking branch |
| `git-unpushed` | Show unpushed commits |
| `git-unpushed-stat` | Stats on unpushed commits |
| `git-rank-contributors` | Contributor statistics |
| `git-amend` | Easy commit amending |
| `git-credit` | Credit co-authors |
| `git-copy-branch-name` | Copy branch to clipboard |
| `git-track` | Setup remote tracking |
| `git-edit-new` | Open new/modified files in editor |
| `git-nuke` | Force delete branches |
| `git-all` | Run across multiple repos |

## Creating New Commands

1. Create executable script: `~/.dotfiles/bin/git-<name>`
2. Add shebang (`#!/bin/bash` or `#!/usr/bin/env python3`)
3. Make executable: `chmod +x`
4. Use as `git <name>`

### Template (Bash)

```bash
#!/bin/bash
#
# git-example - Description of what this does
#
# Usage: git example [options]

set -e

# Implementation here
```

### Template (Python)

```python
#!/usr/bin/env python3
"""
git-example - Description of what this does

Usage: git example [options]
"""

import subprocess
import sys

def main():
    # Implementation here
    pass

if __name__ == "__main__":
    main()
```
