# Surf browser lanes

Surf controls real Chromium browsers through an extension + native host. This setup keeps Brave and Edge on separate sockets so agents do not accidentally drive the wrong browser.

| Lane | Browser | Socket | Command |
|---|---|---|---|
| Personal agent | Brave (`surf`, dedicated user data) | `/tmp/surf-brave.sock` | `surf-brave ...` |
| Work | Microsoft Edge | `/tmp/surf-edge.sock` | `surf-edge ...` |

## Install / repair

1. Install npm globals:

   ```sh
   ~/.dotfiles/mise/install.sh
   ```

2. Prepare Surf's managed extension and native hosts:

   ```sh
   ~/.dotfiles/surf/install.sh
   ```

   - On the first Brave setup, run `surf-brave tab.list` once to create the isolated browser data and load the extension. The command may report a missing socket.
   - Rerun `~/.dotfiles/surf/install.sh`, restart the `surf` browser instance, and test again.
   - The `surf` instance does not appear in the normal Brave profile picker. Do not enable Surf in `muke`.
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

- Use `surf-brave` for agent browsing. It opens isolated user data under `surf-cli-dotfiles`; normal Brave continues to open `muke`.
- Use `surf-edge` for work/corporate sites or when the user explicitly asks for Edge.
- Avoid `surf install`; upstream writes Surf's default single-socket host. Use `surf/install.sh` instead.
- Prefer `window.new --unfocused` without a URL, retain its returned IDs, then navigate with `go <url> --tab-id <tab-id>`. This avoids a background content-script startup race. Pass `--window-id` or `--tab-id` on later commands.
