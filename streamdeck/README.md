# Stream Deck

Automation for Elgato Stream Deck Neo (4x2 keys + touchstrip, 3 pages).

## Ownership Model

This topic now manages both:

- launcher scripts in `streamdeck/scripts/`
- the repo-managed workspace page defined in `streamdeck/layouts/workspaces.json`

`install.sh` does two things:

1. rebuilds `.app` wrappers in `streamdeck/apps/`
2. syncs the managed page into Stream Deck's live `ProfilesV3/` directory

That means pulling dotfiles on another machine and running `dot` will apply the
same managed workspace page there too, as long as Stream Deck has a matching
profile name available.

## How It Works

Stream Deck's `System: Open` action opens files with their default handler.
Shell scripts (`.sh`) open in a text editor rather than executing, so each
script gets a tiny `.app` wrapper built with `osacompile`.

```text
scripts/workspace-notes.sh      <- launcher logic
apps/WorkspaceNotes.app         <- thin wrapper Stream Deck launches
layouts/workspaces.json         <- repo-managed page definition
icons/notes.png                 <- icon source copied into live profile
```

## Managed Page

Canonical source:

- `streamdeck/layouts/workspaces.json`

Current layout:

| Position | Label | Type | Target |
|---|---|---|---|
| 0,0 | Notes | Open | `apps/WorkspaceNotes.app` |
| 0,1 | Conductor | Open | `apps/WorkspaceConductor.app` |
| 1,1 | Terminal | Open | `apps/WorkspaceWezterm.app` |
| 2,0 | SW Mode | Hotkey | `Ctrl+Cmd+K` |
| 2,1 | SW Rec | Hotkey | `Ctrl+Space` |

The sync script names the managed page:

- `Dotfiles Workspaces`

On first sync it will either:

- adopt an existing page that already points at the repo-managed workspace apps, or
- create a managed page and add it to the profile's page list

Default target profile name:

- `Default Profile`

If the configured profile name does not exist on a machine, sync now fails fast
instead of guessing another local profile.

## Files

```text
streamdeck/
├── bin/sync-profile            # sync layout JSON into live Stream Deck profile
├── layouts/workspaces.json     # source of truth for managed page
├── scripts/workspace-*.sh      # launcher logic
├── icons/*.png                 # source icons
├── apps/*.app                  # generated wrappers (ignored)
└── install.sh                  # rebuild wrappers + sync managed page
```

## Adding or Removing a Button

1. Edit `streamdeck/layouts/workspaces.json`
2. If needed, add/update a launcher in `streamdeck/scripts/`
3. If needed, add/update an icon in `streamdeck/icons/`
4. Run `dot` or `streamdeck/install.sh`
5. Restart Stream Deck if the page does not refresh immediately

No manual JSON edits in `~/Library/Application Support/com.elgato.StreamDeck/`
should be needed for managed keys.

## Layout Schema

Each key in `layouts/workspaces.json` is keyed by Stream Deck position.

### Open action

```json
"0,0": {
  "type": "open",
  "title": "Notes",
  "icon": "icons/notes.png",
  "path": "apps/WorkspaceNotes.app"
}
```

### Hotkey action

```json
"2,0": {
  "type": "hotkey",
  "title": "SW Mode",
  "icon": "icons/sw-mode-labeled.png",
  "settings": {
    "Coalesce": true,
    "Hotkeys": [ ... ]
  }
}
```

Paths are resolved relative to `streamdeck/` unless absolute.

## Launcher Script Pattern

Each workspace launcher follows this structure:

```sh
#!/bin/sh
set -e
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

APP="AppName"
WORKSPACE="X"

WINDOW_ID=$(aerospace list-windows --all 2>/dev/null \
  | grep -i "$APP" | head -1 | awk '{print $1}')

if [ -n "$WINDOW_ID" ]; then
  aerospace move-node-to-workspace "$WORKSPACE" --window-id "$WINDOW_ID"
  aerospace workspace "$WORKSPACE"
  exit 0
fi

open -a "$APP"

i=0
while [ $i -lt 10 ]; do
  sleep 0.5
  WINDOW_ID=$(aerospace list-windows --all 2>/dev/null \
    | grep -i "$APP" | head -1 | awk '{print $1}')
  if [ -n "$WINDOW_ID" ]; then
    aerospace move-node-to-workspace "$WORKSPACE" --window-id "$WINDOW_ID"
    break
  fi
  i=$((i + 1))
done

aerospace workspace "$WORKSPACE"
```

Key details:

- `export PATH` is required in `.app` context
- AeroSpace window detection is async, so polling is expected
- the `grep -i` match should be specific enough to find the right window

## Sync Details

Live Stream Deck state still lives under:

```text
~/Library/Application Support/com.elgato.StreamDeck/ProfilesV3/
```

But repo-managed updates are applied by `bin/sync-profile`, which:

- finds the target Stream Deck profile by name
- finds or creates the managed page
- rewrites the page manifest from `layouts/workspaces.json`
- copies repo icons into the page `Images/` directory
- preserves non-keypad controllers from the existing page template

## Gotchas

- Stream Deck caches aggressively; restart it after layout changes if needed
- `.app` wrappers do not inherit your shell PATH
- `apps/*.app` are build artifacts; do not commit them
- unmanaged pages can still be edited in the Stream Deck UI without affecting the managed page
