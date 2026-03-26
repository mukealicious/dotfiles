# Stream Deck

Automation scripts for Elgato Stream Deck Neo (4x2 keys + touchstrip, 3 pages).

## How It Works

Stream Deck's "System: Open" action opens files with their default handler.
Shell scripts (`.sh`) open in a text editor — they don't execute.
So each script gets a tiny `.app` wrapper (built via `osacompile`) that the
Stream Deck can actually launch.

```
scripts/workspace-notes.sh     <- the logic
apps/WorkspaceNotes.app         <- thin wrapper that calls the script
icons/notes.png                 <- 144x144 button icon
```

The `install.sh` rebuilds all `.app` wrappers from scripts automatically.

## Layout

### Page 1 — Workspaces & Tools (current main page)

| Position | Label | Action | AeroSpace WS |
|----------|-------|--------|-------------|
| 0,0 | Notes | `workspace-notes.sh` — VSCode + moya-glava | N |
| 0,1 | Conductor | `workspace-conductor.sh` | C |
| 1,0 | Cmux | `workspace-cmux.sh` | C |
| 1,1 | Terminal | `workspace-wezterm.sh` | T |
| 2,0 | SW Mode | hotkey (Ctrl+Cmd+K) | — |
| 2,1 | SW Rec | hotkey (Ctrl+Space) | — |
| 3,0 | *(open)* | | |
| 3,1 | *(open)* | | |

### Page 2 — Media Controls

Standard multimedia (play/pause, skip, volume). Unchanged from default.

### Page 3 — TBD

Candidates: coffee toggle, screen studio, Pomodoro timer, DND toggle.

## Adding a New Workspace Button

1. Create `scripts/workspace-<name>.sh` following the pattern below
2. `chmod +x` it
3. Run `install.sh` (or `dot`) to generate the `.app` wrapper
4. In the Stream Deck profile JSON (or UI), add a "System: Open" action
   pointing to `~/.dotfiles/streamdeck/apps/Workspace<Name>.app`
5. Add an icon to `icons/` (144x144 PNG, RGBA)

## Script Pattern

Each workspace launcher follows this structure — check if the window exists
first (instant switch), otherwise launch and poll until AeroSpace sees it:

```sh
#!/bin/sh
set -e
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

APP="AppName"
WORKSPACE="X"

# Fast path: window already exists
WINDOW_ID=$(aerospace list-windows --all 2>/dev/null \
  | grep -i "$APP" | head -1 | awk '{print $1}')

if [ -n "$WINDOW_ID" ]; then
  aerospace move-node-to-workspace "$WORKSPACE" --window-id "$WINDOW_ID"
  aerospace workspace "$WORKSPACE"
  exit 0
fi

# Cold launch: open app and poll for up to 5s
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
- `export PATH` is required — `.app` wrappers don't inherit shell PATH
- Poll loop handles the delay between `open -a` and AeroSpace registering the window
- `grep -i` match should be specific enough to find the right window

## App Wrapper Generation

The `install.sh` script auto-generates `.app` bundles from shell scripts using:

```sh
osacompile -o apps/WorkspaceFoo.app \
  -e 'do shell script "~/.dotfiles/streamdeck/scripts/workspace-foo.sh &> /dev/null &"'
```

These are throwaway build artifacts — don't commit them. Only the scripts matter.

## Icon Generation

Icons are 144x144 PNG (RGBA). Best approach: extract the actual app icon using `sips`:

```sh
# Extract from .icns and resize to 144x144
sips -s format png -z 144 144 \
  "/Applications/Foo.app/Contents/Resources/AppIcon.icns" \
  --out icons/foo.png
```

## Profile Location

```
~/Library/Application Support/com.elgato.StreamDeck/ProfilesV3/
  5349C59A-57AE-490D-A8FA-234E9FFC4DC7.sdProfile/
    manifest.json                       # device info + page order
    Profiles/
      9C17BCE8-.../manifest.json        # Page 1 — Workspaces (main)
      886B1AC7-.../manifest.json        # Page 2 — Media
      635A3D98-.../manifest.json        # Page 3 — TBD
```

Profile JSON can be edited directly — restart Stream Deck after changes.
The V2 directory exists but V3 is authoritative.

## Gotchas

- **"Open" on .sh opens in editor**: Use `.app` wrappers, not raw scripts.
- **PATH not available in .app context**: Always `export PATH` in scripts.
- **AeroSpace window detection is async**: New windows take 0.5-2s to appear
  in `aerospace list-windows`. The poll loop handles this.
- **Stream Deck caches aggressively**: Force-kill and relaunch after profile edits.
  Sometimes `killall "Stream Deck"` isn't enough — use `kill -9`.
- **V2 vs V3 profiles**: Both directories exist. V3 uses actual UUIDs as
  directory names and is what the app reads. Edits to V2 may be ignored.
