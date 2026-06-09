import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const EXA_API_BASE = "https://api.exa.ai";
const EXA_DOCS_URL = "https://docs.exa.ai/reference/search-api-guide-for-coding-agents";
const SEARCH_TYPES = ["auto", "fast", "instant", "deep-lite", "deep", "deep-reasoning"] as const;
const CONTENT_MODES = ["highlights", "text", "summary", "none"] as const;

type SearchType = (typeof SEARCH_TYPES)[number];
type ContentMode = (typeof CONTENT_MODES)[number];

type ExaSearchParams = {
  query: string;
  type?: SearchType;
  numResults?: number;
  contentMode?: ContentMode;
  includeDomains?: string[];
  excludeDomains?: string[];
  maxAgeHours?: number;
  textMaxCharacters?: number;
};

type ExaSearchResult = {
  title?: string;
  url?: string;
  publishedDate?: string;
  author?: string;
  highlights?: string[];
  text?: string;
  summary?: string;
};

type ExaSearchResponse = {
  requestId?: string;
  resolvedSearchType?: string;
  results?: ExaSearchResult[];
};

function getApiKey(): string | undefined {
  const key = process.env.EXA_API_KEY?.trim();
  return key || undefined;
}

function numberOrDefault(value: number | undefined, fallback: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(value as number)));
}

function buildContents(params: ExaSearchParams): Record<string, unknown> | undefined {
  const mode = params.contentMode ?? "highlights";
  if (mode === "none") return undefined;

  const contents: Record<string, unknown> = {};
  if (mode === "highlights") contents.highlights = true;
  if (mode === "summary") contents.summary = { query: params.query };
  if (mode === "text") contents.text = { maxCharacters: numberOrDefault(params.textMaxCharacters, 12000, 1000, 50000) };
  if (Number.isFinite(params.maxAgeHours)) contents.maxAgeHours = params.maxAgeHours;
  return contents;
}

function buildSearchBody(params: ExaSearchParams): Record<string, unknown> {
  const body: Record<string, unknown> = {
    query: params.query,
    type: params.type ?? "auto",
    numResults: numberOrDefault(params.numResults, 10, 1, 25),
  };

  const contents = buildContents(params);
  if (contents) body.contents = contents;
  if (params.includeDomains?.length) body.includeDomains = params.includeDomains;
  if (params.excludeDomains?.length) body.excludeDomains = params.excludeDomains;
  return body;
}

async function callExa(path: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<unknown> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("EXA_API_KEY is not set. Create an Exa API key, then add it to your private shell env (for fish: set -Ux EXA_API_KEY '...').");
  }

  const response = await fetch(`${EXA_API_BASE}${path}`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    signal,
  });

  const text = await response.text();
  let payload: unknown;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    const message = typeof payload === "object" && payload !== null && "message" in payload
      ? String((payload as { message?: unknown }).message)
      : text.slice(0, 500) || response.statusText;
    throw new Error(`Exa API error ${response.status}: ${message}`);
  }

  return payload;
}

function formatSearchResponse(query: string, response: ExaSearchResponse): string {
  const results = response.results ?? [];
  if (results.length === 0) return `No Exa results found for: "${query}"`;

  const lines = [`Found ${results.length} Exa results for: "${query}"`];
  for (const [index, result] of results.entries()) {
    const title = result.title || "Untitled";
    const url = result.url || "(no url)";
    const date = result.publishedDate ? ` · ${result.publishedDate}` : "";
    const excerpts = result.highlights?.length
      ? result.highlights.slice(0, 3).join("\n   ")
      : result.summary || result.text?.slice(0, 800) || "";
    lines.push(`\n${index + 1}. **${title}**${date}\n   ${url}${excerpts ? `\n   ${excerpts}` : ""}`);
  }
  return lines.join("\n");
}

export default function registerExaExtension(pi: ExtensionAPI): void {
  pi.registerTool({
    name: "exa_search",
    label: "Exa Search",
    description: "Search the public web with Exa. Prefer this for quick web discovery, coding docs, API examples, and low-cost current web lookups before using Parallel.",
    promptSnippet: "Use exa_search first for ordinary public-web discovery, coding docs, API examples, and quick current lookups. Use Parallel only when deep synthesis, enrichment, or Parallel-specific extraction is needed.",
    promptGuidelines: [
      "Call this tool directly as exa_search({...}) — do NOT route through the mcp() tool.",
      "Prefer exa_search over parallel_search for quick factual lookups, coding documentation, API examples, and ordinary web discovery.",
      "Do NOT use web search for known URLs, raw GitHub files, APIs, localhost, or downloads; use bash/curl for those.",
      "Use type='auto' with contentMode='highlights' by default; it is the balanced, low-friction path.",
      "Use type='deep' or 'deep-reasoning' only for harder comparisons or synthesis; use parallel_research for broad deep research when the user wants a full research brief.",
      `If Exa behavior seems stale or contradictory, fetch the canonical Exa coding-agent docs: ${EXA_DOCS_URL}`,
    ],
    parameters: Type.Object({
      query: Type.String({ description: "Natural language search query or search objective" }),
      type: Type.Optional(Type.Union(SEARCH_TYPES.map((value) => Type.Literal(value)), {
        description: "Search type. Default: auto. Use deep/deep-reasoning only for harder synthesis or comparison.",
      })),
      numResults: Type.Optional(Type.Number({ description: "Number of results, 1-25. Default: 10" })),
      contentMode: Type.Optional(Type.Union(CONTENT_MODES.map((value) => Type.Literal(value)), {
        description: "Returned content mode. Default: highlights. Use text sparingly; none returns URLs only.",
      })),
      includeDomains: Type.Optional(Type.Array(Type.String(), { description: "Optional domains to restrict results to, e.g. ['github.com', 'docs.python.org']" })),
      excludeDomains: Type.Optional(Type.Array(Type.String(), { description: "Optional domains to exclude from results" })),
      maxAgeHours: Type.Optional(Type.Number({ description: "Optional freshness control for returned contents. 0 forces livecrawl; -1 cache only." })),
      textMaxCharacters: Type.Optional(Type.Number({ description: "When contentMode='text', cap extracted text characters per result. Default: 12000" })),
    }),
    async execute(_toolCallId, params: ExaSearchParams, signal) {
      try {
        const body = buildSearchBody(params);
        const result = await callExa("/search", body, signal) as ExaSearchResponse;
        return {
          content: [{ type: "text" as const, text: formatSearchResponse(params.query, result) }],
          details: { ...result, query: params.query, request: body },
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: error instanceof Error ? error.message : String(error) }],
          details: { query: params.query },
          isError: true,
        };
      }
    },
  });

  pi.registerCommand("exa-setup", {
    description: "Check Exa API key setup",
    handler: async (_args: string, ctx) => {
      if (getApiKey()) {
        ctx.ui.notify("✓ EXA_API_KEY is set. exa_search is ready.", "info");
      } else {
        ctx.ui.notify("✗ EXA_API_KEY is not set. For fish: set -Ux EXA_API_KEY 'your_key_here'", "warning");
      }
    },
  });
}
