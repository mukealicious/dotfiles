local originalHs = _G.hs
local originalModule = package.loaded.agent_launcher

local ok, testError = xpcall(function()
  local started = {}
  local completions = {}
  local pauseNotifications = {}
  local failNewPath = nil
  local failStartPath = nil

  _G.hs = {
    timer = {
      doEvery = function(_, callback)
        return { fire = callback }
      end,
    },
    printf = function() end,
    json = {
      decode = function(text)
        if text == "launch-1" then
          return { status = "started", mode = "save", id = 1, pi_pane_id = "pane-1" }
        elseif text == "launch-2" then
          return { status = "started", mode = "study", id = 2, pi_pane_id = "pane-2" }
        elseif text == "launch-3" then
          return { status = "started", mode = "study-with-me", id = 3, pi_pane_id = "pane-3" }
        elseif text == "missing-pane" then
          return { status = "started", mode = "save" }
        end
        error("invalid json")
      end,
    },
    task = {
      new = function(path, callback, arguments)
        if path == failNewPath then
          return nil
        end
        return {
          path = path,
          callback = callback,
          arguments = arguments,
          start = function(self)
            if self.path == failStartPath then
              return false
            end
            table.insert(started, self)
            return true
          end,
        }
      end,
    },
  }

  package.loaded.agent_launcher = nil
  local AgentLauncher = require("agent_launcher")

  local function newLauncher()
    return AgentLauncher.new({
      launcherPath = "/launcher",
      waiterPath = "/waiter",
      onQueuePaused = function(reason)
        table.insert(pauseNotifications, reason)
      end,
    })
  end

  local function capture(id)
    return {
      directory = "/tmp/capture" .. id,
      contextPath = "/tmp/capture" .. id .. "/context.md",
    }
  end

  -- Positive settlement is the only path that advances FIFO. Study-with-me is
  -- intentionally unqueued and does not alter writer order.
  local launcher = newLauncher()
  local first = launcher:launch(capture(1), "save", function(result, err)
    completions[1] = { result = result, err = err }
  end)
  local second = launcher:launch(capture(2), "study", function(result, err)
    completions[2] = { result = result, err = err }
  end)
  local interactive = launcher:launch(capture(3), "study-with-me", function(result, err)
    completions[3] = { result = result, err = err }
  end)

  assert(first.status == "starting")
  assert(second.status == "queued" and second.ahead == 1)
  assert(interactive.status == "starting" and interactive.queued == false)
  assert(#started == 2)
  assert(started[1].path == "/launcher" and started[1].arguments[1] == "save")
  assert(started[2].path == "/launcher" and started[2].arguments[1] == "study-with-me")

  started[1].callback(0, "launch-1", "")
  assert(completions[1].result.id == 1)
  assert(#started == 3 and started[3].path == "/waiter" and started[3].arguments[1] == "pane-1")
  assert(#launcher.queue == 1)

  started[3].callback(0, "{}", "")
  assert(#started == 4 and started[4].path == "/launcher" and started[4].arguments[1] == "study")
  assert(#launcher.queue == 0)

  started[2].callback(0, "launch-3", "")
  assert(completions[3].result.id == 3)
  started[4].callback(0, "launch-2", "")
  assert(#started == 5 and started[5].path == "/waiter" and started[5].arguments[1] == "pane-2")
  started[5].callback(0, "{}", "")
  assert(launcher:writerQueueStatus().idle == true)

  -- A waiter failure is ambiguous. Keep the active lease, retain queued work,
  -- reject new autonomous writers, and require explicit reconciliation.
  local waitFailureStart = #started
  local waitFailureLauncher = newLauncher()
  waitFailureLauncher:launch(capture(4), "save", function() end)
  waitFailureLauncher:launch(capture(5), "study", function() end)
  started[waitFailureStart + 1].callback(0, "launch-1", "")
  started[waitFailureStart + 2].callback(1, "", "transient Herdr failure\n")

  local waitFailureStatus = waitFailureLauncher:writerQueueStatus()
  assert(waitFailureStatus.paused == true)
  assert(waitFailureStatus.active == true)
  assert(waitFailureStatus.queued == 1)
  assert(#started == waitFailureStart + 2)
  assert(#pauseNotifications >= 1)

  local rejectedError
  local rejected = waitFailureLauncher:launch(capture(6), "save", function(_, err)
    rejectedError = err
  end)
  assert(rejected.status == "failed" and rejected.paused == true)
  assert(rejectedError:find("queue is paused", 1, true))
  assert(waitFailureLauncher:resumeWriterQueue() == nil)
  assert(waitFailureLauncher:resumeWriterQueue(true) == true)
  assert(#started == waitFailureStart + 3)
  assert(started[waitFailureStart + 3].arguments[1] == "study")

  -- Failure to create the waiter is equally ambiguous and must not advance.
  local waiterCreationStart = #started
  local waiterCreationLauncher = newLauncher()
  waiterCreationLauncher:launch(capture(7), "save", function() end)
  waiterCreationLauncher:launch(capture(8), "study", function() end)
  failNewPath = "/waiter"
  started[waiterCreationStart + 1].callback(0, "launch-1", "")
  failNewPath = nil
  local waiterCreationStatus = waiterCreationLauncher:writerQueueStatus()
  assert(waiterCreationStatus.paused == true)
  assert(waiterCreationStatus.queued == 1)
  assert(#started == waiterCreationStart + 1)

  -- Once the launcher process has run, a nonzero exit or malformed receipt may
  -- hide a dispatched Pi process. Both outcomes fail closed.
  local launchFailureStart = #started
  local launchFailureCompletion
  local launchFailureLauncher = newLauncher()
  launchFailureLauncher:launch(capture(9), "save", function(result, err)
    launchFailureCompletion = { result = result, err = err }
  end)
  launchFailureLauncher:launch(capture(10), "study", function() end)
  started[launchFailureStart + 1].callback(1, "", "launcher failed\n")
  assert(launchFailureCompletion.result == nil)
  assert(launchFailureCompletion.err:find("queue paused", 1, true))
  assert(launchFailureLauncher:writerQueueStatus().paused == true)
  assert(#started == launchFailureStart + 1)

  local receiptFailureStart = #started
  local receiptFailureLauncher = newLauncher()
  receiptFailureLauncher:launch(capture(11), "save", function() end)
  receiptFailureLauncher:launch(capture(12), "study", function() end)
  started[receiptFailureStart + 1].callback(0, "missing-pane", "")
  assert(receiptFailureLauncher:writerQueueStatus().paused == true)
  assert(receiptFailureLauncher:writerQueueStatus().queued == 1)
  assert(#started == receiptFailureStart + 1)

  -- If hs.task itself cannot start, no launcher process ran, so normal FIFO may
  -- safely continue without creating an ambiguous lease.
  local taskStartFailureCompletion
  local taskStartFailureLauncher = newLauncher()
  failStartPath = "/launcher"
  taskStartFailureLauncher:launch(capture(13), "save", function(result, err)
    taskStartFailureCompletion = { result = result, err = err }
  end)
  failStartPath = nil
  assert(taskStartFailureCompletion.result == nil)
  assert(taskStartFailureCompletion.err:find("could not start task", 1, true))
  assert(taskStartFailureLauncher:writerQueueStatus().paused == false)
end, debug.traceback)

package.loaded.agent_launcher = originalModule
_G.hs = originalHs

if not ok then
  error(testError, 0)
end

print("agent-launcher tests passed")
