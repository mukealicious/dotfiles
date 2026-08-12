local AgentLauncher = require("agent_launcher")
local DesktopCapture = require("desktop_capture")

local AgentPalette = {}
AgentPalette.__index = AgentPalette

local function completionMessage(result)
  if result.warning then
    return result.warning
  end

  if result.mode == "save" then
    return "Save session started in Herdr"
  elseif result.mode == "study" then
    return "Study session started in Herdr"
  end

  return "Study session opened in Herdr"
end

function AgentPalette.new(config)
  assert(config and config.hotkeys and config.hotkeys.palette, "palette hotkey is required")

  local self = setmetatable({
    capturesRoot = config.capturesRoot,
    hotkeys = config.hotkeys,
    capture = DesktopCapture.new({ capturesRoot = config.capturesRoot }),
    boundHotkeys = {},
    targetWindow = nil,
    captureInProgress = false,
    maintenance = false,
  }, AgentPalette)

  self.launcher = AgentLauncher.new({
    launcherPath = config.launcherPath,
    waiterPath = config.waiterPath,
    onQueuePaused = function(reason)
      hs.alert.show("Moja Glava writer queue paused; inspect the active Herdr tab", 5)
      hs.printf("Moja Glava writer queue requires manual reconciliation: %s", reason)
    end,
  })

  self.chooser = hs.chooser.new(function(choice)
    self:_handleChoice(choice)
  end)
    :choices({
      {
        text = "Save this",
        subText = "Start a quiet Pi session with a live diff",
        mode = "save",
      },
      {
        text = "Study this",
        subText = "Start a deeper Pi session with a live diff",
        mode = "study",
      },
      {
        text = "Study this with me…",
        subText = "Open an interactive Pi session with a live diff",
        mode = "study-with-me",
      },
    })
    :placeholderText("Remember in Moja Glava")
    :searchSubText(true)
    :rows(3)
    :width(38)

  return self
end

function AgentPalette:_startAgent(mode, targetWindow)
  if self.maintenance then
    hs.alert.show("Desktop capture is paused for Hammerspoon maintenance", 3)
    return
  end

  self.captureInProgress = true
  hs.alert.show("Capturing current context…", 0.8)

  self.capture:create(targetWindow, function(capture, captureError)
    self.captureInProgress = false
    if not capture then
      hs.alert.show("Capture failed: " .. captureError, 3)
      return
    end

    local disposition = self.launcher:launch(capture, mode, function(result, launchError)
      if not result then
        hs.alert.show("Launch failed. Capture kept at " .. capture.directory, 4)
        hs.printf("Moja Glava capture launch failed: %s", launchError)
        return
      end

      hs.alert.show(completionMessage(result), result.warning and 4 or 1.8)
    end)

    if disposition.status == "queued" then
      local suffix = disposition.ahead == 1 and "capture" or "captures"
      hs.alert.show("Capture queued behind " .. disposition.ahead .. " " .. suffix, 2)
    elseif disposition.status == "starting" then
      hs.alert.show("Capture saved; opening a review session…", 1.2)
    end
  end)
end

function AgentPalette:_handleChoice(choice)
  if not choice then
    return
  end

  self:_startAgent(choice.mode, self.targetWindow)
end

function AgentPalette:show()
  self.targetWindow = hs.window.focusedWindow()
  self.chooser:query(nil)
  self.chooser:show()
end

function AgentPalette:start()
  local paletteHotkey = self.hotkeys.palette
  table.insert(self.boundHotkeys, hs.hotkey.bind(paletteHotkey[1], paletteHotkey[2], function()
    self:show()
  end))
end

function AgentPalette:writerQueueStatus()
  local status = self.launcher:writerQueueStatus()
  status.capture_in_progress = self.captureInProgress
  status.maintenance = self.maintenance
  status.idle = status.idle and not self.captureInProgress and not self.maintenance
  return status
end

function AgentPalette:resumeWriterQueue(confirmedSafe)
  return self.launcher:resumeWriterQueue(confirmedSafe)
end

function AgentPalette:beginMaintenance()
  local status = self:writerQueueStatus()
  if not status.idle then
    return nil, "capture queue is not idle"
  end

  self.maintenance = true
  return true
end

return AgentPalette
