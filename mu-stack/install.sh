#!/bin/sh
# Safely update the canonical checkout, then invoke its standalone installer.
set -e

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
. "$DOTFILES_ROOT/lib/log.sh"
. "$DOTFILES_ROOT/mu-stack/config.sh"

stop() {
  log_error "mu-stack: $1" >&2
  log_hint "$2" >&2
  exit 1
}

for arg in "$@"; do
  case "$arg" in
    --force) ;; # Forwarded by script/install; never relax checkout/link safety.
    *) stop "Unknown argument: $arg" "Usage: dot skills [--force] (conflicts are never forced)" ;;
  esac
done

case "${HOME:-}" in
  /*) ;;
  *) stop "HOME must be an absolute directory" "Set HOME correctly, then retry dot skills." ;;
esac
checkout="$HOME/Code/mu-stack"
command -v git >/dev/null 2>&1 || stop "Git is missing" "Install Git, then retry dot skills."
if command -v mise >/dev/null 2>&1 && mise which -C "$DOTFILES_ROOT" node >/dev/null 2>&1; then
  run_node() { mise exec -C "$DOTFILES_ROOT" -- node "$@"; }
elif command -v node >/dev/null 2>&1; then
  run_node() { node "$@"; }
else
  stop "Node is missing" "Run $DOTFILES_ROOT/mise/install.sh, then retry dot skills."
fi

# Do not follow any checkout ancestor into someone else's directory.
path="$checkout"
while [ "$path" != / ]; do
  if [ -L "$path" ] || { [ -e "$path" ] && [ ! -d "$path" ]; }; then
    stop "Unsafe checkout path: $path" "Preserve this entry and move it aside manually; retry dot skills with real directories (use a physical HOME path)."
  fi
  path="$(dirname "$path")"
done

if [ ! -e "$checkout" ]; then
  mkdir -p "$HOME/Code"
  log_step "Cloning mu-stack into $checkout"
  if ! git clone -- "$MU_STACK_REMOTE" "$checkout"; then
    stop "Clone failed; installation did not run" "Check GitHub access and mu-stack/config.sh. Inspect any partial checkout before retrying dot skills."
  fi
fi

# rev-parse alone would accept an ordinary directory inside another repository.
if [ ! -e "$checkout/.git" ] || [ -L "$checkout/.git" ]; then
  stop "Not a standalone Git checkout: $checkout" "Preserve the directory and move it aside manually, or restore the intended mu-stack checkout."
fi
physical_checkout="$(cd "$checkout" && pwd -P)"
if ! toplevel="$(git -C "$checkout" rev-parse --show-toplevel 2>/dev/null)" || [ "$toplevel" != "$physical_checkout" ]; then
  stop "Foreign checkout path: $checkout" "Restore a standalone mu-stack working tree at this path; no files were replaced."
fi
if ! branch="$(git -C "$checkout" symbolic-ref --quiet --short HEAD)"; then
  stop "Detached HEAD at $checkout" "Select the intended tracking branch manually, then retry dot skills."
fi
if ! status="$(git -C "$checkout" status --porcelain --untracked-files=all)"; then
  stop "Cannot inspect $checkout" "Resolve the Git error before retrying dot skills."
fi
if [ -n "$status" ]; then
  stop "Dirty checkout: $checkout" "Review git -C \"$checkout\" status; commit or move your work manually, then retry dot skills. No stash or reset was attempted."
fi
remote="$(git -C "$checkout" config --get "branch.$branch.remote" || true)"
merge_ref="$(git -C "$checkout" config --get "branch.$branch.merge" || true)"
if [ -z "$remote" ] || [ "$remote" = . ] || [ -z "$merge_ref" ]; then
  stop "Missing remote upstream for $branch" "Review git -C \"$checkout\" branch -vv; configure the intended remote tracking branch, then retry dot skills."
fi
case "$merge_ref" in
  refs/heads/*) ;;
  *) stop "Unsupported upstream for $branch" "Configure a remote branch upstream, then retry dot skills." ;;
esac
actual_remote="$(git -C "$checkout" remote get-url "$remote" || true)"
if [ "$actual_remote" != "$MU_STACK_REMOTE" ]; then
  stop "Foreign upstream remote in $checkout" "Inspect git remote -v and mu-stack/config.sh; the upstream URL must match the configured mu-stack remote. No remote was rewritten."
fi

log_step "Fetching mu-stack upstream for $branch"
# Fetch the configured branch explicitly: a deleted branch must not silently use
# an old remote-tracking ref. No prune, forced refspec, pull, rebase, or stash.
if ! git -C "$checkout" fetch --no-tags -- "$remote" "$merge_ref"; then
  stop "Fetch failed; installation did not run" "Check remote access and the upstream branch, then retry dot skills. The working tree was not changed."
fi
target="$(git -C "$checkout" rev-parse --verify 'FETCH_HEAD^{commit}')"
if ! git -C "$checkout" merge-base --is-ancestor HEAD "$target"; then
  stop "Upstream is not a fast-forward (divergent or unpublished local commits)" "Review git -C \"$checkout\" log --oneline --graph --all. Reconcile or publish your work manually, then retry dot skills."
fi
if ! git -C "$checkout" -c merge.autoStash=false -c "branch.$branch.mergeOptions=" merge --ff-only --no-squash --no-autostash --no-overwrite-ignore --no-edit "$target"; then
  stop "Fast-forward failed; installation did not run" "Inspect git -C \"$checkout\" status and resolve the reported obstruction manually."
fi
if ! updated_head="$(git -C "$checkout" rev-parse --verify HEAD)" ||
   ! updated_status="$(git -C "$checkout" status --porcelain --untracked-files=all)"; then
  stop "Cannot verify the updated checkout; installation did not run" "Resolve the Git error above, then retry dot skills."
fi
if [ "$updated_head" != "$target" ] || [ -n "$updated_status" ]; then
  stop "Checkout did not reach a clean upstream HEAD; installation did not run" "Inspect git -C \"$checkout\" status and local Git configuration before retrying dot skills. No rollback was attempted."
fi
if [ ! -f "$checkout/scripts/install.mjs" ] || [ -L "$checkout/scripts/install.mjs" ]; then
  stop "Missing or unsafe scripts/install.mjs" "Restore the mu-stack standalone installer in the upstream repository, then retry dot skills."
fi
log_step "Installing canonical mu-stack skills"
if ! run_node "$checkout/scripts/install.mjs" all; then
  stop "Skill installation failed; dependent setup must stop" "Resolve the installer error above, then retry dot skills. The updated checkout is preserved; conflicts are never replaced."
fi
log_success "mu-stack checkout and skill links are current"
