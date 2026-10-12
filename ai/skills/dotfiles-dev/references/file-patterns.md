# Dotfiles File Patterns

Read this reference before changing shell scripts, symlinks, aliases, or topic
setup. `~/.dotfiles/AGENTS.md` owns installer ordering and toolchain boundaries.

## Auto-processed Patterns

| Pattern | Behavior | Owner |
|---|---|---|
| `*.symlink` | Strip the suffix, add a dot, and link to `~/.<name>` | `script/symlink` |
| `aliases.fish` | Link to Fish `conf.d/<topic>-aliases.fish` | `fish/install.sh` |
| `keybindings.fish` | Link to Fish `conf.d/<topic>-keybindings.fish` | `fish/install.sh` |
| `install.sh` | Run in core order, then sorted discovery | `script/install` |

Use [the topic workflow](../SKILL.md#add-a-topic) when adding a tool. Before
changing orchestration, inspect `script/install`'s `CORE_INSTALLERS` and any direct
handling in `bin/dot`. Extra installer arguments are forwarded, including
`--force`. Consider whether `bin/dot-doctor` needs a corresponding read-only check.

## Topic Installer Template

For an `install.sh` one directory below the repository root:

```sh
#!/bin/sh
set -e

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
. "$DOTFILES_ROOT/lib/symlink.sh" # Also loads lib/log.sh.

FORCE=false
for arg in "$@"; do
  case "$arg" in
    --force) FORCE=true ;;
  esac
done
```

Use `lib/log.sh` directly when no symlink helper is needed. Inspect the helper
definitions before changing logging or link behavior rather than copying them.

### Safe Glob Iteration

For ordinary source files:

```sh
for file in "$DIR"/*; do
  [ -e "$file" ] || continue
  # Process the file.
done
```

When inspecting links, also test `-L`: `-e` alone misses a dangling symlink.
`ensure_symlink` handles writes; `check_symlink` handles read-only diagnostics.
The shared helper preserves conflicts by default; `FORCE=true` repairs misdirected
links and backs up regular files/directories before replacing them.

### Failure Handling

`set -e` is suppressed for commands used as `if`/`while` tests and non-final
commands in `&&`/`||` lists. Use explicit `if` blocks for expected failures
and recovery; a failed non-final test is not an automatic script exit.

```sh
if command -v mytool >/dev/null 2>&1; then
  # Configure the existing tool.
  :
else
  # Perform the topic's required setup or report the missing dependency.
  :
fi
```

Completion means required setup succeeded or a failure was reported. Tool presence
alone is not proof that its configuration is correct.
