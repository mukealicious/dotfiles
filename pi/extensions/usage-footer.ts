import type { AssistantMessage } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

const CHATGPT_USAGE_URL = "https://chatgpt.com/backend-api/wham/usage";
const FIVE_HOURS_SECONDS = 5 * 60 * 60;
const WEEK_SECONDS = 7 * 24 * 60 * 60;
const REFRESH_INTERVAL_MS = 60_000;

const OPENAI_AUTH_CLAIM = "https://api.openai.com/auth";
const OPENAI_PROFILE_CLAIM = "https://api.openai.com/profile";

type UsageWindow = {
  usedPercent: number;
  windowSeconds: number;
  resetAt?: number;
};

type UsageSnapshot = {
  planType?: string;
  email?: string;
  fiveHour?: UsageWindow;
  weekly?: UsageWindow;
  fetchedAt: number;
};

type UsageState = {
  snapshot?: UsageSnapshot;
  lastFetchAt: number;
  inFlight?: Promise<UsageSnapshot | undefined>;
  requestRender: () => void;
};

type TokenTotals = {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  cost: number;
};

const asRecord = (value: unknown): Record<string, unknown> | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
};

const isOpenAICodexProvider = (provider: unknown): provider is string =>
  typeof provider === "string" &&
  (provider === "openai-codex" || /^openai-codex-\d+$/.test(provider));

const decodeJwtPayload = (token: string): Record<string, unknown> => {
  const payload = token.split(".")[1];
  if (!payload) return {};

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return {};
  }
};

const getTokenMetadata = (token: string) => {
  const payload = decodeJwtPayload(token);
  const auth = asRecord(payload[OPENAI_AUTH_CLAIM]);
  const profile = asRecord(payload[OPENAI_PROFILE_CLAIM]);

  return {
    accountId:
      typeof auth?.chatgpt_account_id === "string"
        ? auth.chatgpt_account_id
        : undefined,
    planType:
      typeof auth?.chatgpt_plan_type === "string"
        ? auth.chatgpt_plan_type
        : undefined,
    email: typeof profile?.email === "string" ? profile.email : undefined,
  };
};

const formatTokens = (count: number): string => {
  if (count < 1000) return count.toString();
  if (count < 10_000) return `${(count / 1000).toFixed(1)}k`;
  if (count < 1_000_000) return `${Math.round(count / 1000)}k`;
  if (count < 10_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  return `${Math.round(count / 1_000_000)}M`;
};

const formatPercent = (value: number | undefined, digits = 0): string => {
  if (value === undefined || Number.isNaN(value)) return "?%";
  const clamped = Math.max(0, Math.min(100, value));
  return `${clamped.toFixed(digits)}%`;
};

const formatReset = (resetAt?: number): string => {
  if (!resetAt) return "?";

  const minutes = Math.max(0, Math.round((resetAt * 1000 - Date.now()) / 60_000));
  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes % (60 * 24)) / 60);

  if (days > 0) return `~${days}d`;
  if (hours > 0) return `~${hours}h`;
  return `~${minutes}m`;
};

const formatResetLong = (resetAt?: number): string => {
  if (!resetAt) return "unknown";

  const minutes = Math.max(0, Math.round((resetAt * 1000 - Date.now()) / 60_000));
  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes % (60 * 24)) / 60);
  const mins = minutes % 60;

  if (days > 0) return `in ${days}d ${hours}h`;
  if (hours > 0) return `in ${hours}h ${mins}m`;
  return `in ${mins}m`;
};

const contextColor = (percent: number) => {
  if (percent >= 90) return "error";
  if (percent >= 70) return "warning";
  return "dim";
};

const usageColor = (window?: UsageWindow) => {
  const percent = Math.max(0, Math.min(100, window?.usedPercent ?? 0));
  if (percent >= 90) return "error";
  if (percent >= 80) return "warning";
  return "dim";
};

