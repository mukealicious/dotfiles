# Herdr

Herdr is the terminal-native agent multiplexer for this dotfiles setup.

Installed by Homebrew from the top-level `Brewfile`:

```bash
brew install herdr
```

Start or reattach the default session from a project directory:

```bash
herdr
```

`herdr/install.sh` keeps the existing official integrations for installed
agents. For Pi, it refreshes exactly the supported `work` and `personal`
profiles. Herdr owns the generated integration source; this repository does not
vendor or hand-edit `herdr-agent-state.ts`, and it never refreshes the
deprecated `~/.pi/agent` fallback. Run these profile-scoped commands manually
only for troubleshooting or after a Herdr upgrade:

```bash
PI_CODING_AGENT_DIR="$HOME/.pi/work" herdr integration install pi
PI_CODING_AGENT_DIR="$HOME/.pi/personal" herdr integration install pi
```

Claude settings are shared across machines whose home directory names differ.
The tracked hook command therefore uses `$HOME`. The installer runs Herdr's
official Claude integration in a temporary staging directory, then installs the
generated hook into `~/.claude/hooks/` without writing a host-specific absolute
path into `claude/settings.json`.

Check each active profile without touching the fallback:

```bash
for profile in work personal; do
  PI_CODING_AGENT_DIR="$HOME/.pi/$profile" herdr integration status
done
```

Use `prefix+q` to detach and run `herdr` again to reattach.

## Attention and notification policy

The tracked config keeps managed-pane attention in Herdr: native Herdr toasts are
enabled, sounds are disabled, and Agent entries are sorted by priority. Pane
screen history remains ephemeral across full server restarts
(`experimental.pane_history = false`).
Pi's local OSC notification fallback is suppressed when `HERDR_ENV=1`, so a
managed Pi pane has one notification owner and no duplicate alert path.

After changing the config, validate and reload it from the active Herdr session:

```bash
HERDR_CONFIG_PATH="$HOME/.config/herdr/config.toml" herdr config check
herdr server reload-config
```

## Agent skill

Herdr 0.8+ exposes its release-matched upstream instructions with:

```bash
herdr --skill
```

This repo keeps one adapted global skill at `ai/skills/herdr/`; `ai/install.sh`
projects it into Pi, Claude, Codex, and OpenCode runtimes. Do not install a second
upstream `herdr` skill globally. Review `herdr --skill` when Herdr changes, then
adapt relevant CLI mechanics while retaining the local tab naming, layout, and
coordination policy.

## Inline images

`herdr/config.toml` enables Herdr's experimental Kitty graphics compositor so Pi image previews render instead of leaving blank rows. WezTerm supports the required Kitty graphics protocol.

After changing this setting, reload the server config:

```bash
herdr server reload-config
```

After upgrading Herdr, check for a stale running server with `herdr status`. A
Homebrew upgrade cannot live-handoff the running server. When it reports
`restart_needed: yes`, first checkpoint or finish important work, then stop and
restart Herdr from a terminal outside the session:

```bash
herdr server stop
herdr
```

Stopping the server exits its pane processes. Pi session files remain resumable,
but unsaved shell/editor state and ordinary long-running commands do not.

## Native isolated review: Herdr worktree + Pi + Hunk

Use Herdr's native worktree action when a review needs filesystem isolation. Herdr
owns the worktree and pane topology; the selected Pi profile owns the process and
session; Hunk owns user-facing diff annotations. This is not a second lifecycle
or worktree manager, and pane history remains disabled.

From the source repository, create the review workspace and read its returned IDs
instead of guessing them:

```bash
herdr worktree create \
  --cwd "$PWD" \
  --branch "review/<short-name>" \
  --label "π Review <short-name>" \
  --no-focus
```

Then split the returned root pane, label both sides, and start the supported
personal Pi profile beside a watched Hunk diff:

```bash
herdr pane split <root-pane-id> --direction right --ratio 0.5 --no-focus
herdr pane rename <root-pane-id> "pi"
herdr pane rename <hunk-pane-id> "hunk"
herdr pane run <root-pane-id> "pi-personal"
herdr pane run <hunk-pane-id> "hunk diff --watch"
```

Read current Hunk comments with `hunk session comment list --repo . --type user`.
Keep focus on the Pi pane; entering Hunk's interactive TUI is user-driven. When
finished, resolve or preserve the review changes, then remove the worktree through
Herdr only when its workspace is disposable:

```bash
herdr worktree remove --workspace <workspace-id>
```

For ordinary in-place changes, `hdw` remains the concise companion:

```bash
hdw # hunk diff --watch
```
