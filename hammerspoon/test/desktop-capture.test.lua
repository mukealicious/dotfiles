local originalHs = _G.hs
local originalModule = package.loaded.desktop_capture
local originalOpen = io.open
local originalRename = os.rename
local originalRemove = os.remove
local originalExecute = os.execute

local ok, testError = xpcall(function()
  local attributes = {}
  local written = {}
  local now = os.time()
  local closeFailure = false

  _G.hs = {
    fs = {
      attributes = function(path)
        return attributes[path]
      end,
      mkdir = function(path)
        attributes[path] = { mode = "directory" }
        return true
      end,
    },
    screenRecordingState = function()
      return false
    end,
  }

  io.open = function(path, mode)
    if mode ~= "w" then
      return originalOpen(path, mode)
    end
    local buffer = {}
    return {
      write = function(_, contents)
        table.insert(buffer, contents)
        return true
      end,
      close = function()
        if closeFailure then
          return nil, "fixture close failure"
        end
        written[path] = table.concat(buffer)
        return true
      end,
    }
  end
  os.rename = function(from, to)
    written[to] = written[from]
    written[from] = nil
    return true
  end
  os.remove = function(path)
    written[path] = nil
    return true
  end
  os.execute = function()
    return true, "exit", 0
  end

  package.loaded.desktop_capture = nil
  local DesktopCapture = require("desktop_capture")
  local root = "/tmp/desktop-capture-test"
  attributes["/tmp"] = { mode = "directory" }
  local capture = DesktopCapture.new({ capturesRoot = root })

  local function persistURL(url)
    local result, err = capture:_persist({
      capturedAt = os.date("%Y-%m-%d %H:%M:%S %z", now),
      applicationName = "Brave Browser",
      bundleID = "com.brave.Browser",
      windowTitle = "URL boundary test",
      url = url,
      selection = "Selected fixture",
    }, nil)
    assert(result, err)
    return written[result.contextPath]
  end

  local context = persistURL(
    "https://user:password@example.com/path?token=secret&v=abc_123&t=90s#private"
  )
  assert(context:find("URL: https://example.com/path", 1, true))
  assert(not context:find("v=abc_123", 1, true))
  assert(not context:find("t=90s", 1, true))
  assert(not context:find("user:password", 1, true))
  assert(not context:find("token=secret", 1, true))
  assert(not context:find("#private", 1, true))
  assert(context:find("Selected fixture", 1, true))

  context = persistURL("https://example.com?token=secret#private")
  assert(context:find("URL: https://example.com", 1, true))
  assert(not context:find("token=secret", 1, true))
  assert(not context:find("#private", 1, true))

  context = persistURL("https://www.youtube.com/watch?token=secret&v=abc_123&t=90s#private")
  assert(context:find("URL: https://www.youtube.com/watch?v=abc_123&t=90s", 1, true))
  assert(not context:find("token=secret", 1, true))

  context = persistURL("https://www.youtube.com/watch#?list=PRIVATE_ID")
  assert(context:find("URL: https://www.youtube.com/watch", 1, true))
  assert(not context:find("list=PRIVATE_ID", 1, true))

  context = persistURL("https://youtu.be/abc_123?list=PL_safe&t=30s")
  assert(context:find("URL: https://youtu.be/abc_123?list=PL_safe&t=30s", 1, true))

  context = persistURL("https://youtube.com.evil.example/watch?v=secret")
  assert(context:find("URL: https://youtube.com.evil.example/watch", 1, true))
  assert(not context:find("v=secret", 1, true))

  context = persistURL("file:///Users/example/private.txt?token=secret")
  assert(not context:find("- URL:", 1, true))

  closeFailure = true
  local failed, closeError = capture:_persist({
    capturedAt = os.date("%Y-%m-%d %H:%M:%S %z", now),
    applicationName = "TextEdit",
    bundleID = "com.apple.TextEdit",
    windowTitle = "Close failure test",
    selection = "Must not be reported as durable",
  }, nil)
  assert(failed == nil)
  assert(closeError == "fixture close failure")
  for path in pairs(written) do
    assert(not path:match("/context%.md%.tmp$"))
    if path:match("/context%.md$") then
      assert(not written[path]:find("Must not be reported as durable", 1, true))
    end
  end
end, debug.traceback)

io.open = originalOpen
os.rename = originalRename
os.remove = originalRemove
os.execute = originalExecute
package.loaded.desktop_capture = originalModule
_G.hs = originalHs

if not ok then
  error(testError, 0)
end

print("desktop-capture tests passed")
