import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

// The behavioral copy assertions run in the browser fixture, not this HTTP test.
test('copy fixture server exposes only the local allowlist', { timeout: 10000 }, async (context) => {
  const child = spawn(process.execPath, [fileURLToPath(new URL('./serve-copy-fixture.mjs', import.meta.url))], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const exited = once(child, 'exit');
  context.signal.addEventListener('abort', () => child.kill('SIGTERM'), { once: true });
  try {
    const url = await new Promise((resolve, reject) => {
      let output = '';
      child.stdout.on('data', data => {
        output += data;
        const match = output.match(/http:\/\/127\.0\.0\.1:\d+/u);
        if (match) resolve(match[0]);
      });
      child.on('error', reject);
      child.on('exit', code => reject(new Error(`Copy fixture exited before readiness: ${code}`)));
    });
    const page = await fetch(url);
    assert.equal(page.status, 200);
    assert.match(page.headers.get('content-type'), /text\/html/u);
    assert.match(await page.text(), /window\.copyFixtureResult/u);
    const module = await fetch(`${url}/copy-duplicate-descriptions.mjs`);
    assert.equal(module.status, 200);
    assert.match(module.headers.get('content-type'), /text\/javascript/u);
    assert.match(await module.text(), /export function findDuplicateDescriptions/u);
    for (const path of ['/AGENTS.md', '/../AGENTS.md', '/%2e%2e/AGENTS.md', '/copy-duplicate-descriptions.mjs?source=1']) {
      assert.equal((await fetch(url + path)).status, 404, path);
    }
    assert.equal((await fetch(url, { method: 'POST', body: 'synthetic-only' })).status, 404);
  } finally {
    child.kill('SIGTERM');
    await exited;
  }
});
