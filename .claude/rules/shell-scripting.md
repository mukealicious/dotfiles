# Shell Scripting in Dotfiles

When writing or modifying shell scripts in this repository:

## Required Patterns

```sh
#!/bin/sh
set -e

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
```

## Safe Iteration

```sh
# Always check existence before processing
for file in "$DIR"/*; do
  [ -e "$file" ] || continue
  # process file
done
```

## set -e Gotchas

- `&&` chains: if first command fails, script exits (no fallback)
- Use explicit `if` blocks when you need to handle failure cases
- `[ -L "$link" ] && [ ! -e "$link" ] && rm "$link"` - if `[ -L ]` returns false, subsequent conditions don't run but no error occurs (`set -e` only triggers on the final command's exit code)

## Symlink Helper Pattern

Use `ensure_symlink` from `ai/install.sh` as the canonical implementation:
- Check if symlink vs regular file
- Validate target matches expected source
- Handle broken symlinks (remove and recreate)
- Warn with actionable fix command for misdirected symlinks
- Support `--force` flag for automated fixes

## Mistakes to Avoid

- Don't assume existing symlinks point to correct targets
- Don't let multiple scripts manage the same config directories
- Don't rely on `find | while` for order-dependent operations
- Don't skip dead symlink cleanup before creating new ones
