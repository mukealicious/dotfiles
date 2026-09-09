import { Type } from "typebox";
import { runCliWithHeartbeat, type ExtractResult } from "../cli.js";
import { renderExtractCall, renderExtractResult } from "../render.js";

export const extractTool = {
  name: "web_fetch",
  label: "Web Fetch",
  description: "Extract readable Markdown from one or more public HTML pages with Parallel, including JavaScript-rendered content. Returns titles and text excerpts with boilerplate removed.",
  promptSnippet: "Readable content extraction from public HTML page URLs.",
  parameters: Type.Object({
    url: Type.Any({ description: "One or more public web page URLs to extract content from. Pass a single URL string for one page, or an array of URL strings for batch extraction. Must be publicly accessible web pages — not raw file URLs, API endpoints, or localhost addresses." }),
    objective: Type.Optional(Type.String({ description: "An optional extraction focus that guides what content to prioritize. For example, 'pricing information' will emphasize pricing tables and plan details, while 'API documentation' will focus on endpoints and code examples. When omitted, extracts all meaningful content from the page." })),
  }),
  async execute(_toolCallId: string, params: any, signal: AbortSignal | undefined, onUpdate: any, _ctx: any) {
    try {
      const urls = Array.isArray(params.url) ? params.url : [params.url];
      const args = ["extract", ...urls, "--json"];
      if (params.objective) args.push("--objective", params.objective);

      const startTime = Date.now();
      onUpdate?.({
        content: [{ type: "text" as const, text: `📄 Extract started · ${urls.length} URL${urls.length !== 1 ? "s" : ""}` }],
        details: { status: "running", urls, objective: params.objective },
      });

      const result: ExtractResult = await runCliWithHeartbeat(
        args,
        signal,
        onUpdate,
        startTime,
        (elapsed) => ({
          content: [{ type: "text" as const, text: `📄 Extracting ${urls.length} URL${urls.length !== 1 ? "s" : ""}` }],
          details: {
            status: "running",
            urls,
            objective: params.objective,
            elapsed,
          },
        }),
      );
      const content = result.results?.map(r =>
        `## ${r.title}\n\n${r.excerpts?.join("\n\n") ?? ""}`
      ).join("\n\n---\n\n") ?? "";
      return {
        content: [{ type: "text" as const, text: content || "No content extracted" }],
        details: {
          extract_id: result.extract_id,
          status: result.status,
          urls,
          results: result.results?.map((r: any) => ({
            url: r.url,
            title: r.title,
            excerpts: r.excerpts,
          })),
        },
      };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: err.message }], details: {}, isError: true };
    }
  },
  renderCall: renderExtractCall,
  renderResult: renderExtractResult,
};
