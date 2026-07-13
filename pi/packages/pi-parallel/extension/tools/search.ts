import { Type } from "typebox";
import { StringEnum } from "@earendil-works/pi-ai";
import { runCliWithHeartbeat, type SearchResult } from "../cli.js";
import { renderSearchCall, renderSearchResult } from "../render.js";

const SEARCH_MODES = ["turbo", "basic", "advanced"] as const;
const DEFAULT_MODE = "turbo";
const MAX_EXCERPT_CHARS = 1_200;

function formatSearchResults(query: string, result: SearchResult): string {
  const results = result.results ?? [];
  const lines = [`Found ${results.length} results for: "${query}"`];

  for (const [index, item] of results.entries()) {
    const excerpt = item.excerpts?.[0]?.slice(0, MAX_EXCERPT_CHARS) ?? "";
    lines.push(`\n${index + 1}. **${item.title || "Untitled"}**${item.publish_date ? ` · ${item.publish_date}` : ""}`);
    lines.push(`   ${item.url}`);
    if (excerpt) lines.push(`   ${excerpt}`);
  }

  return lines.join("\n");
}

export const searchTool = {
  name: "web_search",
  label: "Web Search",
  description: "Search the public web with Parallel. Defaults to low-latency, low-cost Turbo mode for ordinary discovery and lookups; use Basic when deeper context is needed and Advanced for complex multi-hop retrieval. Returns ranked pages with LLM-ready excerpts.",
  promptSnippet: "Use Parallel Turbo first for ordinary public-web discovery and quick current lookups. Escalate to Basic when Turbo is thin, or use Exa for semantic/code discovery and broader multilingual search.",
  promptGuidelines: [
    "Call web_search directly — do NOT route it through the mcp() tool",
    "Default web_search to mode='turbo' for ordinary web discovery, factual lookups, news, and documentation",
    "Retry web_search with mode='basic' when Turbo returns thin context; reserve mode='advanced' for complex multi-hop retrieval",
    "Use exa_search for semantic discovery, obscure technical/code material, non-English/Japanese queries, or contradictory Parallel results",
    "Do not use web_search when you already have a specific URL — use curl or bash instead (raw GitHub URLs, API endpoints, localhost)",
    "Use deep_research instead of web_search when the answer requires synthesis across many sources",
    "Use web_search afterDate to scope results to recent content such as news, releases, and changelogs",
    "web_search returns excerpts; follow up with web_fetch only when a public page needs fuller extraction",
  ],
  parameters: Type.Object({
    query: Type.String({ description: "The search query — can be natural language ('how to deploy Next.js on Vercel') or keywords ('Next.js Vercel deployment guide'). More specific queries yield more relevant results." }),
    mode: Type.Optional(StringEnum(SEARCH_MODES, {
      description: "Parallel search mode. Defaults to turbo. Use basic for deeper context or advanced for complex multi-hop retrieval.",
    })),
    maxResults: Type.Optional(Type.Integer({ minimum: 1, maximum: 25, description: "Maximum number of results to return. Defaults to 10. Lower values (3-5) are faster for quick lookups; higher values (15-20) are better when you need breadth." })),
    afterDate: Type.Optional(Type.String({ description: "Filter to results published after this date in YYYY-MM-DD format. Useful for finding recent releases, news, or ensuring up-to-date information." })),
    includeDomains: Type.Optional(Type.Array(Type.String(), { description: "Only return results from these domains." })),
    excludeDomains: Type.Optional(Type.Array(Type.String(), { description: "Exclude results from these domains." })),
    maxAgeSeconds: Type.Optional(Type.Integer({ minimum: 600, description: "Maximum cached-content age before Parallel fetches live content. Minimum: 600 seconds." })),
    location: Type.Optional(Type.String({ description: "Optional ISO 3166-1 alpha-2 country code for geo-targeted results." })),
  }),
  async execute(_toolCallId: string, params: any, signal: AbortSignal | undefined, onUpdate: any, _ctx: any) {
    try {
      const mode = params.mode ?? DEFAULT_MODE;
      const args = ["search", params.query, "--mode", mode, "--max-results", String(params.maxResults ?? 10), "--json"];
      if (params.afterDate) args.push("--after-date", params.afterDate);
      for (const domain of params.includeDomains ?? []) args.push("--include-domains", domain);
      for (const domain of params.excludeDomains ?? []) args.push("--exclude-domains", domain);
      if (params.maxAgeSeconds != null) args.push("--max-age-seconds", String(params.maxAgeSeconds));
      if (params.location) args.push("--location", params.location);

      const startTime = Date.now();
      onUpdate?.({
        content: [{ type: "text" as const, text: `🔎 Search started · \"${params.query}\"` }],
        details: { status: "running", query: params.query, mode, maxResults: params.maxResults ?? 10 },
      });

      const result: SearchResult = await runCliWithHeartbeat(
        args,
        signal,
        onUpdate,
        startTime,
        (elapsed) => ({
          content: [{ type: "text" as const, text: `🔎 Searching the web · ${params.query}` }],
          details: {
            status: "running",
            query: params.query,
            mode,
            maxResults: params.maxResults ?? 10,
            elapsed,
          },
        }),
      );
      return {
        content: [{ type: "text" as const, text: formatSearchResults(params.query, result) }],
        details: {
          query: params.query,
          mode,
          search_id: result.search_id,
          status: result.status,
          results: result.results?.map((r: any) => ({
            url: r.url,
            title: r.title,
            publish_date: r.publish_date,
            excerpts: r.excerpts?.slice(0, 2),
          })),
        },
      };
    } catch (err: any) {
      throw err instanceof Error ? err : new Error(String(err));
    }
  },
  renderCall: renderSearchCall,
  renderResult: renderSearchResult,
};
