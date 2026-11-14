import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));

function fixture(t) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'surf-edge-'));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  return home;
}

test('detects Surf in the default Edge profile', (t) => {
  const home = fixture(t);
  const browserRoot = process.platform === 'linux'
    ? path.join(home, '.config', 'microsoft-edge')
    : path.join(home, 'Library', 'Application Support', 'Microsoft Edge');
  const id = 'abcdefghijklmnopabcdefghijklmnop';
  const dir = path.join(browserRoot, 'Default', 'Extensions', id, '1.0');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({ name: 'Surf' }));
  const result = execFileSync(process.execPath,
    [path.join(root, 'scripts/find-extension-id.mjs'), 'edge'], {
      encoding: 'utf8',
      env: { ...process.env, HOME: home, SURF_EDGE_EXTENSION_ID: '', SURF_EXTENSION_ID_EDGE: '' },
    });
  assert.equal(result.trim(), id);
});

test('plain surf and surf-edge both select the Edge socket', (t) => {
  const home = fixture(t);
  const bin = path.join(home, 'bin');
  const prefix = path.join(home, 'runtime');
  fs.mkdirSync(bin, { recursive: true });
  fs.mkdirSync(path.join(prefix, 'bin'), { recursive: true });
  fs.writeFileSync(path.join(bin, 'mise'), `#!/bin/sh
case "$1" in
  current) echo test ;;
  exec)
    shift 5
    if [ "$1" = npm ]; then printf '%s\\n' "$TEST_PREFIX"; else exec "$@"; fi
    ;;
esac
`, { mode: 0o755 });
  fs.writeFileSync(path.join(prefix, 'bin/surf'), '#!/bin/sh\nprintf "%s\\n" "$SURF_SOCKET"\n', { mode: 0o755 });
  for (const wrapper of ['surf', 'surf-edge']) {
    const result = execFileSync(path.join(root, '../bin', wrapper), ['--version'], {
      encoding: 'utf8',
      env: { ...process.env, HOME: home, PATH: `${bin}:/usr/bin:/bin`, TEST_PREFIX: prefix },
    });
    assert.equal(result.trim(), '/tmp/surf-edge.sock');
  }
});