const usageMeter = (percent: number | undefined): string => {
  const cells = 5;
  const clamped = Math.max(0, Math.min(100, percent ?? 0));
  const filled = Math.round((clamped / 100) * cells);
  return `${"▰".repeat(filled)}${"▱".repeat(cells - filled)}`;
};

const normalizeWindow = (value: unknown): UsageWindow | undefined => {
  const record = asRecord(value);
  if (!record) return undefined;

  const usedPercent = record.used_percent;
  const windowSeconds = record.limit_window_seconds;
  const resetAt = record.reset_at;

  if (typeof usedPercent !== "number" || typeof windowSeconds !== "number") {
    return undefined;
  }

  return {
    usedPercent,
    windowSeconds,
    resetAt: typeof resetAt === "number" ? resetAt : undefined,
  };
};

const parseUsageSnapshot = (data: unknown, tokenMetadata: ReturnType<typeof getTokenMetadata>): UsageSnapshot => {
  const raw = asRecord(data);
  const rateLimit = asRecord(raw?.rate_limit);
  const windows = [
    normalizeWindow(rateLimit?.primary_window),
    normalizeWindow(rateLimit?.secondary_window),
  ].filter((window): window is UsageWindow => Boolean(window));

  return {
    planType: typeof raw?.plan_type === "string" ? raw.plan_type : tokenMetadata.planType,
    email: typeof raw?.email === "string" ? raw.email : tokenMetadata.email,
    fiveHour: windows.find(
      (window) => Math.abs(window.windowSeconds - FIVE_HOURS_SECONDS) <= 120
    ),
    weekly: windows.find(
      (window) => Math.abs(window.windowSeconds - WEEK_SECONDS) <= 120
    ),
    fetchedAt: Date.now(),
  };
};

async function fetchChatGptUsage(ctx: any, state: UsageState, force = false): Promise<UsageSnapshot | undefined> {
  const model = ctx.model;
  if (!isOpenAICodexProvider(model?.provider)) {
    state.snapshot = undefined;
    state.requestRender();
    return undefined;
  }

  const now = Date.now();
  if (!force && state.snapshot && now - state.lastFetchAt < REFRESH_INTERVAL_MS) {
    return state.snapshot;
  }

  if (state.inFlight) return state.inFlight;

  state.inFlight = (async () => {
    try {
      const auth = await ctx.modelRegistry.getApiKeyAndHeaders(model);
      if (!auth?.ok || !auth.apiKey) {
        state.snapshot = undefined;
        return undefined;
      }

      const tokenMetadata = getTokenMetadata(auth.apiKey);
      const headers: Record<string, string> = {
        Authorization: `Bearer ${auth.apiKey}`,
        Accept: "application/json",
        "User-Agent": "pi-usage-footer",
      };
      if (tokenMetadata.accountId) {
        headers["chatgpt-account-id"] = tokenMetadata.accountId;
      }

      const response = await fetch(CHATGPT_USAGE_URL, {
        headers,
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) {
        state.snapshot = undefined;
        return undefined;
      }

      state.snapshot = parseUsageSnapshot(await response.json(), tokenMetadata);
      state.lastFetchAt = Date.now();
      return state.snapshot;
    } catch {
      state.snapshot = undefined;
      return undefined;
    } finally {
      state.inFlight = undefined;
      state.requestRender();
    }
  })();

  return state.inFlight;
}

const addUsage = (totals: TokenTotals, usage: AssistantMessage["usage"] | undefined): void => {
  totals.input += usage?.input ?? 0;
  totals.output += usage?.output ?? 0;
  totals.cacheRead += usage?.cacheRead ?? 0;
  totals.cacheWrite += usage?.cacheWrite ?? 0;
  totals.cost += usage?.cost?.total ?? 0;
};

const collectTotals = (ctx: any): TokenTotals => {
  const totals = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0 };
  for (const entry of ctx.sessionManager.getBranch()) {
    if (entry.type === "message" && entry.message?.role === "assistant") {
      addUsage(totals, entry.message.usage);
    }
  }
  return totals;
};

