/**
 * Watchdog Extension
 *
 * Detects stuck agents by monitoring inactivity. When no tool execution,
 * message, or turn completion occurs for a configurable interval (default
 * 5 minutes), spawns a Claude Haiku judge to evaluate the session and
 * decide: Continue (still working), Nudge (suggest alternatives), or
 * Abort (stop the agent). Max 3 interventions before forced abort.
 *
 * Usage: /watchdog [off|on|<minutes>]
 *
 * Adapted from HazAT/pi-config.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

interface JudgeResult {
  action: "continue" | "nudge" | "abort";
  message: string;
  compact: boolean;
}

function formatSessionSummary(ctx: any): string {
  const entries: any[] = ctx.sessionManager.getBranch();
  const recent = entries.slice(-20);

  const lines: string[] = [];
  let totalChars = 0;
  const CAP = 4000;

  const usage = ctx.getContextUsage?.();
  if (usage?.tokens != null) {
    lines.push(`[CONTEXT] ${usage.tokens} tokens used`);
  }

  for (const entry of recent) {
    if (totalChars >= CAP) break;
    if (entry.type !== "message" || !entry.message) continue;

    const msg = entry.message;
    const ts = entry.timestamp
      ? new Date(entry.timestamp).toISOString().substring(11, 19)
      : "";
    const prefix = ts ? `[${ts}] ` : "";

    let line = "";

    if (msg.role === "user") {
      const text =
        typeof msg.content === "string"
          ? msg.content
          : Array.isArray(msg.content)
            ? msg.content.map((b: any) => b.text ?? "").join(" ")
            : "";
      line = `${prefix}[USER] ${text.substring(0, 200)}`;
    } else if (msg.role === "assistant") {
      if (Array.isArray(msg.content)) {
        for (const block of msg.content) {
          if (totalChars >= CAP) break;
          if (block.type === "text") {
            line = `${prefix}[ASSISTANT] ${block.text.substring(0, 200)}`;
          } else if (block.type === "toolCall") {
            const args = JSON.stringify(block.arguments ?? {});
            line = `${prefix}[TOOL_CALL] ${block.name}(${args.substring(0, 100)})`;
          }
          if (line) {
            lines.push(line);
            totalChars += line.length;
            line = "";
          }
        }
        continue;
      }
    } else if (msg.role === "toolResult") {
      const content = Array.isArray(msg.content)
        ? msg.content.map((b: any) => b.text ?? "").join(" ")
        : String(msg.content ?? "");
      const status = msg.isError ? "error" : "success";
      line = `${prefix}[TOOL_RESULT] ${msg.toolName ?? ""}: ${status} - ${content.substring(0, 200)}`;
    } else {
      continue;
    }

    if (line) {
      lines.push(line);
      totalChars += line.length;
    }
  }

  return lines.join("\n");
}

async function callJudge(
  pi: ExtensionAPI,
  summary: string,
  timeSinceActivityMs: number,
  consecutiveInterventions: number,
): Promise<JudgeResult> {
  const defaultResult: JudgeResult = {
    action: "continue",
    message: "Judge unavailable",
    compact: false,
  };

  const idleSecs = Math.round(timeSinceActivityMs / 1000);

  const judgePrompt = `You are monitoring an AI coding agent session. Analyze the recent activity and determine if the agent needs intervention.

## Recent Session Activity
${summary}

## Situation
- The agent has not produced any new activity for ${idleSecs} seconds
- There have been ${consecutiveInterventions} previous watchdog interventions in this session

## Analysis Instructions
Determine one of:
- **continue**: Agent is making progress (just slow) — no intervention needed
- **nudge**: Agent appears stuck — suggest what it should try differently in your message
- **abort**: Agent is looping (same errors/approaches repeated) — situation is unrecoverable without user input

Also consider:
- If context token count is high (>150k), set compact: true to recommend compaction
- If the agent is looping on the same errors or approaches, recommend abort
- Your message should be actionable: what specifically should the agent try?

Respond ONLY with valid JSON, no other text, no markdown fences:
{ "action": "continue" | "nudge" | "abort", "message": "explanation", "compact": true | false }`;

  try {
    const result = await pi.exec(
      "pi",
      [
        "-p",
        "--no-session",
        "--no-tools",
        "--model",
        "anthropic/claude-haiku-3-5",
        judgePrompt,
      ],
      { timeout: 30000 },
    );

    if (result.code !== 0 || !result.stdout) return defaultResult;

    const text = result.stdout.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return defaultResult;

    const parsed = JSON.parse(jsonMatch[0]);
    if (
      parsed.action === "continue" ||
      parsed.action === "nudge" ||
      parsed.action === "abort"
    ) {
      return {
        action: parsed.action,
        message: String(parsed.message ?? ""),
        compact: Boolean(parsed.compact),
      };
    }
    return defaultResult;
  } catch {
    return defaultResult;
  }
}

export default function (pi: ExtensionAPI) {
  let lastActivityTimestamp: number = Date.now();
  let consecutiveInterventions: number = 0;
  let enabled: boolean = false;
  let checkIntervalMs: number = 5 * 60 * 1000;
  let stuckThresholdMs: number = 5 * 60 * 1000;
  const maxInterventions: number = 3;

  let checkInterval: ReturnType<typeof setInterval> | null = null;
  let sessionCtx: any = null;
  let judgeInProgress: boolean = false;

  function updateActivity() {
    lastActivityTimestamp = Date.now();
    consecutiveInterventions = 0;
  }

  function getIntervalMinutes(): number {
    return Math.round(checkIntervalMs / 60_000);
  }

  function updateStatusBar() {
    if (!sessionCtx) return;
    if (enabled) {
      sessionCtx.ui.setStatus("watchdog", `\uD83D\uDC35 ${getIntervalMinutes()}m`);
    } else {
      sessionCtx.ui.setStatus("watchdog", "\uD83D\uDE48");
    }
  }

  function startTimer(ctx: any) {
    if (checkInterval) clearInterval(checkInterval);
    checkInterval = setInterval(async () => {
      if (!enabled || !ctx) return;
      if (ctx.isIdle()) return;

      const timeSinceActivity = Date.now() - lastActivityTimestamp;
      if (timeSinceActivity < stuckThresholdMs) return;
      if (judgeInProgress) return;

      judgeInProgress = true;
      try {
        if (consecutiveInterventions >= maxInterventions) {
          await ctx.abort();
          pi.sendUserMessage(
            "[Watchdog] Giving up after " +
              maxInterventions +
              " intervention attempts. The current operation was cancelled. Please review and decide how to proceed.",
            { deliverAs: "followUp" },
          );
          enabled = false;
          updateStatusBar();
          return;
        }

        const summary = formatSessionSummary(ctx);
        const judgment = await callJudge(
          pi,
          summary,
          timeSinceActivity,
          consecutiveInterventions,
        );

        if (judgment.action === "continue") {
          lastActivityTimestamp = Date.now();
        } else if (judgment.action === "nudge") {
          await ctx.abort();
          pi.sendUserMessage(
            "[Watchdog] " +
              judgment.message +
              " The blocked operation was cancelled. Try a different approach.",
            { deliverAs: "followUp" },
          );
          consecutiveInterventions++;
          lastActivityTimestamp = Date.now();
          if (judgment.compact) {
            ctx.compact();
          }
        } else if (judgment.action === "abort") {
          await ctx.abort();
          pi.sendUserMessage(
            "[Watchdog] " +
              judgment.message +
              " Session stopped to avoid wasting resources.",
            { deliverAs: "followUp" },
          );
          enabled = false;
          updateStatusBar();
          if (judgment.compact) {
            ctx.compact();
          }
        }
      } catch {
        // Swallow errors — watchdog should never crash the session
      } finally {
        judgeInProgress = false;
      }
    }, checkIntervalMs);
  }

  pi.on("turn_end", async () => updateActivity());
  pi.on("tool_execution_end", async () => updateActivity());
  pi.on("tool_execution_update", async () => updateActivity());
  pi.on("message_end", async () => updateActivity());
  pi.on("agent_end", async () => updateActivity());

  pi.on("session_start", async (_event, ctx) => {
    sessionCtx = ctx;
    lastActivityTimestamp = Date.now();
    consecutiveInterventions = 0;
    updateStatusBar();
    if (enabled) startTimer(ctx);
  });

  pi.on("session_shutdown", async () => {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
    sessionCtx = null;
  });

  pi.registerCommand("watchdog", {
    description:
      "Toggle watchdog or set interval in minutes (e.g., /watchdog off, /watchdog on, /watchdog 3)",
    handler: async (args, ctx) => {
      sessionCtx = ctx;
      const arg = (args ?? "").trim().toLowerCase();

      if (arg === "off") {
        enabled = false;
        updateStatusBar();
        return "Watchdog disabled.";
      }

      if (arg === "on") {
        enabled = true;
        consecutiveInterventions = 0;
        lastActivityTimestamp = Date.now();
        updateStatusBar();
        startTimer(ctx);
        return `Watchdog enabled (${getIntervalMinutes()}m).`;
      }

      if (arg === "") {
        enabled = !enabled;
        if (enabled) {
          consecutiveInterventions = 0;
          lastActivityTimestamp = Date.now();
          startTimer(ctx);
        }
        updateStatusBar();
        return enabled
          ? `Watchdog enabled (${getIntervalMinutes()}m).`
          : "Watchdog disabled.";
      }

      const minutes = parseInt(arg, 10);
      if (!isNaN(minutes) && minutes > 0) {
        checkIntervalMs = minutes * 60_000;
        stuckThresholdMs = checkIntervalMs;
        enabled = true;
        updateStatusBar();
        startTimer(ctx);
        return `Watchdog set to ${minutes}m interval.`;
      }

      return `Unknown argument: "${arg}". Usage: /watchdog [off|on|<minutes>]`;
    },
  });
}
