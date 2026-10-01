import assert from "node:assert/strict";
import { test } from "node:test";
import { Check } from "typebox/value";
import registerExa from "../extensions/index.ts";

let tool;
registerExa({ registerTool: (definition) => { tool = definition; }, registerCommand() {} });

function fixture(t, payload = { results: [] }) {
  const original = process.env.EXA_API_KEY;
  process.env.EXA_API_KEY = "fixture-only";
  t.after(() => {
    if (original === undefined) delete process.env.EXA_API_KEY;
    else process.env.EXA_API_KEY = original;
  });
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, ...options, body: JSON.parse(options.body) });
    return new Response(JSON.stringify(payload));
  });
  return calls;
}

const execute = (params, signal) => tool.execute("fixture", params, signal);

test("keeps the tool identity, direct exposure and default request", async (t) => {
  const calls = fixture(t);
  const result = await execute({ query: "fixture" });
  assert.equal(tool.name, "exa_search");
  assert.equal(tool.exposure, "direct");
  assert.deepEqual(tool.annotations, { readOnlyHint: true, openWorldHint: true });
  assert.equal(calls[0].url, "https://api.exa.ai/search");
  assert.equal(calls[0].headers["x-api-key"], "fixture-only");
  assert.deepEqual(calls[0].body, { query: "fixture", type: "auto", numResults: 10, contents: { highlights: true } });
  assert.deepEqual(result.structuredContent, { results: [] });
  assert.ok(Check(tool.outputSchema, result.structuredContent));
});

for (const type of ["auto", "fast", "instant", "deep-lite", "deep", "deep-reasoning"]) {
  test(`preserves Exa ${type} mode and all search controls`, async (t) => {
    const calls = fixture(t);
    const params = { query: "fixture", type, numResults: 25, contentMode: "text", textMaxCharacters: 42000,
      includeDomains: ["example.com"], excludeDomains: ["excluded.example"], maxAgeHours: -1 };
    assert.ok(Check(tool.parameters, params));
    await execute(params);
    assert.deepEqual(calls[0].body, { query: "fixture", type, numResults: 25,
      contents: { text: { maxCharacters: 42000 }, maxAgeHours: -1 },
      includeDomains: params.includeDomains, excludeDomains: params.excludeDomains });
  });
}

for (const [contentMode, contents] of [
  ["highlights", { highlights: true, maxAgeHours: 0 }],
  ["text", { text: { maxCharacters: 12000 }, maxAgeHours: 0 }],
  ["summary", { summary: { query: "fixture" }, maxAgeHours: 0 }],
  ["none", undefined],
]) {
  test(`preserves ${contentMode} content and freshness behavior`, async (t) => {
    const calls = fixture(t);
    await execute({ query: "fixture", contentMode, maxAgeHours: 0 });
    assert.deepEqual(calls[0].body.contents, contents);
  });
}

test("keeps request bounds and complete text/highlights/unknown metadata in structured results", async (t) => {
  const payload = { requestId: "fixture", resolvedSearchType: "deep", costDollars: { total: 0.01 },
    results: [{ url: "https://example.com", text: "full-text ".repeat(2000), highlights: ["one", "two", "three", "four"],
      summary: "summary", score: 0.99, nested: { preserved: true } }] };
  const calls = fixture(t, payload);
  const result = await execute({ query: "fixture", numResults: 99, contentMode: "text", textMaxCharacters: 99999 });
  assert.equal(calls[0].body.numResults, 25);
  assert.equal(calls[0].body.contents.text.maxCharacters, 50000);
  assert.deepEqual(result.structuredContent, payload);
  assert.ok(Check(tool.outputSchema, result.structuredContent));
  assert.ok(result.content[0].text.includes(payload.results[0].text), 'direct researchers receive requested full text without codemode');
  assert.doesNotMatch(JSON.stringify(result), /fixture-only/);
});

for (const body of ["not json", "", "null", "{}", '{"results":{}}', '{"results":[{"url":1}]}']) {
  test(`malformed success is a failed tool result: ${body || "empty"}`, async (t) => {
    fixture(t);
    t.mock.method(globalThis, "fetch", async () => new Response(body));
    const result = await execute({ query: "fixture" });
    assert.equal(result.isError, true);
    assert.equal(result.structuredContent, undefined);
    assert.match(result.content[0].text, /invalid/i);
  });
}

for (const [body, status, message] of [['{"message":"quota exceeded"}', 429, /429: quota exceeded/], ["upstream unavailable", 503, /503: upstream unavailable/]]) {
  test(`HTTP ${status} remains a tool error, never an empty search`, async (t) => {
    fixture(t);
    t.mock.method(globalThis, "fetch", async () => new Response(body, { status }));
    const result = await execute({ query: "fixture" });
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, message);
  });
}

test("missing credentials fail before any request", async (t) => {
  const calls = fixture(t);
  delete process.env.EXA_API_KEY;
  const result = await execute({ query: "fixture" });
  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /EXA_API_KEY is not set/);
  assert.equal(calls.length, 0);
});

test("pre-cancellation makes no paid request", async (t) => {
  const calls = fixture(t);
  const result = await execute({ query: "fixture" }, AbortSignal.abort());
  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /cancelled/);
  assert.equal(calls.length, 0);
});

test("body-reading cancellation cannot become success", async (t) => {
  fixture(t);
  const controller = new AbortController();
  t.mock.method(globalThis, "fetch", async (_url, { signal }) => {
    assert.equal(signal, controller.signal);
    return { ok: true, text: async () => { controller.abort(); return '{"results":[]}'; } };
  });
  const result = await execute({ query: "fixture" }, controller.signal);
  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /cancelled/);
});

test("network failures remain errors", async (t) => {
  fixture(t);
  t.mock.method(globalThis, "fetch", async () => { throw new Error("fixture network failure"); });
  const result = await execute({ query: "fixture" });
  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /fixture network failure/);
});

test("cancellation reaches an in-flight HTTP request", async (t) => {
  fixture(t);
  const controller = new AbortController();
  t.mock.method(globalThis, "fetch", (_url, { signal }) => new Promise((_resolve, reject) => {
    assert.equal(signal, controller.signal);
    signal.addEventListener("abort", () => reject(signal.reason), { once: true });
  }));
  const pending = execute({ query: "fixture" }, controller.signal);
  controller.abort();
  const result = await pending;
  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /cancelled/);
});

test("nullable optional content does not turn valid URL-only results into errors", async (t) => {
  const payload = { results: [{ url: "https://example.com", title: null, author: null, highlights: null, text: null, summary: null }] };
  fixture(t, payload);
  const result = await execute({ query: "fixture", contentMode: "none" });
  assert.ok(!result.isError);
  assert.deepEqual(result.structuredContent, payload);
});
