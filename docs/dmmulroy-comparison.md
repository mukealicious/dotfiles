# Dotfiles Comparison: `missoula` vs `dmmulroy` (2026 refresh)

This refresh replaces the older ZSH-era comparison.

Your repo has moved a lot since then:

- Fish is already your interactive shell
- tmux is already present for session persistence
- AI setup is now installer-managed and harness-portable
- topic-specific installers do more than simple symlinking

So the question is no longer _"should I copy his architecture?"_.

It is now:

> Which targeted ideas from `dmmulroy/.dotfiles` are still a net win for this repo?

## Quick take

- Keep your topic-centric layout
- Keep your installer/projection model
- Borrow a few workflow ergonomics
- Do **not** migrate wholesale to Stow or a giant single-file CLI

## Snapshot

| Area | Your repo | His repo | Takeaway |
| --- | --- | --- | --- |
| Install model | `*.symlink` + topic installers + managed AI assembly | `home/` mirror + GNU Stow + large `dot` CLI | Keep your structure; borrow specific commands |
| Shell | Fish + topic aliases + focused utility functions | Fish + `conf.d` + huge generated git abbreviation layer | Borrow abbreviations, not the whole shell stack |
| Packages | Single `Brewfile` + `dot`/installers | Split `packages/bundle` + `bundle.work` + package subcommands | Consider split bundles only if you want machine profiles |
| Tmux | Minimal, practical, already has resurrect/continuum | Heavier tmux workflow, more bindings, more polish | Borrow a few ergonomic binds if they feel good |
| AI tooling | Shared instructions, shared skills, harness-specific appendices, runtime projections | Useful AGENTS + OpenCode-centric helpers | You are already ahead here |
| Complexity | Many small scripts and topic folders | One very capable but very large Bash CLI | Prefer incremental additions over centralization |

## What is actually worth borrowing

### 1. Fish git abbreviations

This is the clearest day-to-day win.

His repo has a large, well-organized git abbreviation layer driven by `__git.init.fish`.
Your repo already has the supporting primitives and several matching helper functions:

- `__git.default_branch`
- `gwip`
- `gunwip`
- `gtest`
- `grename`
- `gbda`

What you are missing is the _interactive shorthand surface area_.

The best move is **not** to port the full 180-ish abbreviation set. Instead, add a curated subset of high-frequency commands:

- `g`, `ga`, `gaa`
- `gc`, `gca`, `gcm`
- `gd`, `gds`
- `gf`, `gfa`
- `gl`, `glr`, `glog`
- `gp`, `gp!`, `gpu`
- `grb`, `grbi`
- `gst`, `gsb`
- `gco`, `gcb`
- `gsw`, `gswc`
- `gsta`, `gstp`
- `gwt`, `gwta`

Why this is worth it:

- Fish abbreviations expand visibly before execution
- They preserve readability better than opaque aliases
- They fit your existing Fish-first workflow cleanly

### 2. A real `dot doctor`

This is the strongest structural idea to steal from his repo.

Your setup now has more moving parts than his in a few important places:

- symlinked top-level dotfiles
- Fish config projections
- tmux plugins
- AI instruction assembly
- shared skill runtime projections
- multiple agent install targets

A `dot doctor` command would pay for itself quickly.

It should check things that are specific to **your** architecture, not just generic Homebrew state:

- required CLIs: `brew`, `fish`, `tmux`, `starship`, `bun`, `uv`
- expected top-level symlinks like `.gitconfig`, `.tmux.conf`, `.wezterm.lua`, `.aerospace.toml`
- Fish targets under `~/.config/fish/`
- TPM presence under `~/.tmux/plugins/tpm`
- assembled instruction files for Claude, Pi, OpenCode, Codex, and Gemini
- managed agent/runtime outputs that `ai/install.sh` owns

If you only borrow one big idea, borrow this one.

### 3. Fish completions for `dot`

This is a nice companion to `dot doctor`.

Your repo already has `fish/completions/`, so the integration path is obvious.
Once `dot` grows even a small subcommand surface, completions make the management flow feel much more first-class.

Suggested scope:

- `dot doctor`
- `dot --edit`
- any future `dot install`, `dot link`, or `dot fix` commands

This is low-risk and very on-brand for the repo as it exists today.

### 4. Optional package profile splitting

His `packages/bundle` + `bundle.work` split is a good pattern **if** you want different install surfaces across machines.

That is useful when you want distinctions like:

- base vs optional
- personal vs work
- laptop vs desktop

If you are mostly targeting one main machine profile, your current single `Brewfile` is still fine.

So this is worth borrowing only if you already feel pressure from package sprawl.

### 5. Small tmux ergonomics

You already have the main tmux win: session persistence.

That means the remaining value is polish, not architecture:

- richer copy-mode bindings
- resize-pane bindings
- maybe auto-installing TPM plugins instead of requiring manual `prefix + I`

These are worth sampling, but they are lower priority than git abbreviations or `dot doctor`.

## What is **not** worth borrowing

### 1. Full GNU Stow migration

Earlier this looked more attractive.
It no longer does.

Your repo now has topic-specific installers and installer-managed outputs that go beyond plain symlinks. A full `home/` mirror would fight that structure more than it would help it.

If nested config paths become painful, solve that surgically instead of rewriting the repository layout.

### 2. A giant monolithic `dot` script

His `dot` script is impressive, but it centralizes many unrelated concerns into one very large Bash file.

Your repo is better served by a thin command surface over smaller scripts.
Steal the command ideas, not the implementation shape.

### 3. OpenCode-specific AI summary plumbing

You already have a stronger cross-harness AI architecture than his repo.

If you want commit summaries or PR drafting, the better home is:

- a portable skill
- a shared helper script
- or a harness-aware command assembled from your existing AI layer

Not a tool-specific feature branch inside the dotfiles core.

### 4. Taste-driven wholesale swaps

Things like Ghostty, jj, Catppuccin, fnm, fisher, or Neovim plugin choices are mostly adjacent preferences.

Borrow workflow improvements, not ecosystem churn.

## Recommended order of operations

If you want to bring over ideas incrementally, this is the sequence I would use:

1. Add curated Fish git abbreviations
2. Add `dot doctor`
3. Add Fish completions for `dot`
4. Revisit package profile splitting only if you still want it

## Bottom line

The refreshed comparison is much simpler than the old one:

- your repo is already ahead on AI portability and multi-tool instruction management
- your current architecture is worth keeping
- the biggest wins left in his repo are interactive shell ergonomics and environment diagnostics

If you want the shortest possible recommendation:

> Bring in git abbreviations and a `dot doctor`. Leave the rest.
