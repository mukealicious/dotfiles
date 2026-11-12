import { getAgentDir, SettingsManager, type ExtensionAPI, type ExtensionContext } from "@earendil-works/pi-coding-agent";

// Pi decides provider availability from a startup auth snapshot. The claude-code
// provider checks `claude auth status`; one failed or slow check makes resume and
// startup silently fall back to another provider. Recheck once and restore the
// intended model, or say clearly why not. An explicit --model/--models wins.
type Target = { provider: string; id: string; source: string };

function intendedModel(ctx: ExtensionContext): Target | undefined {
  const branch = ctx.sessionManager.getBranch();
  const hasConversation = branch.some(entry => entry.type === "message"
    && (entry.message.role === "user" || entry.message.role === "assistant"));
  if (hasConversation) {
    for (let i = branch.length - 1; i >= 0; i--) {
      const entry = branch[i]!;
      if (entry.type === "model_change") return { provider: entry.provider, id: entry.modelId, source: "session model" };
    }
    return undefined;
  }
  const settings = SettingsManager.create(ctx.cwd, getAgentDir());
  const provider = settings.getDefaultProvider();
  const id = settings.getDefaultModel();
  return provider && id ? { provider, id, source: "default model" } : undefined;
}

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (event, ctx) => {
    if (event.reason === "reload") return;
    if (process.argv.some(arg => arg === "--model" || arg === "--models" || arg.startsWith("--model="))) return;
    const target = intendedModel(ctx);
    if (!target || (ctx.model?.provider === target.provider && ctx.model.id === target.id)) return;
    const label = `${target.provider}/${target.id}`;
    const current = ctx.model ? `${ctx.model.provider}/${ctx.model.id}` : "no model";
    try {
      if (!ctx.modelRegistry.hasConfiguredAuth({ provider: target.provider } as never)) {
        await ctx.modelRegistry.refresh({ providers: [target.provider] });
      }
      const model = ctx.modelRegistry.find(target.provider, target.id);
      if (model && await pi.setModel(model)) {
        ctx.ui.notify(`Restored ${target.source} ${label} after a failed availability check.`, "info");
        return;
      }
      const hint = target.provider === "claude-code" ? " Run /claude-code-status." : "";
      ctx.ui.notify(`${target.source} ${label} is ${model ? "not authenticated" : "unavailable"}; using ${current}.${hint}`, "warning");
    } catch (error) {
      ctx.ui.notify(`Could not restore ${label}: ${error instanceof Error ? error.message : String(error)}; using ${current}.`, "warning");
    }
  });
}
