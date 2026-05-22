# WezTerm

Gruvbox is configured in `wezterm.lua.symlink`.

## Theme switching

Default behavior follows macOS appearance:

- light appearance → `GruvboxLight`
- dark appearance → `GruvboxDark`

Persistent override options:

```sh
wezterm-theme light   # pin GruvboxLight
wezterm-theme dark    # pin GruvboxDark
wezterm-theme toggle  # toggle persisted light/dark
wezterm-theme system  # remove override; follow macOS again
wezterm-theme status  # print persisted preference

# Fish shortcut alias:
wzt toggle
wzt dark
wzt system
```

Inside WezTerm, `Cmd+Shift+T` also toggles Gruvbox light/dark for the current window and writes the same persisted preference to:

```txt
~/.config/wezterm/theme
```

The shell command touches `~/.wezterm.lua` after updating the preference so running WezTerm windows should reload automatically. If they do not, press `Cmd+R` in WezTerm to reload configuration.
