// Test the unchanged upstream tools through the actual Pi loader; no live HTTP/auth.
import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DefaultResourceLoader, SettingsManager } from '@earendil-works/pi-coding-agent';
import { Check } from 'typebox/value';

const home = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-upstream-parallel-'));
const previousHome = process.env.HOME;
const originalFetch = globalThis.fetch;
process.env.HOME = home; // Upstream resolves auth at module initialization.
globalThis.fetch = () => { throw new Error('Live HTTP forbidden'); };
after(() => {
  globalThis.fetch = originalFetch;
  if (previousHome === undefined) delete process.env.HOME;
  else process.env.HOME = previousHome;
  fs.rmSync(home, { recursive: true, force: true });
});
const auth = path.join(home, '.config/parallel-web-tools/auth.json');
const loader = new DefaultResourceLoader({
  cwd: home, agentDir: home, settingsManager: SettingsManager.inMemory(),
  noExtensions: true, noSkills: true, noContextFiles: true,
  additionalExtensionPaths: [fileURLToPath(new URL('./packages/pi-parallel/extension/index.ts', import.meta.url))],
});
await loader.reload();
assert.deepEqual(loader.getExtensions().errors, []);
const tools = new Map(loader.getExtensions().extensions.flatMap(extension =>
  [...extension.tools].map(([name, registered]) => [name, registered.definition])));
const call = (name, params, signal) => tools.get(name).execute('fixture', params, signal, undefined, { model: { id: 'fixture' } });
function configure(t) {
  fs.mkdirSync(path.dirname(auth), { recursive: true });
  fs.writeFileSync(auth, JSON.stringify({ version: 1, selected_org_id: 'fixture', orgs: { fixture: { api_key: 'fixture-only' } } }));
  t.after(() => fs.rmSync(auth, { force: true }));
}
const page = { url: 'https://example.com', title: 'Fixture', excerpts: ['Source evidence'] };
const search = { search_id: 'search_fixture', session_id: 'session_fixture', results: [page] };

test('upstream registers only search/fetch and their supported schemas', () => {
  assert.deepEqual([...tools.keys()].sort(), ['web_fetch', 'web_search']);
  assert.equal(Check(tools.get('web_search').parameters, { query: 'fixture' }), true);
  assert.equal(Check(tools.get('web_fetch').parameters, { url: 'https://example.com' }), true);
  for (const retired of ['mode', 'includeDomains', 'excludeDomains', 'location', 'maxAgeSeconds']) {
    assert.equal(Object.hasOwn(tools.get('web_search').parameters.properties, retired), false);
  }
});
test('missing auth fails before HTTP and does not create credentials', async () => {
  await assert.rejects(call('web_search', { query: 'fixture' }), /not configured.*parallel-setup/);
  assert.equal(fs.existsSync(auth), false);
});
test('search uses selected-organization key, Turbo and supported arguments', async t => {
  configure(t);
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, ...options, body: JSON.parse(options.body) });
    return new Response(JSON.stringify(search));
  });
  const result = await call('web_search', { query: 'fixture', searchQueries: ['query'], maxResults: 3, afterDate: '2026-01-01' });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.parallel.ai/v1/search');
  assert.equal(calls[0].headers['x-api-key'], 'fixture-only');
  assert.deepEqual(calls[0].body, { objective: 'fixture', search_queries: ['query'], mode: 'turbo', max_chars_total: 40000,
    client_model: 'fixture', advanced_settings: { max_results: 3, source_policy: { after_date: '2026-01-01' } } });
  assert.match(result.content[0].text, /Source evidence/);
  assert.equal(result.structuredContent, undefined, 'the old full structured-result contract is intentionally retired');
});
test('extract preserves visible successful pages and partial-failure evidence', async t => {
  configure(t);
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://api.parallel.ai/v1/extract');
    assert.deepEqual(JSON.parse(options.body), { urls: ['https://example.com/'], objective: 'evidence', max_chars_total: 40000, client_model: 'fixture' });
    return new Response(JSON.stringify({ extract_id: 'extract_fixture', session_id: 'session_fixture', results: [page],
      errors: [{ url: 'https://missing.example', error_type: 'not_found', http_status_code: 404 }] }));
  });
  const result = await call('web_fetch', { url: page.url, objective: 'evidence' });
  assert.equal(result.details.status, 'partial');
  assert.match(result.content[0].text, /Source evidence/);
  assert.match(result.content[0].text, /not_found/);
});
for (const status of [401, 403]) test(`HTTP ${status} gives actionable auth failure without retry`, async t => {
  configure(t);
  let requests = 0;
  t.mock.method(globalThis, 'fetch', async () => { requests++; return new Response('{}', { status }); });
  await assert.rejects(call('web_search', { query: 'fixture' }), /key was rejected.*parallel-setup/);
  assert.equal(requests, 1);
});
for (const alreadyAborted of [false, true]) test(`cancellation reaches HTTP (already aborted=${alreadyAborted})`, async t => {
  configure(t);
  const controller = new AbortController();
  if (alreadyAborted) controller.abort();
  t.mock.method(globalThis, 'fetch', async (_url, { signal }) => {
    if (!signal.aborted) { controller.abort(); }
    assert.equal(signal.aborted, true);
    throw new DOMException('Aborted', 'AbortError');
  });
  await assert.rejects(call('web_search', { query: 'fixture' }, controller.signal), /request was cancelled/);
});
test('invalid JSON and response shapes remain errors rather than empty results', async t => {
  configure(t);
  const responses = ['{broken', '{}'];
  t.mock.method(globalThis, 'fetch', async () => new Response(responses.shift()));
  await assert.rejects(call('web_search', { query: 'fixture' }), /invalid JSON/);
  await assert.rejects(call('web_search', { query: 'fixture' }), /unexpected response shape/);
});
