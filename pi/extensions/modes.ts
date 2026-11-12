import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

// Capability only: /fast remains the independent OpenAI priority-tier control.
// Native Pi owns the editor, persistence, model availability and credentials.
// Ladder follows Anthropic's guidance: raise Opus effort before moving up a model.
// deep stays on OpenAI until Claude Max includes Fable; then use claude-fable-5-2.
const modes = [
  { name: "light", provider: "claude-code", model: "claude-sonnet-5-5", thinking: "medium" },
  { name: "default", provider: "claude-code", model: "claude-opus-5-5", thinking: "medium" },
  { name: "high", provider: "claude-code", model: "claude-opus-5-5", thinking: "high" },
  { name: "deep", provider: "openai", model: "gpt-6-astra", thinking: "high" },
] as const;

const loginHint: Record<string, string> = {
  "claude-code": "run `claude auth login` in a terminal, then /claude-code-status",
  openai: "use /login openai",
};

export default function (pi: ExtensionAPI) {
  let applying = false;

  function currentIndex(ctx: ExtensionContext): number {
    return modes.findIndex(mode => ctx.model?.provider === mode.provider
      && ctx.model.id === mode.model && pi.getThinkingLevel() === mode.thinking);
  }

  async function apply(name: string, ctx: ExtensionContext) {
    const mode = modes.find(mode => mode.name === name);
    if (!mode) {
      ctx.ui.notify(`Use /mode ${modes.map(mode => mode.name).join("| ")}. /mode store is retired.`, "warning");
      return;
    }
    if (applying || !ctx.isIdle()) {
      ctx.ui.notify("Wait for the current operation before changing mode.", "warning");
      return;
    }
    applying = true;
    const target = `${mode.provider}/${mode.model}`;
    try {
      const model = ctx.modelRegistry.find(mode.provider, mode.model);
      if (!model) {
        ctx.ui.notify(`Mode ${name}: ${target} is unavailable.`, "error");
        return;
      }
      if (!await pi.setModel(model)) {
        ctx.ui.notify(`Mode ${name}: authentication unavailable for ${target}; ${loginHint[mode.provider]}.`, "error");
        return;
      }
      pi.setThinkingLevel(mode.thinking);
      const actual = pi.getThinkingLevel();
      ctx.ui.notify(actual === mode.thinking
        ? `Mode ${name}: ${mode.model}, ${actual} thinking.`
        : `Requested ${name}: ${mode.thinking} thinking is unsupported; Pi applied ${actual}.`,
      actual === mode.thinking ? "info" : "warning");
    } catch (error) {
      ctx.ui.notify(`Mode ${name} failed: ${error instanceof Error ? error.message : String(error)}`, "error");
    } finally {
      applying = false;
    }
  }

  async function select(ctx: ExtensionContext) {
    if (!ctx.hasUI) return;
    const current = modes[currentIndex(ctx)]?.name ?? "custom";
    const name = await ctx.ui.select(`Capability mode (current: ${current})`, modes.map(mode => mode.name));
    if (name) await apply(name, ctx);
  }

  pi.registerCommand("mode", {
    description: "Select capability preset: light, default, high, deep",
    handler: async (args, ctx) => {
      if (args.trim()) await apply(args.trim(), ctx);
      else await select(ctx);
    },
  });
  pi.registerShortcut("ctrl+shift+m", { description: "Select capability mode", handler: select });
  pi.registerShortcut("ctrl+space", {
    description: "Cycle capability mode",
    handler: async ctx => { await apply(modes[(currentIndex(ctx) + 1) % modes.length]!.name, ctx); },
  });
}
