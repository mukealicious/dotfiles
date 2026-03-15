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

## Shared Libraries

| File | Purpose |
|------|---------|
| `lib/symlink.sh` | Shared `ensure_symlink` (read-write) and `check_symlink` (read-only) helpers. Sourced by installers and `dot-doctor`. |

## Diagnostic Commands

| Command | Description |
|---------|-------------|
| `dot doctor` | Validates CLIs, symlinks, Fish config, AI assembly, PATH. Exit 0 = healthy, exit 1 = failures. |

## Install Scripts

`install.sh` scripts should be idempotent. Called by `script/install` and `bin/dot`. When adding a new topic, consider whether `dot doctor` needs a corresponding check.

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
