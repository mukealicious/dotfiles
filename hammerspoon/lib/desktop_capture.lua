local DesktopCapture = {}
DesktopCapture.__index = DesktopCapture

local browserScripts = {
  ["com.apple.Safari"] = [[
    tell application "Safari"
      if (count of windows) is 0 then return ""
      return URL of front document
    end tell
  ]],
  ["com.google.Chrome"] = [[
    tell application "Google Chrome"
      if (count of windows) is 0 then return ""
      return URL of active tab of front window
    end tell
  ]],
  ["com.brave.Browser"] = [[
    tell application "Brave Browser"
      if (count of windows) is 0 then return ""
      return URL of active tab of front window
    end tell
  ]],
  ["com.microsoft.edgemac"] = [[
    tell application "Microsoft Edge"
      if (count of windows) is 0 then return ""
      return URL of active tab of front window
    end tell
  ]],
}

local function ensureDirectory(path)
  local attributes = hs.fs.attributes(path)
  if attributes then
    if attributes.mode == "directory" then
      return true
    end
    return nil, path .. " exists but is not a directory"
  end

  local parent = path:match("^(.*)/[^/]+$")
  if parent and parent ~= path then
    local ok, err = ensureDirectory(parent)
    if not ok then
      return nil, err
    end
  end

  local ok, err = hs.fs.mkdir(path)
  if ok then
    return true
  end

  return nil, err or ("could not create " .. path)
end

local function uniqueCaptureDirectory(root)
  local timestamp = os.date("%Y-%m-%d-%H%M%S")
  local candidate = root .. "/" .. timestamp
  local suffix = 1

  while hs.fs.attributes(candidate) do
    candidate = root .. "/" .. timestamp .. "-" .. suffix
    suffix = suffix + 1
  end

  return candidate
end

local function indentMarkdown(text)
  if not text or text == "" then
    return "    (No text selection captured.)"
  end

  return "    " .. text:gsub("\n", "\n    ")
end

local function oneLine(text)
  return (text or ""):gsub("[\r\n]+", " ")
end

local function truncateUtf8(text, maxBytes)
  local sequenceStart = maxBytes
  while sequenceStart > 0 do
    local byte = text:byte(sequenceStart)
    if not byte or byte < 0x80 or byte >= 0xC0 then
      break
    end
    sequenceStart = sequenceStart - 1
  end

  local leadingByte = text:byte(sequenceStart)
  local sequenceLength = 1
  if leadingByte and leadingByte >= 0xF0 then
    sequenceLength = 4
  elseif leadingByte and leadingByte >= 0xE0 then
    sequenceLength = 3
  elseif leadingByte and leadingByte >= 0xC0 then
    sequenceLength = 2
  end

  if sequenceStart + sequenceLength - 1 <= maxBytes then
    return text:sub(1, maxBytes)
  end

  return text:sub(1, sequenceStart - 1)
end

local function urlEncode(value)
  return (value:gsub("([^%w%-._~])", function(character)
    return string.format("%%%02X", string.byte(character))
  end))
end

local function youtubeHost(authority)
  local host = authority:match("^%[([^%]]+)%]") or authority:match("^([^:]+)") or ""
  host = host:lower():gsub("%.$", "")
  return host == "youtube.com"
    or host:sub(-12) == ".youtube.com"
    or host == "youtu.be"
end

local function sanitizeBrowserURL(value)
  if not value or value == "" then
    return nil
  end

  local scheme, authority, pathAndMore = value:match("^([%a][%w+.-]*)://([^/%?#]*)(.*)$")
  scheme = scheme and scheme:lower() or nil
  if (scheme ~= "http" and scheme ~= "https") or not authority or authority == "" then
    return nil
  end

  authority = authority:gsub("^.*@", "")
  if authority == "" then
    return nil
  end

  local withoutFragment = pathAndMore:match("^[^#]*") or ""
  local path = withoutFragment:match("^[^?]*") or ""
  local query = withoutFragment:match("%?(.+)$")
  local safeQuery = {}

  if query and youtubeHost(authority) then
    for pair in query:gmatch("[^&]+") do
      local key, queryValue = pair:match("^([^=]+)=?(.*)$")
      local normalizedKey = key and key:lower() or ""
      if normalizedKey == "v" and queryValue:match("^[%w_-]+$") then
        table.insert(safeQuery, "v=" .. urlEncode(queryValue))
      elseif normalizedKey == "list" and queryValue:match("^[%w_-]+$") then
        table.insert(safeQuery, "list=" .. urlEncode(queryValue))
      elseif normalizedKey == "t" and queryValue:match("^%d+[hms]*$") then
        table.insert(safeQuery, "t=" .. urlEncode(queryValue))
      end
    end
  end

  local sanitized = scheme .. "://" .. authority .. path
  if #safeQuery > 0 then
    sanitized = sanitized .. "?" .. table.concat(safeQuery, "&")
  end
  return sanitized
end

local function restrictPermissions(path, mode)
  local ok = os.execute("/bin/chmod " .. mode .. " " .. string.format("%q", path))
  return ok == true or ok == 0
