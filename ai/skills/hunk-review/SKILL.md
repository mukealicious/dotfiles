---
name: hunk-review
description: Interacts with live Hunk working-tree, commit, and branch review sessions. Use when the user has Hunk open, wants an interactive diff or commit-series review, or wants inline review comments and guided navigation.
compatibility: Requires hunk CLI and a live Hunk TUI session for session commands. Commit-series UI requires the hunk-commit-log extension.
metadata:
  watch-sources: |
    modem-dev/hunk/skills/hunk-review/SKILL.md@a9de1b37cda24ede0bb0dc9cedd5d24dcaad65d2
    sadick254/hunk-commit-log/README.md@aac1a9b7fc1dda7fc47f058b7c35a0dbe202dec9
---

# Hunk Review

## Load Hunk's Installed Guide First

For every Hunk review, load the workflow matched to the installed binary before
using session commands:

```bash
hunk skill path
```

Read the returned `SKILL.md` completely and follow it. It is authoritative for
current session selection, inspection, navigation, reload, comment, highlight,
and error-handling syntax. This local skill only adds dotfiles-specific review
modes and policies; do not substitute it for the installed guide.

Hunk's TUI is for the user. Do not run interactive `hunk diff`, `hunk show`, or
similar commands yourself unless explicitly asked. Control an existing window
with `hunk session ...` commands.

## Choose the Review Mode

| Goal | User-facing command | Commit-log behavior |
|---|---|---|
| Uncommitted working-tree changes | `hunk diff --watch` | Inactive; the left pane is Hunk's file tree |
| One commit plus recent history | `hunk show <ref>` | Active; defaults to up to 20 commits ending at `<ref>` |
| A feature branch one commit at a time | Configure the branch range, then `hunk show <ref>` | Active; shows the configured series |
| One aggregate branch diff | `hunk diff <base>...<branch>` | Inactive; this is one combined diff, not a commit series |

A title containing `working tree` confirms a working-tree review. The commit-log
extension only activates for a single-commit `show` review.

## Review a Feature Branch Commit by Commit

Prefer repository-local configuration because base branches differ. Before
starting Hunk, add the actual base range to `.hunk/config.toml`:

```toml
[extension.hunk-commit-log]
range = "origin/main..HEAD"
```

Then open any commit contained in that range:

```bash
hunk show HEAD
```

At `HEAD`, press `p` to move toward older commits and `n` to move toward newer
ones. The commit list is oldest-first, so the user can also click the oldest row
and then use `n` to review the branch chronologically. Use `h` to toggle the
commit list, `i` to toggle the commit message, and `I` to expand or collapse the
message.

Important details:

- Replace `origin/main` with the repository's real base branch.
- Do not set one global range; `main`, `master`, release branches, and stacked
  branch bases vary by repository.
- Without `range`, the extension shows recent history and may include commits
  from the base branch.
- If `range` does not contain the shown commit, the extension silently falls
  back to recent history.
- Restart Hunk after changing extension configuration; reloading a changeset
  does not re-register the extension.

For an existing live session, switch modes only when the user wants its contents
replaced:

```bash
hunk session reload --repo . -- show HEAD
hunk session reload --repo . -- diff
```

## Local Review Policy

For Markdown specs, read current user comments with
`hunk session comment list --repo . --type user`, edit the same file, and reload
the live review. Empty comments are not approval; direct user approval is the
gate to implementation.

If a `show` review lacks the commit panes, run `hunk extension list`, confirm
`hunk-commit-log` is installed, and check whether the terminal is wide enough
for a side pane before changing configuration.