const compactCwd = (ctx: any): string => {
  let cwd = ctx.sessionManager.getCwd?.() ?? ctx.cwd ?? process.cwd();
  const home = process.env.HOME;
  if (home && cwd.startsWith(home)) cwd = `~${cwd.slice(home.length)}`;

  const sessionName = ctx.sessionManager.getSessionName?.();
  if (sessionName) cwd = `${cwd} • ${sessionName}`;
  return cwd;
};

const renderUsagePart = (theme: any, label: string, window?: UsageWindow): string | undefined => {
  if (!window) return undefined;

  const text = `${label} ${formatPercent(window.usedPercent)} ${usageMeter(window.usedPercent)} · ${formatReset(window.resetAt)}`;
  return theme.fg(usageColor(window), text);
};

const renderStatuses = (theme: any, footerData: any, width: number): string | undefined => {
  const statuses: string[] = [];
  const extensionStatuses = footerData.getExtensionStatuses?.();
  if (extensionStatuses instanceof Map) {
    for (const value of extensionStatuses.values()) {
      if (typeof value === "string" && value.trim()) statuses.push(value.trim());
    }
  }

  if (statuses.length === 0) return undefined;
  return truncateToWidth(statuses.join(theme.fg("dim", "  ")), width, "…");
};

const renderBottomLine = (
  theme: any,
  footerData: any,
  width: number,
  weeklyUsage?: string
): string | undefined => {
  const statusesLine = renderStatuses(theme, footerData, width);
  if (!weeklyUsage) return statusesLine;

  const weeklyWidth = visibleWidth(weeklyUsage);
  if (!statusesLine) {
    return `${" ".repeat(Math.max(0, width - weeklyWidth))}${weeklyUsage}`;
  }

  const statusesWidth = visibleWidth(statusesLine);
  if (statusesWidth + 2 + weeklyWidth <= width) {
    return `${statusesLine}${" ".repeat(width - statusesWidth - weeklyWidth)}${weeklyUsage}`;
  }

  const availableStatuses = Math.max(0, width - weeklyWidth - 2);
  const truncatedStatuses = truncateToWidth(statusesLine, availableStatuses, "…");
  return `${truncatedStatuses}${" ".repeat(Math.max(1, width - visibleWidth(truncatedStatuses) - weeklyWidth))}${weeklyUsage}`;
};

