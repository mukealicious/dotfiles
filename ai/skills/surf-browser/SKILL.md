---
name: surf-browser
description: Use for browser automation in this dotfiles setup, especially real logged-in browsing. Use surf-brave for the default Brave browser and surf-edge for work/Edge. Use agent-browser only for headless or isolated test automation.
---

# Surf Browser

Use Surf when an agent needs to inspect, click through, screenshot, or read a real browser page using the user's logged-in browser state.

## Browser lanes

This dotfiles setup uses per-browser sockets:

| Situation | Command | Browser |
|---|---|---|
| Default agent browsing | `surf-brave` | Brave (`surf`, dedicated user data) |
| Work / corporate / Edge-specific browsing | `surf-edge` | Microsoft Edge |

The wrappers set `SURF_SOCKET` so Brave and Edge do not compete for Surf's default `/tmp/surf.sock`. The Brave wrapper opens isolated `surf` user data and its managed extension copy directly, outside Brave's normal profile picker. Keep Surf disabled in the human-only `muke` profile. Use `~/.dotfiles/surf/install.sh` for native-host setup.

## Start every task safely

1. Pick the lane:
   - Default to `surf-brave` for isolated agent browsing.
   - Use `surf-edge` when the user says work, corporate, Microsoft, Edge, Entra/Azure, SharePoint, Outlook, Teams, or similar.
2. Check connectivity:
   ```bash
   surf-brave tab.list
   # or
   surf-edge tab.list
   ```
3. Create an isolated work window before acting:
   ```bash
   surf-brave window.new --unfocused
   # Retain the returned tab ID, then navigate that tab explicitly.
   surf-brave go "https://example.com" --tab-id <tab-id>
   surf-brave tab.name agent-task --tab-id <tab-id>
   ```
4. Retain the returned window/tab IDs and target them explicitly on follow-up commands. Avoid `tab.switch` and `window.focus` unless the task requires visible focus.

## Common commands

```bash
surf-brave go "https://example.com" --tab-id <tab-id>
surf-brave read --depth 3 --compact --tab-id <tab-id>
surf-brave locate.role button --name "Submit" --action click --tab-id <tab-id>
surf-brave locate.label "Email" --action fill --value "user@example.com" --tab-id <tab-id>
surf-brave screenshot --annotate --tab-id <tab-id>
surf-brave network --exclude-static --tab-id <tab-id>
surf-brave console --tab-id <tab-id>
```

Swap `surf-edge` for `surf-brave` on work/Edge tasks.

## When Surf is the wrong tool

- For public web search or factual lookup, use search/extract tools instead of driving a browser.
- For headless, CI-like, cloud, iOS, React/vitals, video, or heavily isolated automation, prefer `agent-browser`.
- For local app visual QA, Surf is useful only if the app is served in Brave/Edge and login/session reuse matters.

## Troubleshooting

If a lane reports socket errors:

1. Make sure the browser is open and the Surf extension is enabled.
2. Restart that browser after native-host changes.
3. Run the dotfiles installer:
   ```bash
   ~/.dotfiles/surf/install.sh
   ```
4. If extension ID auto-detection fails, load the extension from `surf-brave extension-path`, copy the ID from the browser extensions page, then run:
   ```bash
   SURF_BRAVE_EXTENSION_ID=<id> ~/.dotfiles/surf/install.sh
   SURF_EDGE_EXTENSION_ID=<id> ~/.dotfiles/surf/install.sh
   ```
