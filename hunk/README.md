# Hunk

Terminal-native diff review for agent-heavy workflows.

Installed through the normal dotfiles workflow:

```bash
dot
```

`dot` installs Hunk from Homebrew core, links `~/.config/hunk/config.toml`,
installs the pinned
[`hunk-commit-log`](https://github.com/sadick254/hunk-commit-log)
extension, and projects the Fish aliases and `hunk-review` agent skill.

## Daily workflow

Review current changes, including untracked files:

```bash
hd
# or: hunk diff
```

Keep a live review open while agents edit files:

```bash
hdw
# or: hunk diff --watch
```

Review commits:

```bash
hs
hunk show HEAD~1
```

The commit-log extension adds the commit message and branch history to a
single-commit review. Use `n`/`p` to move through that history, `h` to toggle
the commit list, `i` to toggle the message, and `I` to expand it. The audited
extension revision is pinned in `hunk/install.sh`; update that commit
deliberately after reviewing upstream changes.

### Review a feature branch commit by commit

`hunk diff --watch` remains a working-tree review, while
`hunk diff origin/main...HEAD` produces one aggregate branch diff. The commit
list appears only when reviewing a single commit with `hunk show`.

Set the branch's actual base in that repository's `.hunk/config.toml`:

```toml
[extension.hunk-commit-log]
range = "origin/main..HEAD"
```

Restart Hunk after changing extension configuration, then open a commit in the
range:

```bash
hunk show HEAD
```

Starting at `HEAD`, use `p` to move toward older commits. To read the branch in
chronological order, click the oldest commit and use `n` to move forward.
Without a configured range, the extension shows up to 20 recent commits ending
at the reviewed commit, which may include base-branch history. Do not set the
range globally because repositories use different base branches.

## Agent-assisted review

1. Open a Hunk review in a Herdr pane: `hdw`.
2. In an agent pane, ask: `Use hunk-review to review this diff.`
3. The agent can inspect the live session, navigate to relevant hunks, and add inline notes.

Useful session commands:

```bash
hunk session list
hunk session review --repo . --json
hunk session comment list --repo .
```

## Spec review loop

Use Markdown plus Hunk for durable spec review; do not add a second planning or
annotation runtime:

1. Open `hunk diff --watch` so tracked and untracked Markdown is visible.
2. The agent reads current user comments with
   `hunk session comment list --repo . --type user`.
3. The agent edits the same spec, then reloads the live review. Empty comments
   never imply approval; implementation starts only after direct user approval.
4. Hunk owns user-facing annotations. `/skill:code-review` remains the separate
   advisory code-review workflow, not a mandatory follow-up.

## Git opt-in aliases

The Git config includes opt-in Hunk-pager aliases:

```bash
git hdiff
git hshow HEAD~1
```

`hunk diff`/`hd` is usually better for working-tree reviews because it includes untracked files by default.
