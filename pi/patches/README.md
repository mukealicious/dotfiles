# Local Pi package patches

`mitsupi-1.6.0-prompt-editor.patch`,
`mitsupi-1.6.0-prompt-editor-theme.patch`, and
`mitsupi-1.6.0-files-shortcut.patch` are exact-context local patches for the
pinned `npm:mitsupi@1.6.0` package.

The base prompt-editor patch adds native Pi `max` thinking support to both
prompt-editor paths, removes the fresh-profile convenience mode named `fast`,
and adapts the mode model picker to the current Pi runtime contract. The
separate theme patch captures the active theme before installing the custom
editor so mode-border colors stay available during later renders. Keeping it
separate lets existing profiles upgrade from the previously patched state. The
theme-lifetime workaround follows upstream commit `620e40df1a` while the
package remains pinned to `1.6.0`.

The files-shortcut patch removes Mitsupi's `Ctrl+Shift+F` Finder-reveal
shortcut, leaving Pi's built-in transcript search on that key. `/files` and
Mitsupi's remaining file shortcuts stay available.

`pi/install.sh` validates both profile copies against each patch independently,
accepts original or already-patched context, and refuses to mutate an unknown
package context. Do not refresh or apply these patches to another Mitsupi
release without a reviewed context update.
