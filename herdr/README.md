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

Recommended first-run integrations for active agents:

```bash
PI_CODING_AGENT_DIR="$HOME/.pi/work" herdr integration install pi
PI_CODING_AGENT_DIR="$HOME/.pi/personal" herdr integration install pi
herdr integration install claude
herdr integration install codex
herdr integration install opencode
```

Use `prefix+q` to detach and run `herdr` again to reattach.

## Inline images

`herdr/config.toml` enables Herdr's experimental Kitty graphics compositor so Pi image previews render instead of leaving blank rows. WezTerm supports the required Kitty graphics protocol.

After changing this setting, reload the server config:

```bash
herdr server reload-config
```

After upgrading Herdr, check for a stale running server with `herdr status`. If it reports `restart_needed: yes`, replace the server while preserving live pane processes, then reattach the client:

```bash
herdr server live-handoff
herdr
```

## Diff review companion

For agent-authored changes, keep Hunk open in a neighboring pane:

```bash
hdw # hunk diff --watch
```

Then ask an agent to `use hunk-review` to inspect the live session, navigate hunks, and leave inline notes.
