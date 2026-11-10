# mu-stack update integration

Dotfiles owns checkout synchronization. mu-stack owns its standalone skill
installer and canonical content. No update code is required inside mu-stack.

## Commands and ownership

```sh
dot skills                       # Update/bootstrap mu-stack, then install its links
~/.dotfiles/mu-stack/install.sh   # Exactly the same topic entry point
```

`dot skills` does not update Homebrew, runtimes, macOS defaults, instructions,
or harness settings. It uses the installed mise-managed Node when available,
with Node on PATH as a fallback. Git and Node must already be installed.

The full `dot` workflow delegates ordering to `script/install`:

```text
mise → other foundational setup → ai → mu-stack → claude → opencode → pi
```

`ai/install.sh` is independent of mu-stack: it owns local instructions and the
2 machine-owned skills, and retires exact old managed links. mu-stack failure
stops dependent harness setup and remaining installers. Earlier full-update
steps are not rolled back. The full update invokes mu-stack only once.

The topic runs `node ~/Code/mu-stack/scripts/install.mjs all` only after a
successful checkout update. Claude and Codex receive canonical skill links;
Pi reads the same checkout through its existing local package selection.
The standalone installer remains usable without dotfiles and without a Git
update. It preserves foreign destination collisions even with `dot --force`.

## Checkout policy

- Checkout: `~/Code/mu-stack`, matching managed Pi settings.
- Configured remote: `https://github.com/mukealicious/mu-stack.git`, owned by
  `mu-stack/config.sh`. Access to the private repository requires GitHub
  authentication through the existing Git credential setup. Credentials do not belong in dotfiles.
- `MU_STACK_REMOTE` can override the remote for an intentional mirror or tests.
  Tests use temporary local bare remotes and isolated homes.
- Missing checkout: clone the configured remote and use its default branch.
- Existing checkout: require a real Git working tree, a clean tracked/untracked
  state, an attached branch, and a remote upstream whose URL exactly matches
  the configured remote. Other URL spellings are not silently accepted.
- Fetch the upstream branch explicitly; a deleted branch or fetch failure stops
  installation instead of using an old remote-tracking ref.
- Fast-forward only. Divergent history and unpublished local commits stop the
  update. No stash, reset, rebase, forced checkout, or automatic remote rewrite.
  Command-scoped overrides disable autostash and branch merge options (including
  `--squash`). Before installation, verify that HEAD equals the fetched commit
  and that the tracked/untracked working tree remains clean.
- Refuse symlinked checkout ancestors and foreign files/directories. Use a
  physical absolute HOME path. Ignored files can remain, but an upstream update
  cannot overwrite them (`--no-overwrite-ignore`).

A failed update never invokes the skill installer. An installation failure can
leave the successfully updated checkout in place; the topic does not roll back
Git history. Installed canonical links already refer to that checkout, so their
content changes when it advances. Resolve the reported issue and rerun.

## Initial extraction cutover

If `dot skills` reports collisions with old dotfiles-managed skill links:

```sh
~/.dotfiles/ai/install.sh
dot skills
```

AI cleanup removes only exact retired dotfiles links. Inspect any remaining
foreign files or links and move them aside manually only if appropriate.
Do not use forced replacement to resolve skill ownership. Full `dot` already
runs AI cleanup before mu-stack; the scoped command deliberately does not run
independent AI setup.

## Recovery

| Failure | Action; existing work stays preserved |
|---|---|
| Clone/fetch access | Check GitHub access to the private repository and configured remote; inspect partial clone paths before retrying |
| Dirty checkout | Review `git -C ~/Code/mu-stack status`; commit or move the work manually |
| Detached HEAD | Select the intended tracking branch manually |
| Missing upstream | Inspect `git -C ~/Code/mu-stack branch -vv` and set the intended remote upstream |
| Foreign remote | Inspect `git remote -v` inside the checkout and `mu-stack/config.sh`; correct the configuration deliberately |
| Divergent/ahead history | Review the graph; reconcile or publish local commits manually |
| Foreign checkout path | Preserve and move the conflicting entry manually, or restore the intended checkout |
| Ignored-file obstruction | Preserve or move the ignored file manually before updating |
| Skill destination collision | Inspect the standalone installer's path; preserve or move the foreign entry manually |

Retry `dot skills` after recovery. `dot doctor` remains read-only and provides
package/link diagnostics; it does not fetch or prove remote freshness.

Updating the canonical mu-stack repository does not automatically adopt changes
from third-party skill sources. Their provenance and review policy stay in
mu-stack.

## Validation

```sh
node --test mu-stack/test-update.mjs
sh ai/test-skill-doctor.sh
shellcheck -x bin/dot script/install mu-stack/install.sh mu-stack/config.sh
```

The integration suite reads `~/Code/mu-stack/scripts/install.mjs`, or the checkout
selected by `MU_STACK_DIR`, and copies it into disposable local repositories.
It invokes copies of the actual `bin/dot`, `script/install`, and topic entry
point. Full-flow fixtures replace every unrelated installer and package-manager
command with logging stubs. No live checkout, skill installation, remote push,
or unrelated machine update occurs. Tests create commits and pushes only inside
temporary local fixture repositories, then remove those repositories.
