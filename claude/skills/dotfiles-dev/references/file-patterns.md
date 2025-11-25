# Dotfiles File Patterns

## Auto-processed Patterns

| Pattern | Behavior | Example |
|---------|----------|---------|
| `*.symlink` | Symlinked to `~/.<name>` | `gitconfig.symlink` → `~/.gitconfig` |
| `*.zsh` | Auto-sourced by ZSH | `aliases.zsh` loaded at shell start |
| `path.zsh` | PATH modifications | Loaded **first** |
| `completion.zsh` | Shell completions | Loaded **last** |
| `install.sh` | Topic installer | Run by `dot` command |

## ZSH Loading Order

1. All `path.zsh` files (PATH setup)
2. All `*.zsh` files (config, aliases, functions)
3. All `completion.zsh` files (completions)

## Symlink Naming

The `.symlink` suffix is stripped and a dot prefix added:

- `gitconfig.symlink` → `~/.gitconfig`
- `zshrc.symlink` → `~/.zshrc`
- `config/starship.toml.symlink` → `~/.config/starship.toml` (preserves subdirs)

## Install Scripts

`install.sh` scripts should be idempotent. Called by `script/install` and `bin/dot`.

```bash
#!/bin/bash
#
# Install dependencies for [topic]

# Check if already installed
if command -v mytool &>/dev/null; then
    exit 0
fi

# Install logic here
```