end

local function writeAtomically(path, contents)
  local temporaryPath = path .. ".tmp"
  local file, openError = io.open(temporaryPath, "w")
  if not file then
    return nil, openError
  end

  local wrote, writeError = file:write(contents)
  if not wrote then
    file:close()
    os.remove(temporaryPath)
    return nil, writeError
  end

  local closed, closeError = file:close()
  if not closed then
    os.remove(temporaryPath)
    return nil, closeError or "could not flush capture context"
  end

  local renamed, renameError = os.rename(temporaryPath, path)
  if not renamed then
    os.remove(temporaryPath)
    return nil, renameError
  end

  return true
end

function DesktopCapture.new(config)
  assert(config and config.capturesRoot, "capturesRoot is required")

  return setmetatable({
    capturesRoot = config.capturesRoot,
    maxSelectionBytes = config.maxSelectionBytes or 100000,
  }, DesktopCapture)
end

function DesktopCapture:_browserURL(bundleID)
  local script = browserScripts[bundleID]
  if not script then
    return nil
  end

  local ok, result = hs.osascript.applescript(script)
  if ok and type(result) == "string" and result ~= "" then
    return result
  end

  return nil
end

function DesktopCapture:_captureSelection()
  local element = hs.uielement.focusedElement()
  if not element then
    return nil
  end

  local ok, selection = pcall(function()
    return element:selectedText()
  end)
  if not ok or type(selection) ~= "string" or selection == "" then
    return nil
  end

  if #selection > self.maxSelectionBytes then
    return truncateUtf8(selection, self.maxSelectionBytes)
      .. "\n\n[Selection truncated by Hammerspoon after "
      .. self.maxSelectionBytes
      .. " bytes.]"
  end

  return selection
end

function DesktopCapture:_persist(context, targetWindow)
  local ok, directoryError = ensureDirectory(self.capturesRoot)
  if not ok then
    return nil, directoryError
  end

  local captureDirectory = uniqueCaptureDirectory(self.capturesRoot)
  ok, directoryError = ensureDirectory(captureDirectory)
  if not ok then
    return nil, directoryError
  end
  if not restrictPermissions(self.capturesRoot, "700")
    or not restrictPermissions(captureDirectory, "700") then
    return nil, "could not restrict capture directory permissions"
  end

  local screenshotPath = captureDirectory .. "/screenshot.png"
  local screenshotSaved = false
  if targetWindow then
    local snapshot = targetWindow:snapshot(false)
    if snapshot then
      screenshotSaved = snapshot:saveToFile(screenshotPath, false, "PNG")
    end
  end

  if not screenshotSaved then
    screenshotPath = nil
  elseif not restrictPermissions(screenshotPath, "600") then
    return nil, "could not restrict screenshot permissions"
  end

  local markdown = {
    "# Desktop capture",
    "",
    "- Captured: " .. context.capturedAt,
    "- Application: " .. oneLine(context.applicationName),
    "- Bundle ID: " .. oneLine(context.bundleID),
    "- Window: " .. oneLine(context.windowTitle),
  }

  local safeURL = sanitizeBrowserURL(context.url)
  if safeURL then
    table.insert(markdown, "- URL: " .. safeURL)
  end

  table.insert(markdown, "")
  table.insert(markdown, "## Selected text")
  table.insert(markdown, "")
  table.insert(markdown, indentMarkdown(context.selection))
  table.insert(markdown, "")
  table.insert(markdown, "## Screenshot")
  table.insert(markdown, "")

  if screenshotPath then
    table.insert(markdown, "![Captured window](screenshot.png)")
  elseif hs.screenRecordingState(false) then
    table.insert(markdown, "(The focused window did not provide a screenshot.)")
  else
    table.insert(markdown, "(Screenshot unavailable: Hammerspoon does not have Screen Recording permission.)")
  end

  table.insert(markdown, "")

  local contextPath = captureDirectory .. "/context.md"
  local wrote, writeError = writeAtomically(contextPath, table.concat(markdown, "\n"))
  if not wrote then
    return nil, writeError
  end
  if not restrictPermissions(contextPath, "600") then
    return nil, "could not restrict capture context permissions"
  end

  return {
    directory = captureDirectory,
    contextPath = contextPath,
    screenshotPath = screenshotPath,
  }
end

function DesktopCapture:create(targetWindow, callback)
  if targetWindow then
    targetWindow:focus()
  end

  hs.timer.doAfter(0.15, function()
    local activeWindow = targetWindow or hs.window.focusedWindow()
    local application = activeWindow and activeWindow:application() or hs.application.frontmostApplication()
    local bundleID = application and application:bundleID() or ""
    local context = {
      capturedAt = os.date("%Y-%m-%d %H:%M:%S %z"),
      applicationName = application and application:name() or "Unknown",
      bundleID = bundleID or "",
      windowTitle = activeWindow and activeWindow:title() or "",
      url = self:_browserURL(bundleID),
    }

    context.selection = self:_captureSelection()
    local result, err = self:_persist(context, activeWindow)
    callback(result, err)
  end)
end

return DesktopCapture
