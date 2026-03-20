# Dotfiles File Patterns

## Auto-processed Patterns

| Pattern | Behavior | Example |
|---------|----------|---------|
| `*.symlink` | Symlinked to `~/.<name>` | `gitconfig.symlink` → `~/.gitconfig` |
| `aliases.fish` | Auto-discovered and symlinked to Fish conf.d | `git/aliases.fish` → Fish conf.d |
| `keybindings.fish` | Auto-discovered and symlinked to Fish conf.d | `fzf/keybindings.fish` → Fish conf.d |
| `install.sh` | Topic installer | Run by `script/install`/`dot` in deterministic order |

## Symlink Naming

The `.symlink` suffix is stripped and a dot prefix added:

- `gitconfig.symlink` → `~/.gitconfig`

## Shared Libraries

| File | Purpose |
|------|---------|
| `lib/log.sh` | Shared shell logging helpers (`log_section`, `log_step`, `log_info`, `log_success`, `log_warn`, `log_hint`). |
| `lib/symlink.sh` | Shared `ensure_symlink` (read-write) and `check_symlink` (read-only) helpers. Sourced by installers and `dot-doctor`. |

## Diagnostic Commands

| Command | Description |
|---------|-------------|
| `dot doctor` | Validates CLIs, symlinks, Fish config, AI assembly, PATH. Exit 0 = healthy, exit 1 = failures. |

## Install Scripts

`install.sh` scripts should be idempotent. `script/install` runs them in a deterministic pattern: explicit `CORE_INSTALLERS` order for foundational topics, then sorted auto-discovery for everything else. Called by `script/install` and `bin/dot`.

When adding a new topic:
- If its installer has no special ordering requirements, no `script/install` change is needed.
- If it must run before the general fallback installers, add it to `script/install`'s `CORE_INSTALLERS`.
- If `bin/dot` has special pre/post sequencing around it, update `bin/dot` too. `bin/dot` can skip installers already handled directly via `script/install --skip <path>`.
- Extra args passed to `script/install` are forwarded to each installer (for example `script/install --force`).
- Consider whether `dot doctor` needs a corresponding check.

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
