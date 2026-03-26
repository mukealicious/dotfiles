/**
 * Custom tools exposed to the LLM for controlling cmux programmatically.
 *
 * - cmux_browser: Live browser/runtime control for localhost, auth pages,
 *   visual inspection, DOM/JS debugging, and console/error inspection.
 * - cmux_workspace: Control workspaces and surfaces (list, create, split,
 *   focus, flash, send text).
 * - cmux_notify: Send a notification to the user via cmux.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { truncateTail } from "@mariozechner/pi-coding-agent";
import { StringEnum } from "@mariozechner/pi-ai";
import { Type } from "@sinclair/typebox";
import type { CmuxClient, CmuxErrorPayload, CmuxRequestResult } from "./cmux-client.js";

interface FormattedResult {
  text: string;
  details?: {
    truncation?: ReturnType<typeof truncateTail>;
  };
}

type ToolResponse = string | CmuxRequestResult<any> | null;
type BrowserFormattedAction =
  | "snapshot"
  | "screenshot"
  | "console_list"
  | "console_clear"
  | "errors_list"
  | "eval"
  | "get_text"
  | "get_url"
  | "is_visible";

const TRUNCATE_OPTIONS = { maxBytes: 50_000, maxLines: 2000 } as const;

function isRecord(value: unknown): value is Record<string, any> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function safeJson(value: any): string {
  try {
    const json = JSON.stringify(value, null, 2);
    return json ?? String(value);
  } catch {
    return String(value);
  }
}

function truncateText(text: string): FormattedResult {
  const truncation = truncateTail(text, TRUNCATE_OPTIONS);
  let output = truncation.content;

  if (truncation.truncated) {
    output += `\n\n[Truncated: showing ${truncation.outputLines} of ${truncation.totalLines} lines (${truncation.outputBytes} of ${truncation.totalBytes} bytes)]`;
    return {
      text: output,
      details: { truncation },
    };
  }

  return { text: output };
}

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function compactExcerpt(value: string, maxChars = 280): string | undefined {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return undefined;
  return normalized.length > maxChars ? `${normalized.slice(0, maxChars - 1)}…` : normalized;
}

function formatBrowserValue(value: any): string {
  if (isRecord(value) && value.__cmux_t === "undefined") {
    return "undefined";
  }

  if (value === null) {
    return "null";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }

  return safeJson(value);
}

function formatCmuxError(error: CmuxErrorPayload): FormattedResult {
  const lines = [`cmux error [${error.code}]: ${error.message}`];
  if (error.data !== undefined) {
    lines.push("", "details:", safeJson(error.data));
  }
  return truncateText(lines.join("\n"));
}

function formatSnapshotResult(result: Record<string, any>): FormattedResult {
  const refs = isRecord(result.refs) ? result.refs : null;
  const page = isRecord(result.page) ? result.page : null;
  const excerpt = page && typeof page.text === "string" ? compactExcerpt(page.text) : undefined;

  const lines: string[] = [];

  if (typeof result.title === "string" && result.title.trim()) {
    lines.push(`title: ${result.title.trim()}`);
  }
  if (typeof result.url === "string" && result.url.trim()) {
    lines.push(`url: ${result.url.trim()}`);
  }
  if (typeof result.ready_state === "string" && result.ready_state.trim()) {
    lines.push(`ready_state: ${result.ready_state.trim()}`);
  }
  if (refs) {
    lines.push(`refs_count: ${Object.keys(refs).length}`);
  }

  if (typeof result.snapshot === "string" && result.snapshot.trim()) {
    if (lines.length > 0) lines.push("");
    lines.push("snapshot:");
    lines.push(result.snapshot);
  }

  if (excerpt) {
    if (lines.length > 0) lines.push("");
    lines.push("page_text_excerpt:", excerpt);
  }

  if (lines.length === 0) {
    return truncateText(safeJson(result));
  }

  return truncateText(lines.join("\n"));
}

function formatBrowserLogItem(item: any): string {
  if (isRecord(item)) {
    const text = typeof item.text === "string" ? item.text.replace(/\s+/g, " ").trim() : "";
    const level = typeof item.level === "string" && item.level.trim() ? item.level.trim() : "log";

    if (text) {
      return `[${level}] ${text}`;
    }

    const message = typeof item.message === "string" ? item.message.replace(/\s+/g, " ").trim() : "";
    if (message) {
      return `[error] ${message}`;
    }
  }

  if (typeof item === "string") {
    const normalized = item.replace(/\s+/g, " ").trim();
    return normalized || item;
  }

  return safeJson(item);
}

function formatBrowserLogResult(
  result: Record<string, any>,
  action: "console_list" | "console_clear" | "errors_list",
): FormattedResult {
  const isErrors = action === "errors_list";
  const key = isErrors ? "errors" : "entries";
  const items = Array.isArray(result[key]) ? result[key] : [];
  const count = typeof result.count === "number" ? result.count : items.length;

  let header: string;
  if (action === "console_clear") {
    header = `Cleared ${pluralize(count, "console entry", "console entries")}`;
  } else if (count === 0) {
    header = isErrors ? "No browser errors" : "No console entries";
  } else {
    header = isErrors
      ? pluralize(count, "browser error", "browser errors")
      : pluralize(count, "console entry", "console entries");
  }

  const lines = [header];
  if (items.length > 0) {
    lines.push("", ...items.map(formatBrowserLogItem));
  }

  return truncateText(lines.join("\n"));
}

function formatScreenshotResult(result: Record<string, any>): FormattedResult {
  const summary: Record<string, any> = {};

  for (const key of ["workspace_id", "surface_id", "path", "url"] as const) {
    if (result[key] !== undefined) {
      summary[key] = result[key];
    }
  }

  if (typeof result.png_base64 === "string" && result.png_base64.length > 0) {
    summary.png_base64 = `[omitted ${result.png_base64.length} chars]`;
  }

  if (Object.keys(summary).length === 0) {
    return truncateText("Screenshot captured");
  }

  return truncateText(safeJson(summary));
}

function formatSuccessResult(
  result: any,
  options?: { action?: BrowserFormattedAction },
): FormattedResult {
  if (options?.action === "snapshot" && isRecord(result)) {
    return formatSnapshotResult(result);
  }

  if (options?.action === "screenshot" && isRecord(result)) {
    return formatScreenshotResult(result);
  }

  if (
    (options?.action === "console_list"
      || options?.action === "console_clear"
      || options?.action === "errors_list")
    && isRecord(result)
  ) {
    return formatBrowserLogResult(result, options.action);
  }

  if (
    (options?.action === "eval"
      || options?.action === "get_text"
      || options?.action === "is_visible")
    && isRecord(result)
    && "value" in result
  ) {
    return truncateText(formatBrowserValue(result.value));
  }

  if (options?.action === "get_url" && isRecord(result) && typeof result.url === "string") {
    return truncateText(result.url);
  }

  if (result === null || result === undefined) {
    return truncateText("OK");
  }

  if (typeof result === "string") {
    return truncateText(result);
  }

  if (typeof result === "number" || typeof result === "boolean" || typeof result === "bigint") {
    return truncateText(String(result));
  }

  return truncateText(safeJson(result));
}

function formatResponse(
  response: CmuxRequestResult<any> | null,
  options?: { action?: BrowserFormattedAction },
): FormattedResult {
  if (response === null) {
    return { text: "cmux did not respond (socket unavailable or timed out)" };
  }

  if (!response.ok) {
    return formatCmuxError(response.error);
  }

  return formatSuccessResult(response.result, options);
}

function maybeSuccessText(response: CmuxRequestResult<any> | null, successText: string): ToolResponse {
  if (response && response.ok && (response.result === null || response.result === undefined)) {
    return successText;
  }
  return response;
}

function textResult(
  value: ToolResponse,
  options?: { action?: BrowserFormattedAction },
) {
  const formatted = typeof value === "string" ? truncateText(value) : formatResponse(value, options);
  return {
    content: [{ type: "text" as const, text: formatted.text }],
    ...(formatted.details ? { details: formatted.details } : {}),
  };
}

export function wireTools(pi: ExtensionAPI, client: CmuxClient): void {
  // --- cmux_browser ---
  pi.registerTool({
    name: "cmux_browser",
    description: [
      "Control the cmux in-app browser for live rendered/runtime work.",
      "Use this for localhost apps, authenticated/session-bound pages, visual inspection, DOM/JS/runtime debugging, and browser console/error inspection.",
      "Prefer parallel_search / parallel_extract / parallel_research for public-web discovery, reading, and synthesis.",
      "Prefer bash / curl for APIs, raw files, and exact transport.",
      "Inside Pi, prefer this tool over shelling out to agent-browser when you need live browser interaction.",
      "The browser runs inside the cmux terminal app — no separate browser needed.",
      "",
      "Actions:",
      "- open: Open a URL in a new browser split pane",
      "- navigate: Navigate the current browser to a URL",
      "- snapshot: Get a compact runtime-oriented accessibility snapshot of the current page",
      "- click: Click an element by CSS selector",
      "- fill: Fill a form field by CSS selector with text",
      "- eval: Evaluate JavaScript in the page and return the result",
      "- screenshot: Take a screenshot of the page",
      "- get_text: Get the text content of an element by CSS selector",
      "- get_url: Get the current page URL",
      "- wait: Wait for an element to appear or disappear (set hidden=true to wait for disappearance)",
      "- back: Go back in browser history",
      "- forward: Go forward in browser history",
      "- reload: Reload the current page",
      "- press: Send a keypress to the page (e.g. 'Enter', 'Tab', 'Escape')",
      "- scroll: Scroll an element (specify selector, dx, dy)",
      "- find_role: Find elements by ARIA role",
      "- is_visible: Check if an element is visible",
      "- console_list: List captured browser console entries",
      "- console_clear: Clear captured browser console entries",
      "- errors_list: List captured browser page errors",
    ].join("\n"),
    parameters: Type.Object({
      action: StringEnum([
        "open", "navigate", "snapshot", "click", "fill",
        "eval", "screenshot", "get_text", "get_url", "wait",
        "back", "forward", "reload", "press", "scroll",
        "find_role", "is_visible", "console_list", "console_clear", "errors_list",
      ] as const),
      url: Type.Optional(Type.String({ description: "URL for open/navigate actions" })),
      selector: Type.Optional(Type.String({ description: "CSS selector for click/fill/get_text/wait/scroll/is_visible" })),
      text: Type.Optional(Type.String({ description: "Text for fill action, or key name for press action" })),
      code: Type.Optional(Type.String({ description: "JavaScript code for eval action" })),
      role: Type.Optional(Type.String({ description: "ARIA role for find_role action" })),
      surface_id: Type.Optional(Type.String({ description: "Target browser surface ID (uses current if omitted)" })),
      hidden: Type.Optional(Type.Boolean({ description: "For wait action: true to wait until element disappears" })),
      dx: Type.Optional(Type.Number({ description: "Horizontal scroll amount for scroll action" })),
      dy: Type.Optional(Type.Number({ description: "Vertical scroll amount for scroll action" })),
    }),
    async execute(_toolCallId, params) {
      const surfaceParams: Record<string, any> = params.surface_id ? { surface_id: params.surface_id } : {};

      switch (params.action) {
        case "open": {
          if (!params.url) return textResult("Error: url is required for open action");
          const result = await client.request("browser.open_split", { url: params.url, ...surfaceParams });
          return textResult(maybeSuccessText(result, "Browser split opened"));
        }
        case "navigate": {
          if (!params.url) return textResult("Error: url is required for navigate action");
          const result = await client.request("browser.navigate", { url: params.url, ...surfaceParams });
          return textResult(maybeSuccessText(result, "Navigated"));
        }
        case "snapshot": {
          const result = await client.request("browser.snapshot", surfaceParams);
          return textResult(result, { action: "snapshot" });
        }
        case "click": {
          if (!params.selector) return textResult("Error: selector is required for click action");
          const result = await client.request("browser.click", { selector: params.selector, ...surfaceParams });
          return textResult(maybeSuccessText(result, "Clicked"));
        }
        case "fill": {
          if (!params.selector) return textResult("Error: selector is required for fill action");
          if (params.text === undefined) return textResult("Error: text is required for fill action");
          const result = await client.request("browser.fill", { selector: params.selector, text: params.text, ...surfaceParams });
          return textResult(maybeSuccessText(result, "Filled"));
        }
        case "eval": {
          if (!params.code) return textResult("Error: code is required for eval action");
          const result = await client.request("browser.eval", { script: params.code, ...surfaceParams });
          return textResult(result, { action: "eval" });
        }
        case "screenshot": {
          const result = await client.request("browser.screenshot", surfaceParams);
          return textResult(result, { action: "screenshot" });
        }
        case "get_text": {
          if (!params.selector) return textResult("Error: selector is required for get_text action");
          const result = await client.request("browser.get.text", { selector: params.selector, ...surfaceParams });
          return textResult(result, { action: "get_text" });
        }
        case "get_url": {
          const result = await client.request("browser.url.get", surfaceParams);
          return textResult(result, { action: "get_url" });
        }
        case "wait": {
          if (!params.selector) return textResult("Error: selector is required for wait action");
          const waitParams: Record<string, any> = { selector: params.selector, ...surfaceParams };
          if (params.hidden) waitParams.hidden = true;
          // cmux browser.wait defaults to 5000ms; keep the client timeout slightly higher
          // so structured timeout errors can arrive instead of collapsing to transport null.
          const result = await client.request("browser.wait", waitParams, { timeoutMs: 6000 });
          return textResult(maybeSuccessText(result, params.hidden ? "Element hidden" : "Element found"));
        }
        case "back": {
          const result = await client.request("browser.back", surfaceParams);
          return textResult(maybeSuccessText(result, "Navigated back"));
        }
        case "forward": {
          const result = await client.request("browser.forward", surfaceParams);
          return textResult(maybeSuccessText(result, "Navigated forward"));
        }
        case "reload": {
          const result = await client.request("browser.reload", surfaceParams);
          return textResult(maybeSuccessText(result, "Reloaded"));
        }
        case "press": {
          if (!params.text) return textResult("Error: text (key name) is required for press action");
          const result = await client.request("browser.press", { key: params.text, ...surfaceParams });
          return textResult(maybeSuccessText(result, "Key pressed"));
        }
        case "scroll": {
          if (!params.selector) return textResult("Error: selector is required for scroll action");
          const result = await client.request("browser.scroll", {
            selector: params.selector,
            dx: params.dx ?? 0,
            dy: params.dy ?? 0,
            ...surfaceParams,
          });
          return textResult(maybeSuccessText(result, "Scrolled"));
        }
        case "find_role": {
          if (!params.role) return textResult("Error: role is required for find_role action");
          const result = await client.request("browser.find.role", { role: params.role, ...surfaceParams });
          return textResult(result);
        }
        case "is_visible": {
          if (!params.selector) return textResult("Error: selector is required for is_visible action");
          const result = await client.request("browser.is.visible", { selector: params.selector, ...surfaceParams });
          return textResult(result, { action: "is_visible" });
        }
        case "console_list": {
          const result = await client.request("browser.console.list", surfaceParams);
          return textResult(result, { action: "console_list" });
        }
        case "console_clear": {
          const result = await client.request("browser.console.clear", surfaceParams);
          return textResult(maybeSuccessText(result, "Cleared console entries"), { action: "console_clear" });
        }
        case "errors_list": {
          const result = await client.request("browser.errors.list", surfaceParams);
          return textResult(result, { action: "errors_list" });
        }
        default:
          return textResult(`Unknown action: ${params.action}`);
      }
    },
  });

  // --- cmux_workspace ---
  pi.registerTool({
    name: "cmux_workspace",
    description: [
      "Control cmux workspaces and surfaces. List workspaces, create new ones, split panes, focus surfaces, flash surfaces, send text to other terminals, and identify the current context.",
      "",
      "Actions:",
      "- list: List all workspaces and their surfaces",
      "- create: Create a new workspace",
      "- split: Split a surface (direction: right or down)",
      "- focus: Focus a specific surface by ID",
      "- flash: Visually flash a surface to identify it",
      "- identify: Get the current focused context (window, workspace, pane, surface)",
      "- send_text: Send text to a surface (e.g. type a command into another terminal pane)",
      "- send_key: Send a keypress to a surface",
      "- close: Close a surface",
    ].join("\n"),
    parameters: Type.Object({
      action: StringEnum([
        "list", "create", "split", "focus", "flash",
        "identify", "send_text", "send_key", "close",
      ] as const),
      surface_id: Type.Optional(Type.String({ description: "Target surface ID for focus/flash/split/send_text/send_key/close" })),
      workspace_id: Type.Optional(Type.String({ description: "Target workspace ID for create/list operations" })),
      direction: Type.Optional(StringEnum(["right", "down"] as const, { description: "Split direction (default: right)" })),
      text: Type.Optional(Type.String({ description: "Text to send for send_text, or key name for send_key" })),
    }),
    async execute(_toolCallId, params) {
      switch (params.action) {
        case "list": {
          const result = await client.request("workspace.list", {});
          return textResult(result);
        }
        case "create": {
          const result = await client.request("workspace.create", {});
          return textResult(result);
        }
        case "split": {
          const splitParams: Record<string, any> = {};
          if (params.surface_id) splitParams.surface_id = params.surface_id;
          if (params.direction) splitParams.direction = params.direction;
          const result = await client.request("surface.split", splitParams);
          return textResult(result);
        }
        case "focus": {
          if (!params.surface_id) return textResult("Error: surface_id is required for focus action");
          const result = await client.request("surface.focus", { surface_id: params.surface_id });
          return textResult(maybeSuccessText(result, "Focused"));
        }
        case "flash": {
          if (!params.surface_id) return textResult("Error: surface_id is required for flash action");
          const result = await client.request("surface.trigger_flash", { surface_id: params.surface_id });
          return textResult(maybeSuccessText(result, "Flashed"));
        }
        case "identify": {
          const result = await client.request("system.identify", {});
          return textResult(result);
        }
        case "send_text": {
          if (!params.surface_id) return textResult("Error: surface_id is required for send_text action");
          if (!params.text) return textResult("Error: text is required for send_text action");
          const result = await client.request("surface.send_text", { surface_id: params.surface_id, text: params.text });
          return textResult(maybeSuccessText(result, "Text sent"));
        }
        case "send_key": {
          if (!params.surface_id) return textResult("Error: surface_id is required for send_key action");
          if (!params.text) return textResult("Error: text (key name) is required for send_key action");
          const result = await client.request("surface.send_key", { surface_id: params.surface_id, key: params.text });
          return textResult(maybeSuccessText(result, "Key sent"));
        }
        case "close": {
          if (!params.surface_id) return textResult("Error: surface_id is required for close action");
          const result = await client.request("surface.close", { surface_id: params.surface_id });
          return textResult(maybeSuccessText(result, "Closed"));
        }
        default:
          return textResult(`Unknown action: ${params.action}`);
      }
    },
  });

  // --- cmux_notify ---
  pi.registerTool({
    name: "cmux_notify",
    description: "Send a notification to the user via cmux. Use when you need to explicitly get the user's attention — e.g. a long task finished, something needs review, or you have a question.",
    parameters: Type.Object({
      title: Type.String({ description: "Notification title" }),
      subtitle: Type.Optional(Type.String({ description: "Notification subtitle (shown smaller, below title)" })),
      body: Type.Optional(Type.String({ description: "Notification body text" })),
    }),
    async execute(_toolCallId, params) {
      const surfaceId = process.env.CMUX_SURFACE_ID;

      if (surfaceId) {
        const result = await client.request("notification.create_for_surface", {
          surface_id: surfaceId,
          title: params.title,
          subtitle: params.subtitle ?? "",
          body: params.body ?? "",
        });
        return textResult(maybeSuccessText(result, "Notification sent"));
      }

      const result = await client.request("notification.create", {
        title: params.title,
        subtitle: params.subtitle ?? "",
        body: params.body ?? "",
      });
      return textResult(maybeSuccessText(result, "Notification sent"));
    },
  });
}
