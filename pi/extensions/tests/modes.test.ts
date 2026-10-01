import assert from "node:assert/strict";
import { test } from "node:test";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import registerModes from "../modes.ts";

type Model = { provider: string; id: string };
type Command = { handler: (args: string, ctx: ExtensionContext) => Promise<void> };
type Shortcut = { handler: (ctx: ExtensionContext) => Promise<void> };
function harness() {
  const commands = new Map<string, Command>();
  const shortcuts = new Map<string, Shortcut>();
  const notices: { message: string; type: string }[] = [];
  const changes: string[] = [];
  const state = {
    model: { provider: "openai", id: "gpt-6.1-sol" } as Model,
    thinking: "high", idle: true, hasUI: true, available: true, authenticated: true,
    selection: undefined as string | undefined, options: [] as string[], title: "",
    clamp: undefined as string | undefined, failure: undefined as Error | undefined,
    pending: undefined as Promise<void> | undefined,
  };
  const ctx = {
    get model() { return state.model; },
    get hasUI() { return state.hasUI; },
    isIdle: () => state.idle,
    modelRegistry: { find: (provider: string, id: string) => state.available ? { provider, id } : undefined },
    ui: {
      notify: (message: string, type: string) => notices.push({ message, type }),
      select: async (title: string, options: string[]) => {
        state.title = title;
        state.options = options;
        return state.selection;
      },
    },
  } as unknown as ExtensionContext;
  // No lifecycle, editor, file, tool or prompt APIs: this must stay a thin command.
  registerModes({
    registerCommand: (name: string, command: Command) => commands.set(name, command),
    registerShortcut: (key: string, shortcut: Shortcut) => shortcuts.set(key, shortcut),
    getThinkingLevel: () => state.thinking,
    setThinkingLevel: (level: string) => { state.thinking = state.clamp ?? level; changes.push(`thinking:${level}`); },
    setModel: async (model: Model) => {
      if (state.pending) await state.pending;
      if (state.failure) throw state.failure;
      if (!state.authenticated) return false;
      state.model = model;
      changes.push(`model:${model.id}`);
      return true;
    },
  } as unknown as ExtensionAPI);
  return { state, changes, notices, commands, shortcuts,
    command: (args = "") => commands.get("mode")!.handler(args, ctx),
    shortcut: (key = "ctrl+space") => shortcuts.get(key)!.handler(ctx),
  };
}

const expected = [
  ["light", "gpt-6-luna", "max"],
  ["standard", "gpt-6.1-sol", "medium"],
  ["default", "gpt-6.1-sol", "high"],
  ["deep", "gpt-6-astra", "high"],
];
for (const [name, model, thinking] of expected) {
  test(`/mode ${name} applies exact native model and thinking without changing startup`, async () => {
    const h = harness();
    assert.deepEqual(h.changes, []);
    await h.command(name);
    assert.deepEqual(h.changes, [`model:${model}`, `thinking:${thinking}`]);
    assert.deepEqual(h.state.model, { provider: "openai", id: model });
    assert.equal(h.notices.at(-1)?.type, "info");
  });
}
test('cycling keeps both Sol depths and wraps in the original four-preset order', async () => {
  const h = harness();
  assert.deepEqual([...h.commands.keys()], ["mode"]);
  assert.deepEqual([...h.shortcuts.keys()], ["ctrl+shift+m", "ctrl+space"]);
  for (const [name, model, thinking] of [expected[3], ...expected]) {
    await h.shortcut();
    assert.equal(h.state.model.id, model);
    assert.equal(h.state.thinking, thinking);
    assert.match(h.notices.at(-1)!.message, new RegExp(`Mode ${name}:`));
  }
});
test('cycling derives current state from native model/thinking, including manual changes', async () => {
  const h = harness();
  h.state.model = { provider: "openai", id: "gpt-6-astra" };
  h.state.thinking = "high";
  await h.shortcut();
  assert.equal(h.state.model.id, "gpt-6-luna");
  h.state.model = { provider: "other", id: "gpt-6-astra" };
  await h.shortcut();
  assert.equal(h.state.model.id, "gpt-6-luna");
});
test('native selector reports current mode, supports cancellation, and applies a selection', async () => {
  const h = harness();
  await h.command();
  assert.deepEqual(h.state.options, expected.map(([name]) => name));
  assert.match(h.state.title, /current: default/);
  assert.deepEqual(h.changes, []);
  h.state.selection = "deep";
  await h.shortcut("ctrl+shift+m");
  assert.equal(h.state.model.id, "gpt-6-astra");
  assert.equal(h.state.thinking, "high");
});
for (const scenario of ["unknown", "store", "unavailable", "unauthenticated", "busy", "exception"]) {
  test(`mode failure is explicit and leaves selection unchanged: ${scenario}`, async () => {
    const h = harness();
    if (scenario === "unavailable") h.state.available = false;
    if (scenario === "unauthenticated") h.state.authenticated = false;
    if (scenario === "busy") h.state.idle = false;
    if (scenario === "exception") h.state.failure = new Error("selection failed");
    await h.command(scenario === "unknown" ? "unknown" : scenario === "store" ? "store light" : "light");
    assert.deepEqual(h.changes, []);
    assert.notEqual(h.notices.at(-1)?.type, "info");
    h.state.available = h.state.authenticated = h.state.idle = true;
    h.state.failure = undefined;
    await h.command("deep");
    assert.equal(h.state.thinking, "high", 'failure releases selection guard');
  });
}
test('overlapping requests cannot interleave model and thinking changes', async () => {
  const h = harness();
  let release!: () => void;
  h.state.pending = new Promise<void>(resolve => { release = resolve; });
  const first = h.command("light");
  await h.command("deep");
  release();
  await first;
  assert.deepEqual(h.changes, ["model:gpt-6-luna", "thinking:max"]);
  assert.ok(h.notices.some(n => n.type === "warning"));
});
test('native thinking clamping is reported instead of claiming exact preset success', async () => {
  const h = harness();
  h.state.clamp = "high";
  await h.command("light");
  assert.equal(h.notices.at(-1)?.type, "warning");
  assert.match(h.notices.at(-1)!.message, /Pi applied high/);
});
test('non-UI selector is inert while explicit commands still use native APIs', async () => {
  const h = harness();
  h.state.hasUI = false;
  await h.command();
  assert.deepEqual(h.state.options, []);
  assert.deepEqual(h.changes, []);
  await h.command("deep");
  assert.equal(h.state.thinking, "high");
});
