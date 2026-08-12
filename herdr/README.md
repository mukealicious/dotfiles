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

`herdr/install.sh` refreshes integrations for both Pi profiles and the installed
Claude, Codex, and OpenCode CLIs. Run these manually only for troubleshooting:

```bash
PI_CODING_AGENT_DIR="$HOME/.pi/work" herdr integration install pi
PI_CODING_AGENT_DIR="$HOME/.pi/personal" herdr integration install pi
herdr integration install claude
herdr integration install codex
herdr integration install opencode
```

Use `prefix+q` to detach and run `herdr` again to reattach.

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

## Diff review companion

For agent-authored changes, keep Hunk open in a neighboring pane:

```bash
hdw # hunk diff --watch
```

Then ask an agent to `use hunk-review` to inspect the live session, navigate hunks, and leave inline notes.
