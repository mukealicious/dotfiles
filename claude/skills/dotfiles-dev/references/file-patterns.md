# Dotfiles File Patterns

## Auto-processed Patterns

| Pattern | Behavior | Example |
|---------|----------|---------|
| `*.symlink` | Symlinked to `~/.<name>` | `gitconfig.symlink` → `~/.gitconfig` |
| `aliases.fish` | Auto-discovered and symlinked to Fish conf.d | `git/aliases.fish` → Fish conf.d |
| `keybindings.fish` | Auto-discovered and symlinked to Fish conf.d | `fzf/keybindings.fish` → Fish conf.d |
| `install.sh` | Topic installer | Run by `dot` command |

## Symlink Naming

The `.symlink` suffix is stripped and a dot prefix added:

- `gitconfig.symlink` → `~/.gitconfig`

## Install Scripts

`install.sh` scripts should be idempotent. Called by `script/install` and `bin/dot`.

```sh
#!/bin/sh
#
# Install dependencies for [topic]

set -e

# Check if already installed
if command -v mytool >/dev/null 2>&1; then
    exit 0
fi

# Install logic here
```
