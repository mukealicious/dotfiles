# Superwhisper

Backup of custom modes and settings from `~/Documents/superwhisper`.
Recordings and downloaded models are intentionally excluded from git.

## Refresh the backup

```sh
rsync -a --delete "$HOME/Documents/superwhisper/modes/" "$HOME/.dotfiles/superwhisper/modes/"
rsync -a --delete "$HOME/Documents/superwhisper/settings/" "$HOME/.dotfiles/superwhisper/settings/"
```

## Restore

Quit Superwhisper before restoring, then run:

```sh
mkdir -p "$HOME/Documents/superwhisper/modes" "$HOME/Documents/superwhisper/settings"
rsync -a --delete "$HOME/.dotfiles/superwhisper/modes/" "$HOME/Documents/superwhisper/modes/"
rsync -a --delete "$HOME/.dotfiles/superwhisper/settings/" "$HOME/Documents/superwhisper/settings/"
```
