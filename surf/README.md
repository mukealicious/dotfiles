# Surf browser automation

Surf controls Microsoft Edge through an extension and native host. Both `surf`
and `surf-edge` use `/tmp/surf-edge.sock`. Personal Brave stays separate.

## Install / repair

1. Install dependencies:

   ```sh
   brew install --cask microsoft-edge
   ~/.dotfiles/mise/install.sh
   ```

2. Get the extension path:

   ```sh
   surf extension-path
   ```

   Open `edge://extensions`, enable Developer Mode, select **Load unpacked**,
   and choose that path.

3. Install the native host:

   ```sh
   ~/.dotfiles/surf/install.sh
   ```

   The installer detects the Surf extension ID from Edge profiles. If detection
   fails, copy the ID from Edge's extensions page and rerun:

   ```sh
   SURF_EDGE_EXTENSION_ID=<id> ~/.dotfiles/surf/install.sh
   ```

4. Restart Edge after native-host changes, then test:

   ```sh
   surf tab.list
   ```

## Usage rules

- Use `surf` or `surf-edge` for all agent browsing. The retired `surf-brave`
  wrapper is no longer installed.
- Use `surf/install.sh` rather than `surf install`; upstream writes a different
  single-socket host.
- Prefer `window.new --unfocused` without a URL, retain its returned IDs, then
  navigate with `go <url> --tab-id <tab-id>`. This avoids a background
  content-script startup race. Pass `--window-id` or `--tab-id` on later commands.
- Existing Brave profile data is preserved; it is not used by Surf.
