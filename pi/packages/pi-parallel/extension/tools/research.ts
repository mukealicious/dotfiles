import { Type } from "typebox";
import { StringEnum } from "@earendil-works/pi-ai";
import { runCli, pollResearch, type ResearchRunResult } from "../cli.js";
import { renderResearchCall, renderResearchResult, formatResearchContent } from "../render.js";

const SPEED_TO_PROCESSOR: Record<string, string> = {
  fast: "base-fast",
  balanced: "pro-fast",
  best: "ultra",
};

export const researchTool = {
  name: "deep_research",
  label: "Deep Research",
  description: "Run Parallel research across multiple web sources and return a synthesized Markdown report with citations. Polls automatically and streams progress until completion.",
  promptSnippet: "Multi-source research synthesized into a cited report.",
  promptGuidelines: [
    "Prefer one focused deep_research run at speed='fast'; use 'best' only for explicitly requested comprehensive depth. Do not fan out paid research runs without authorization for that cost/depth.",
  ],
  parameters: Type.Object({
    topic: Type.String({ description: "The research question or topic to investigate. Be specific — 'what are the performance tradeoffs of SQLite vs PostgreSQL for read-heavy web apps' yields better results than just 'SQLite vs PostgreSQL'. The more focused the question, the more relevant the synthesis." }),
    speed: Type.Optional(StringEnum(["fast", "balanced", "best"] as const, {
      description: "Controls research depth and cost. 'fast' (default): quick synthesis, usually 15-30s, sufficient for most questions. 'best': thorough multi-source report, can take 1-3 minutes, use only when comprehensive depth is needed. 'balanced': middle ground, rarely the right choice — prefer fast or best.",
    })),
    context: Type.Optional(Type.String({ description: "Additional context prepended to the topic to constrain or focus the research. For example, 'We are building a TypeScript CLI tool' helps the researcher tailor findings to your specific situation." })),
  }),
  async execute(_toolCallId: string, params: any, signal: AbortSignal | undefined, onUpdate: any, _ctx: any) {
    try {
      const processor = SPEED_TO_PROCESSOR[params.speed ?? "fast"] ?? "pro-fast";
      const topic = params.context ? `${params.context}\n\n${params.topic}` : params.topic;

      const runResult: ResearchRunResult = await runCli([
        "research", "run", topic, "--processor", processor, "--no-wait", "--json",
      ]);

      const { run_id } = runResult;
      const startTime = Date.now();
      onUpdate({
        content: [{ type: "text" as const, text: `🔍 Research started · ${run_id} · ${processor}` }],
        details: { status: "running", run_id, processor, poll_interval_seconds: 45 },
      });

      const result = await pollResearch(run_id, signal, onUpdate, startTime);
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const text = formatResearchContent(result.output);

      return {
        content: [{ type: "text" as const, text }],
        details: {
          run_id: result.run_id,
          status: result.status,
          output: result.output,
          processor,
          query: params.topic,
          elapsed,
        },
      };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: err.message }], details: {}, isError: true };
    }
  },
  renderCall: renderResearchCall,
  renderResult: renderResearchResult,
};
