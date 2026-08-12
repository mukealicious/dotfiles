local AgentLauncher = {}
AgentLauncher.__index = AgentLauncher

local function trimError(message)
  return (message or ""):gsub("%s+$", "")
end

function AgentLauncher.new(config)
  assert(config and config.launcherPath, "launcherPath is required")
  assert(config.waiterPath, "waiterPath is required")

  local self = setmetatable({
    launcherPath = config.launcherPath,
    waiterPath = config.waiterPath,
    queue = {},
    activeWriter = nil,
    activeTasks = {},
    pausedReason = nil,
    onQueuePaused = config.onQueuePaused,
    maxQueued = config.maxQueued or 8,
  }, AgentLauncher)

  self.queueTimer = hs.timer.doEvery(config.queuePollSeconds or 2, function()
    self:_pollWriter()
  end)

  return self
end

function AgentLauncher:_runTask(path, arguments, callback)
  local task
  task = hs.task.new(path, function(exitCode, stdOut, stdErr)
    self.activeTasks[task] = nil
    callback(exitCode, stdOut, stdErr)
  end, arguments)

  if not task then
    return nil, "could not create task for " .. path
  end

  self.activeTasks[task] = true
  if not task:start() then
    self.activeTasks[task] = nil
    return nil, "could not start task for " .. path
  end

  return task
end

function AgentLauncher:_finish(request, result, launchError)
  local ok, callbackError = pcall(request.callback, result, launchError)
  if not ok then
    hs.printf("Desktop capture callback failed: %s", callbackError)
  end
end

function AgentLauncher:_pauseQueue(request, reason, finishRequest)
  self.pausedReason = reason
  hs.printf("Moja Glava capture queue paused: %s", reason)

  if finishRequest then
    self:_finish(request, nil, reason .. "; automatic writer queue paused for manual reconciliation")
  end

  if self.onQueuePaused then
    local ok, callbackError = pcall(self.onQueuePaused, reason)
    if not ok then
      hs.printf("Moja Glava queue-pause callback failed: %s", callbackError)
    end
  end
end

function AgentLauncher:_startWriter(request)
  self.activeWriter = request

  local task, taskError = self:_runTask(self.launcherPath, {
    request.mode,
    request.capture.contextPath,
    request.capture.screenshotPath or "",
  }, function(exitCode, stdOut, stdErr)
    if exitCode ~= 0 then
      local message = stdErr ~= "" and stdErr or ("agent launcher exited with code " .. exitCode)
      self:_pauseQueue(request, trimError(message), true)
      return
    end

    local decoded, result = pcall(hs.json.decode, stdOut)
    if not decoded
      or type(result) ~= "table"
      or result.status ~= "started"
      or type(result.pi_pane_id) ~= "string"
      or result.pi_pane_id == "" then
      self:_pauseQueue(request, "agent launcher returned no valid Pi launch receipt", true)
      return
    end

    self:_finish(request, result, nil)
    local waiter, waiterError = self:_runTask(self.waiterPath, { result.pi_pane_id }, function(waitExit, _, waitStdErr)
      if waitExit ~= 0 then
        local message = waitStdErr ~= "" and waitStdErr or ("waiter exited with code " .. waitExit)
        self:_pauseQueue(
          request,
          "could not confirm writer settlement in " .. result.pi_pane_id .. ": " .. trimError(message),
          false
        )
        return
      end

      self.activeWriter = nil
      self:_startNextWriter()
    end)

    if not waiter then
      self:_pauseQueue(
        request,
        "could not start queue waiter for " .. result.pi_pane_id .. ": " .. waiterError,
        false
      )
    end
  end)

  if not task then
    self.activeWriter = nil
    self:_finish(request, nil, taskError)
    self:_startNextWriter()
  end
end

function AgentLauncher:_startNextWriter()
  if self.pausedReason or self.activeWriter or #self.queue == 0 then
    return
  end

  self:_startWriter(table.remove(self.queue, 1))
end

function AgentLauncher:_pollWriter()
  if not self.pausedReason and not self.activeWriter then
    self:_startNextWriter()
  end
end

function AgentLauncher:_startUnqueued(request)
  local task, taskError = self:_runTask(self.launcherPath, {
    request.mode,
    request.capture.contextPath,
    request.capture.screenshotPath or "",
  }, function(exitCode, stdOut, stdErr)
    if exitCode ~= 0 then
      local message = stdErr ~= "" and stdErr or ("agent launcher exited with code " .. exitCode)
      self:_finish(request, nil, trimError(message))
      return
    end

    local decoded, result = pcall(hs.json.decode, stdOut)
    if not decoded or type(result) ~= "table" or result.status ~= "started" then
      self:_finish(request, nil, "agent launcher returned an invalid response")
      return
    end

    self:_finish(request, result, nil)
  end)

  if not task then
    self:_finish(request, nil, taskError)
  end
end

function AgentLauncher:writerQueueStatus()
  local activeTaskCount = 0
  for _ in pairs(self.activeTasks) do
    activeTaskCount = activeTaskCount + 1
  end

  return {
    idle = self.pausedReason == nil
      and self.activeWriter == nil
      and #self.queue == 0
      and activeTaskCount == 0,
    active = self.activeWriter ~= nil,
    queued = #self.queue,
    tasks = activeTaskCount,
    paused = self.pausedReason ~= nil,
    reason = self.pausedReason,
  }
end

function AgentLauncher:resumeWriterQueue(confirmedSafe)
  if not self.pausedReason then
    return nil, "writer queue is not paused"
  end
  if confirmedSafe ~= true then
    return nil, "resume requires explicit confirmation that the prior writer is settled or did not start"
  end

  self.pausedReason = nil
  self.activeWriter = nil
  self:_startNextWriter()
  return true
end

function AgentLauncher:launch(capture, mode, callback)
  if not capture or not capture.contextPath then
    callback(nil, "capture context is missing")
    return { status = "failed" }
  end

  local request = {
    capture = capture,
    mode = mode,
    callback = callback,
  }

  if mode == "study-with-me" then
    self:_startUnqueued(request)
    return { status = "starting", queued = false }
  end

  if mode ~= "save" and mode ~= "study" then
    callback(nil, "unsupported capture mode: " .. tostring(mode))
    return { status = "failed" }
  end

  if self.pausedReason then
    callback(nil, "automatic writer queue is paused: " .. self.pausedReason)
    return { status = "failed", paused = true }
  end

  self:_pollWriter()
  local position = #self.queue + (self.activeWriter and 1 or 0)
  if position > 0 then
    if #self.queue >= self.maxQueued then
      callback(nil, "capture queue is full; retry after an active capture completes")
      return { status = "failed" }
    end

    table.insert(self.queue, request)
    return { status = "queued", queued = true, ahead = position }
  end

  self:_startWriter(request)
  return { status = "starting", queued = false }
end

return AgentLauncher
