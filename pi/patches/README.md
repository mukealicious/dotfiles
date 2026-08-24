# Local Pi package patches

`mitsupi-1.6.0-prompt-editor.patch` and
`mitsupi-1.6.0-files-shortcut.patch` are exact-context local patches for the
pinned `npm:mitsupi@1.6.0` package.

The prompt-editor patch adds native Pi `max` thinking support to both
prompt-editor paths, removes the fresh-profile convenience mode named `fast`,
and adapts the mode model picker to the current Pi runtime contract.

The files-shortcut patch removes Mitsupi's `Ctrl+Shift+F` Finder-reveal
shortcut, leaving Pi's built-in transcript search on that key. `/files` and
Mitsupi's remaining file shortcuts stay available.

`pi/install.sh` validates both profile copies against each patch independently,
accepts original or already-patched context, and refuses to mutate an unknown
package context. Do not refresh or apply these patches to another Mitsupi
release without a reviewed context update.
