# Hunk

Terminal-native diff review for agent-heavy workflows.

Installed through the normal dotfiles workflow:

```bash
dot
```

`dot` installs Hunk from the top-level `Brewfile`, links `~/.config/hunk/config.toml`, and projects the Fish aliases and `hunk-review` agent skill.

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

## Git opt-in aliases

The Git config includes opt-in Hunk-pager aliases:

```bash
git hdiff
git hshow HEAD~1
```

`hunk diff`/`hd` is usually better for working-tree reviews because it includes untracked files by default.
