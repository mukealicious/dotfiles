import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const scriptPath = fileURLToPath(new URL('./find-extension-id.mjs', import.meta.url));

test('finds a packaged extension inside a Chromium profile', (t) => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'surf-extension-id-'));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));

  const browserRoot =
    process.platform === 'linux'
      ? path.join(home, '.config', 'BraveSoftware', 'Brave-Browser')
      : path.join(home, 'Library', 'Application Support', 'BraveSoftware', 'Brave-Browser');
  const extensionId = 'abcdefghijklmnopabcdefghijklmnop';
  const extensionDir = path.join(browserRoot, 'Default', 'Extensions', extensionId, '2.8.0');

  fs.mkdirSync(extensionDir, { recursive: true });
  fs.writeFileSync(
    path.join(extensionDir, 'manifest.json'),
    JSON.stringify({ name: 'Surf', description: 'Browser automation CLI for AI agents' }),
  );

  const result = execFileSync(process.execPath, [scriptPath, 'brave'], {
    encoding: 'utf8',
    env: { ...process.env, HOME: home },
  });

  assert.equal(result.trim(), extensionId);
});

test('prefers the extension loaded from the requested path', (t) => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'surf-extension-id-'));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));

  const browserRoot = path.join(home, 'dedicated-brave-user-data');
  const requestedPath = path.join(home, 'managed-surf-extension');
  const oldId = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const agentId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

  fs.mkdirSync(requestedPath, { recursive: true });
  for (const [profile, id, extensionPath] of [
    ['Default', oldId, path.join(home, 'old-surf-extension')],
    ['Profile 1', agentId, requestedPath],
  ]) {
    const profileDir = path.join(browserRoot, profile);
    fs.mkdirSync(profileDir, { recursive: true });
    fs.writeFileSync(
      path.join(profileDir, 'Secure Preferences'),
      JSON.stringify({
        extensions: {
          settings: {
            [id]: {
              path: extensionPath,
              manifest: { name: 'Surf', description: 'Browser automation CLI for AI agents' },
            },
          },
        },
      }),
    );
  }

  const result = execFileSync(process.execPath, [scriptPath, 'brave', requestedPath, browserRoot], {
    encoding: 'utf8',
    env: { ...process.env, HOME: home },
  });

  assert.equal(result.trim(), agentId);
});
