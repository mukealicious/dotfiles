/**
 * Debug helpers for troubleshooting cmux integration.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Box, Text } from "@mariozechner/pi-tui";
import type { CmuxClient } from "./cmux-client.js";

interface CmuxDebugDetails {
  timestamp: number;
  lines: string[];
  identify: unknown;
}

function fmt(value: unknown): string {
  if (value === null || value === undefined || value === "") return "<unset>";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function wireDebug(pi: ExtensionAPI, client: CmuxClient): void {
  pi.registerMessageRenderer("cmux-debug", (message, { expanded }, theme) => {
    const details = (message.details ?? {}) as Partial<CmuxDebugDetails>;
    const timestamp = details.timestamp ? new Date(details.timestamp).toLocaleTimeString() : null;

    let text = theme.fg("accent", theme.bold("cmux debug"));
    if (timestamp) {
      text += " " + theme.fg("dim", timestamp);
    }

    const lines = Array.isArray(details.lines) ? details.lines : [String(message.content ?? "")];
    if (lines.length > 0) {
      text += "\n" + lines.map((line) => theme.fg("muted", line)).join("\n");
    }

    if (expanded && details.identify !== undefined) {
      text += "\n\n" + theme.fg("accent", "system.identify") + "\n";
      text += theme.fg("dim", JSON.stringify(details.identify, null, 2) ?? "null");
    } else if (!expanded && details.identify !== undefined) {
      text += "\n" + theme.fg("dim", "(expand to view full system.identify payload)");
    }

    const box = new Box(1, 1, (t) => theme.bg("customMessageBg", t));
    box.addChild(new Text(text, 0, 0));
    return box;
  });

  pi.registerCommand("cmux-debug", {
    description: "Show resolved cmux env, connection state, and system.identify payload",
    handler: async (_args, ctx) => {
      const resolvedWorkspaceId = process.env.CMUX_WORKSPACE_ID ?? process.env.CMUX_TAB_ID ?? null;
      const resolvedPanelId = process.env.CMUX_PANEL_ID ?? process.env.CMUX_SURFACE_ID ?? null;
      const connectedBefore = client.isConnected();
      const connectOk = await client.connect();
      const connectedAfter = client.isConnected();
      const identifyResponse = connectOk ? await client.request("system.identify", {}) : null;
      const identify = identifyResponse && identifyResponse.ok ? identifyResponse.result : identifyResponse;

      const identifyRecord = identifyResponse && identifyResponse.ok && identifyResponse.result && typeof identifyResponse.result === "object"
        ? (identifyResponse.result as Record<string, any>)
        : null;
      const caller = identifyRecord?.caller ?? null;
      const focused = identifyRecord?.focused ?? identifyRecord?.current ?? identifyRecord?.active ?? null;
      const identifyError = identifyResponse && !identifyResponse.ok
        ? `${identifyResponse.error.code}: ${identifyResponse.error.message}`
        : null;

      const lines = [
        `available=${client.available}`,
        `connected.before=${connectedBefore}`,
        `connect.ok=${connectOk}`,
        `connected.after=${connectedAfter}`,
        `socket=${fmt(process.env.CMUX_SOCKET_PATH)}`,
        `env.workspace=${fmt(process.env.CMUX_WORKSPACE_ID)}`,
        `env.tab=${fmt(process.env.CMUX_TAB_ID)}`,
        `env.surface=${fmt(process.env.CMUX_SURFACE_ID)}`,
        `env.panel=${fmt(process.env.CMUX_PANEL_ID)}`,
        `resolved.workspace=${fmt(resolvedWorkspaceId)}`,
        `resolved.panel=${fmt(resolvedPanelId)}`,
        `identify.error=${fmt(identifyError)}`,
        `identify.caller.workspace=${fmt(caller?.workspace_id ?? caller?.workspace_ref)}`,
        `identify.caller.surface=${fmt(caller?.surface_id ?? caller?.surface_ref)}`,
        `identify.focused.workspace=${fmt(focused?.workspace_id ?? focused?.workspace_ref)}`,
        `identify.focused.surface=${fmt(focused?.surface_id ?? focused?.surface_ref)}`,
      ];

      pi.sendMessage({
        customType: "cmux-debug",
        content: lines.join("\n"),
        display: true,
        details: {
          timestamp: Date.now(),
          lines,
          identify,
        } satisfies CmuxDebugDetails,
      });

      if (ctx.hasUI) {
        ctx.ui.notify(connectOk ? "cmux debug captured" : "cmux debug: connect failed", connectOk ? "info" : "warning");
      }
    },
  });
}
