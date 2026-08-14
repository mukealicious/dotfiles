# Surf browser lanes

Surf controls real Chromium browsers through an extension + native host. This setup keeps the dedicated Brave Beta agent app and Edge on separate sockets so agents do not accidentally drive the wrong browser.

| Lane | Browser | Socket | Command |
|---|---|---|---|
| Personal agent | Brave Beta (`surf`, dedicated app + user data) | `/tmp/surf-brave.sock` | `surf-brave ...` |
| Work | Microsoft Edge | `/tmp/surf-edge.sock` | `surf-edge ...` |

## Install / repair

1. Install dependencies:

   ```sh
   brew install --cask brave-browser@beta
   ~/.dotfiles/mise/install.sh
   ```

2. Prepare Surf's managed extension and native hosts:

   ```sh
   ~/.dotfiles/surf/install.sh
   ```

   - On the first Brave Beta setup, run `surf-brave tab.list` once to create the isolated browser data and load the extension. The command may report a missing socket.
   - Rerun `~/.dotfiles/surf/install.sh`, restart the `surf` browser instance, and test again.
   - The `surf` instance uses Brave Beta and does not appear in stable Brave's profile picker. Do not enable Surf in `muke`.
   - Edge: open `edge://extensions`, enable Developer Mode, Load unpacked, choose the printed path.

   The installer auto-detects the Surf extension ID from browser profile preferences. If detection fails after the first-run sequence, copy the extension ID from the browser extensions page and rerun with an override:

   ```sh
   SURF_BRAVE_EXTENSION_ID=<id> ~/.dotfiles/surf/install.sh
   SURF_EDGE_EXTENSION_ID=<id> ~/.dotfiles/surf/install.sh
   ```

3. Restart any browser whose native host was updated, then test:

   ```sh
   surf-brave tab.list
   surf-edge tab.list
   ```

## Usage rules

- Use `surf-brave` for agent browsing. It opens Brave Beta with isolated user data under `surf-cli-dotfiles`; stable Brave remains exclusively human-owned. Keeping separate app bundles prevents the agent browser's updater from replacing files underneath a running personal Brave process.
- Use `surf-edge` for work/corporate sites or when the user explicitly asks for Edge.
- Avoid `surf install`; upstream writes Surf's default single-socket host. Use `surf/install.sh` instead.
- Prefer `window.new --unfocused` without a URL, retain its returned IDs, then navigate with `go <url> --tab-id <tab-id>`. This avoids a background content-script startup race. Pass `--window-id` or `--tab-id` on later commands.
