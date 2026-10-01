import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

// Capability only: /fast remains the independent priority-tier control.
// Native Pi owns the editor, persistence, model availability and credentials.
const modes = [
  { name: "light", model: "gpt-6-luna", thinking: "max" },
  { name: "standard", model: "gpt-6-sol", thinking: "medium" },
  { name: "default", model: "gpt-6-astra", thinking: "medium" },
  { name: "deep", model: "gpt-6-astra", thinking: "high" },
] as const;

export default function (pi: ExtensionAPI) {
  let applying = false;

  function currentIndex(ctx: ExtensionContext): number {
    return modes.findIndex(mode => ctx.model?.provider === "openai"
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
    try {
      const model = ctx.modelRegistry.find("openai", mode.model);
      if (!model) {
        ctx.ui.notify(`Mode ${name}: openai/${mode.model} is unavailable.`, "error");
        return;
      }
      if (!await pi.setModel(model)) {
        ctx.ui.notify(`Mode ${name}: authentication unavailable for openai/${mode.model}; use /login openai.`, "error");
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
    description: "Select capability preset: light, standard, default, deep",
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