function installFooter(pi: ExtensionAPI, ctx: any, state: UsageState) {
  ctx.ui.setFooter((tui: any, theme: any, footerData: any) => {
    state.requestRender = () => tui.requestRender();
    const unsubscribe = footerData.onBranchChange?.(() => tui.requestRender());

    return {
      dispose() {
        unsubscribe?.();
      },
      invalidate() {},
      render(width: number): string[] {
        const model = ctx.model;
        const totals = collectTotals(ctx);
        const usingSubscription = model ? ctx.modelRegistry.isUsingOAuth?.(model) : false;

        let location = compactCwd(ctx);
        const branch = footerData.getGitBranch?.();
        if (branch) location = `${location} (${branch})`;
        const locationLine = truncateToWidth(
          theme.fg("dim", location),
          width,
          theme.fg("dim", "…")
        );

        const leftParts: string[] = [];
        leftParts.push(`$${totals.cost.toFixed(3)}${usingSubscription ? " (sub)" : ""}`);
        if (totals.input) leftParts.push(`↑${formatTokens(totals.input)}`);
        if (totals.output) leftParts.push(`↓${formatTokens(totals.output)}`);
        if (totals.cacheRead) leftParts.push(`R${formatTokens(totals.cacheRead)}`);

        const contextUsage = ctx.getContextUsage?.();
        const contextWindow = contextUsage?.contextWindow ?? model?.contextWindow;
        const contextPercent =
          typeof contextUsage?.percent === "number" ? contextUsage.percent : undefined;
        if (contextWindow) {
          leftParts.push(
            theme.fg(
              contextColor(contextPercent ?? 0),
              `${formatPercent(contextPercent, 1)}/${formatTokens(contextWindow)}`
            )
          );
        }

        const providerPrefix =
          footerData.getAvailableProviderCount?.() > 1 && model?.provider
            ? `(${model.provider}) `
            : "";
        const rightParts = [`${providerPrefix}${model?.id ?? "no-model"}`];
        if (model?.reasoning) {
          const thinkingLevel = pi.getThinkingLevel?.() ?? "off";
          rightParts.push(thinkingLevel === "off" ? "thinking off" : thinkingLevel);
        }
        const fiveHourUsage = isOpenAICodexProvider(model?.provider)
          ? renderUsagePart(theme, "5h", state.snapshot?.fiveHour)
          : undefined;
        const weeklyUsage = isOpenAICodexProvider(model?.provider)
          ? renderUsagePart(theme, "W", state.snapshot?.weekly)
          : undefined;
        if (fiveHourUsage) rightParts.push(fiveHourUsage);

        const left = leftParts.join(theme.fg("dim", "  "));
        const right = rightParts.join(theme.fg("dim", " • "));
        const leftWidth = visibleWidth(left);
        const rightWidth = visibleWidth(right);

        let statsLine: string;
        if (leftWidth + 2 + rightWidth <= width) {
          statsLine = left + " ".repeat(width - leftWidth - rightWidth) + right;
        } else {
          const availableRight = Math.max(0, width - leftWidth - 2);
          const truncatedRight = truncateToWidth(right, availableRight, "");
          statsLine =
            left +
            " ".repeat(Math.max(1, width - leftWidth - visibleWidth(truncatedRight))) +
            truncatedRight;
        }

        const lines = [locationLine, truncateToWidth(statsLine, width, "")];
        const bottomLine = renderBottomLine(theme, footerData, width, weeklyUsage);
        if (bottomLine) lines.push(bottomLine);
        return lines;
      },
    };
  });
}

function usageDetails(snapshot?: UsageSnapshot): string {
  if (!snapshot) return "Could not load ChatGPT usage.";

  const lines = [
    `plan: ${snapshot.planType ?? "unknown"}`,
    snapshot.email ? `email: ${snapshot.email}` : undefined,
    `5-hour: ${formatPercent(snapshot.fiveHour?.usedPercent)} used, resets ${formatResetLong(snapshot.fiveHour?.resetAt)}`,
    `weekly: ${formatPercent(snapshot.weekly?.usedPercent)} used, resets ${formatResetLong(snapshot.weekly?.resetAt)}`,
    `fetched: ${new Date(snapshot.fetchedAt).toLocaleString()}`,
  ].filter((line): line is string => Boolean(line));

  return lines.join("\n");
}

export default function usageFooter(pi: ExtensionAPI) {
  const state: UsageState = {
    lastFetchAt: 0,
    requestRender: () => {},
  };

  const refreshInBackground = (ctx: any, force = false) => {
    fetchChatGptUsage(ctx, state, force).catch(() => undefined);
  };

  pi.on("session_start", async (_event, ctx) => {
    installFooter(pi, ctx, state);
    refreshInBackground(ctx, true);
  });

  pi.on("model_select", async (_event, ctx) => refreshInBackground(ctx, true));
  pi.on("agent_end", async (_event, ctx) => refreshInBackground(ctx));

  pi.on("session_shutdown", async () => {
    state.requestRender = () => {};
  });

  pi.registerCommand("usage", {
    description: "Show ChatGPT Codex subscription usage",
    handler: async (_args, ctx) => {
      if (!isOpenAICodexProvider(ctx.model?.provider)) {
        ctx.ui.notify("ChatGPT usage is only available for openai-codex models.", "info");
        return;
      }

      const snapshot = await fetchChatGptUsage(ctx, state, true);
      ctx.ui.notify(usageDetails(snapshot), snapshot ? "info" : "warning");
    },
  });
}
