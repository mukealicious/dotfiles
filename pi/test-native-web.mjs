// Retained Exa/codemode boundary coverage, independent of the retired Parallel CLI fixture.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { InMemoryCredentialStore } from '@earendil-works/pi-ai';
import { createAgentSession, createCodemodeExtension, DefaultResourceLoader, ModelRuntime, SessionManager, SettingsManager } from '@earendil-works/pi-coding-agent';

async function nativeSession(t, tools) {
  const dir = mkdtempSync(join(tmpdir(), 'pi-web-native-'));
  let session;
  t.after(() => { session?.dispose(); rmSync(dir, { recursive: true, force: true }); });
  const settingsManager = SettingsManager.inMemory();
  const resourceLoader = new DefaultResourceLoader({
    cwd: dir, agentDir: dir, settingsManager, noExtensions: true, noSkills: true,
    additionalExtensionPaths: [fileURLToPath(new URL('./packages/pi-exa/extensions/index.ts', import.meta.url))],
    extensionFactories: [createCodemodeExtension()],
  });
  await resourceLoader.reload();
  assert.deepEqual(resourceLoader.getExtensions().errors, []);
  const modelRuntime = await ModelRuntime.create({ credentials: new InMemoryCredentialStore(), modelsPath: null, allowModelNetwork: false });
  const model = modelRuntime.getModels()[0];
  const sessionManager = SessionManager.inMemory();
  sessionManager.appendMessage({
    role: 'assistant', api: model.api, provider: model.provider, model: model.id,
    content: [{ type: 'toolCall', id: 'fixture-code', name: 'codemode', arguments: { code: 'fixture' } }],
    usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
    stopReason: 'toolUse', timestamp: Date.now(),
  });
  ({ session } = await createAgentSession({ cwd: dir, agentDir: dir, modelRuntime, model, resourceLoader, settingsManager, sessionManager, tools }));
  await session.bindExtensions({});
  return session;
}

test('native codemode retains full Exa text, highlights and extra metadata', async t => {
  const previous = process.env.EXA_API_KEY;
  process.env.EXA_API_KEY = 'fixture-only';
  t.after(() => { if (previous === undefined) delete process.env.EXA_API_KEY; else process.env.EXA_API_KEY = previous; });
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ results: [{ url: 'https://example.com',
    text: 'a'.repeat(24000), highlights: ['a', 'b', 'c', 'd'], extra: { preserved: true } }] })));
  const session = await nativeSession(t, ['codemode', 'exa_search']);
  const result = await session.agent.state.tools.find(t => t.name === 'codemode').execute('fixture-code', { code: `
    const exa = await tools.exa_search({query: 'fixture', contentMode: 'text'});
    return {length: exa.results[0].text.length, highlights: exa.results[0].highlights.length, extra: exa.results[0].extra};
  ` });
  assert.ok(!result.isError, JSON.stringify(result));
  assert.deepEqual(JSON.parse(result.content.at(-1).text), { length: 24000, highlights: 4, extra: { preserved: true } });
});
test('native web allowlists do not grant codemode or filesystem mutations', async t => {
  const session = await nativeSession(t, ['exa_search']);
  assert.deepEqual(session.getActiveToolNames(), ['exa_search']);
  assert.deepEqual(session.getCallableToolNames(), ['exa_search']);
});
