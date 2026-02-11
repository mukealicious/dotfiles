/**
 * Desktop Notification Extension
 *
 * Sends a native desktop notification when the agent finishes and is
 * waiting for input. Uses OSC 777 escape sequence — no external deps.
 *
 * Supported terminals: WezTerm, Ghostty, iTerm2, rxvt-unicode
 * Not supported: Kitty (uses OSC 99), Terminal.app, Alacritty
 *
 * Based on mitsuhiko/agent-stuff.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

/**
 * Send a desktop notification via OSC 777 escape sequence.
 */
const notify = (title: string, body: string): void => {
  // OSC 777 format: ESC ] 777 ; notify ; title ; body BEL
  process.stdout.write(`\x1b]777;notify;${title};${body}\x07`);
};

const isTextPart = (
  part: unknown
): part is { type: "text"; text: string } =>
  Boolean(
    part &&
      typeof part === "object" &&
      "type" in part &&
      (part as Record<string, unknown>).type === "text" &&
      "text" in part
  );

const extractLastAssistantText = (
  messages: Array<{ role?: string; content?: unknown }>
): string | null => {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message?.role !== "assistant") continue;

    const content = message.content;
    if (typeof content === "string") return content.trim() || null;

    if (Array.isArray(content)) {
      const text = content
        .filter(isTextPart)
        .map((part) => part.text)
        .join("\n")
        .trim();
      return text || null;
    }

    return null;
  }

  return null;
};

const formatNotification = (
  text: string | null
): { title: string; body: string } => {
  const normalized = (text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return { title: "Ready for input", body: "" };

  const maxBody = 200;
  const body =
    normalized.length > maxBody
      ? `${normalized.slice(0, maxBody - 1)}\u2026`
      : normalized;
  return { title: "\u03c0", body };
};

export default function (pi: ExtensionAPI) {
  pi.on("agent_end", async (event) => {
    const lastText = extractLastAssistantText(
      (event as { messages?: Array<{ role?: string; content?: unknown }> })
        .messages ?? []
    );
    const { title, body } = formatNotification(lastText);
    notify(title, body);
  });
}
