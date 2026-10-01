import assert from "node:assert/strict";
import { test } from "node:test";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import registerNotify from "../notify.ts";

function invoke(mode: string | undefined, herdr: string | undefined, text = "Finished") {
  const handlers = new Map<string, (event: unknown, ctx: ExtensionContext) => void>();
  registerNotify({ on: (name: string, handler: (event: unknown, ctx: ExtensionContext) => void) => handlers.set(name, handler) } as unknown as ExtensionAPI);
  assert.deepEqual([...handlers.keys()], ["agent_settled"]);
  const originalHerdr = process.env.HERDR_ENV;
  const originalWrite = process.stdout.write;
  let output = "";
  try {
    if (herdr === undefined) delete process.env.HERDR_ENV;
    else process.env.HERDR_ENV = herdr;
    process.stdout.write = ((chunk: string) => { output += chunk; return true; }) as typeof process.stdout.write;
    handlers.get("agent_settled")!({ type: "agent_settled" }, {
      mode,
      sessionManager: { getBranch: () => [
        { type: "message", message: { role: "assistant", content: [{ type: "text", text: "Earlier attempt" }] } },
        { type: "custom", data: "ignored" },
        { type: "message", message: { role: "assistant", content: [{ type: "text", text }] } },
      ] },
    } as unknown as ExtensionContext);
  } finally {
    process.stdout.write = originalWrite;
    if (originalHerdr === undefined) delete process.env.HERDR_ENV;
    else process.env.HERDR_ENV = originalHerdr;
  }
  return output;
}

for (const mode of ["json", "rpc", "print", "text", undefined]) {
  test(`notifications do not write OSC in ${mode ?? "unknown"} mode`, () => {
    assert.equal(invoke(mode, undefined), "");
  });
}
test("Herdr owns TUI notifications", () => {
  assert.equal(invoke("tui", "1"), "");
});
test("settled TUI fallback uses the last assistant on the current branch", () => {
  assert.equal(invoke("tui", undefined, "Recovered\n  and finished"), "\x1b]777;notify;π;Recovered and finished\x07");
});
test("notification text cannot inject terminal control sequences", () => {
  const output = invoke("tui", undefined, "ok\x07\x1b]777;notify;injected");
  assert.equal(output.match(/\x07/g)?.length, 1);
  assert.equal(output.match(/\x1b/g)?.length, 1);
});
test("empty final text has a readiness fallback", () => {
  assert.equal(invoke("tui", undefined, ""), "\x1b]777;notify;Ready for input;\x07");
});
