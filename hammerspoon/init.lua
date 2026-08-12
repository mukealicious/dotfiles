package.path = hs.configdir .. "/lib/?.lua;" .. package.path

require("hs.ipc")
hs.autoLaunch(true)

-- Hammerspoon needs these permissions for global hotkeys, accessible selected
-- text, and window screenshots. macOS only prompts while a permission is missing.
hs.accessibilityState(true)
hs.screenRecordingState(true)

local AgentPalette = require("agent_palette")

_G.desktopAgentPalette = AgentPalette.new({
  capturesRoot = os.getenv("HOME") .. "/Library/Application Support/Hammerspoon Agent/Captures",
  launcherPath = hs.configdir .. "/bin/start-agent.sh",
  waiterPath = hs.configdir .. "/bin/wait-for-agent.sh",
  hotkeys = {
    palette = { { "cmd", "ctrl", "alt" }, "space" },
  },
})

_G.desktopAgentPalette:start()
hs.printf("Desktop agent palette loaded")
