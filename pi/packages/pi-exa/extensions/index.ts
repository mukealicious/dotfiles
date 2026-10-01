import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type, type Static } from "typebox";
import { Check } from "typebox/value";

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

// Validate fields we consume, but retain all provider metadata in structuredContent.
const SearchResponse = Type.Object({
  requestId: Type.Optional(Type.String()),
  resolvedSearchType: Type.Optional(Type.String()),
  results: Type.Array(Type.Object({
    title: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    url: Type.String(),
    publishedDate: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    author: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    highlights: Type.Optional(Type.Union([Type.Array(Type.String()), Type.Null()])),
    text: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    summary: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  }, { additionalProperties: true })),
}, { additionalProperties: true });

type ExaSearchResponse = Static<typeof SearchResponse>;

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

async function callExa(path: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<ExaSearchResponse> {
  signal?.throwIfAborted();
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
    payload = JSON.parse(text);
  } catch {
    if (response.ok) throw new Error("Exa returned invalid JSON.");
  }
  signal?.throwIfAborted();

  if (!response.ok) {
    const message = typeof payload === "object" && payload !== null && "message" in payload
      ? String((payload as { message?: unknown }).message)
      : text.slice(0, 500) || response.statusText;
    throw new Error(`Exa API error ${response.status}: ${message}`);
  }

  if (!Check(SearchResponse, payload)) {
    throw new Error("Exa returned an invalid search response (expected a results array).");
  }
  return payload;
}

function formatSearchResponse(query: string, response: ExaSearchResponse, mode: ContentMode): string {
  const results = response.results ?? [];
  if (results.length === 0) return `No Exa results found for: "${query}"`;

  const lines = [`Found ${results.length} Exa results for: "${query}"`];
  for (const [index, result] of results.entries()) {
    const title = result.title || "Untitled";
    const url = result.url || "(no url)";
    const date = result.publishedDate ? ` · ${result.publishedDate}` : "";
    // content is model-visible, not just a UI preview. Restricted researchers
    // cannot use codemode to recover text requested explicitly through this tool.
    const excerpts = mode === "none" ? ""
      : mode === "text" ? result.text || ""
      : mode === "summary" ? result.summary || ""
      : result.highlights?.join("\n   ") || result.summary || result.text || "";
    lines.push(`\n${index + 1}. **${title}**${date}\n   ${url}${excerpts ? `\n   ${excerpts}` : ""}`);
  }
  lines.push("\nProvider metadata is also available through codemode as structured data.");
  return lines.join("\n");
}

export default function registerExaExtension(pi: ExtensionAPI): void {
  pi.registerTool({
    name: "exa_search",
    label: "Exa Search",
    exposure: "direct",
    annotations: { readOnlyHint: true, openWorldHint: true },
    outputSchema: SearchResponse,
    description: "Search the public web with Exa for semantic, technical/code, and multilingual material. Returns highlights, text, summaries, or URLs.",
    promptSnippet: "Semantic, technical/code, and multilingual web search.",
    promptGuidelines: [
      `If exa_search behavior seems stale or contradictory, fetch the canonical Exa coding-agent docs: ${EXA_DOCS_URL}`,
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
        const result = await callExa("/search", body, signal);
        return {
          content: [{ type: "text" as const, text: formatSearchResponse(params.query, result, params.contentMode ?? "highlights") }],
          details: { ...result, query: params.query, request: body },
          structuredContent: result,
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: signal?.aborted ? "Exa search cancelled." : error instanceof Error ? error.message : String(error) }],
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
