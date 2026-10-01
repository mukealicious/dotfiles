// Explicit legacy-policy retirement uses disposable models files, never real home.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { retireAstraPriority } from './retire-astra-priority.mjs';

function fixture(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-native-priority-'));
  try { run(path.join(root, 'models.json')); }
  finally { fs.rmSync(root, { recursive: true, force: true }); }
}
const legacy = { providers: { openai: { modelOverrides: {
  'gpt-6-astra': { samplingParams: { service_tier: 'priority', temperature: 0.5 }, name: 'Custom Astra' },
  other: { samplingParams: { service_tier: 'priority' } },
} }, custom: { models: [{ id: 'local' }] } } };

test('retirement removes only Astra priority, backs up exact bytes and is idempotent', () => fixture(file => {
  const original = JSON.stringify(legacy);
  fs.writeFileSync(file, original, { mode: 0o600 });
  assert.equal(retireAstraPriority(file), true);
  const expected = structuredClone(legacy);
  delete expected.providers.openai.modelOverrides['gpt-6-astra'].samplingParams.service_tier;
  assert.deepEqual(JSON.parse(fs.readFileSync(file, 'utf8')), expected);
  assert.equal(fs.readFileSync(`${file}.before-fast-only`, 'utf8'), original);
  assert.equal(fs.statSync(file).mode & 0o777, 0o600);
  assert.equal(fs.statSync(`${file}.before-fast-only`).mode & 0o777, 0o600);
  const after = fs.readFileSync(file);
  assert.equal(retireAstraPriority(file), false);
  assert.deepEqual(fs.readFileSync(file), after);
}));
for (const config of [{}, { providers: {} }, { providers: { openai: { modelOverrides: {
  'gpt-6-astra': { samplingParams: { service_tier: 'flex' } },
} } } }]) {
  test(`retirement preserves unrelated model policy: ${JSON.stringify(config)}`, () => fixture(file => {
    const original = JSON.stringify(config);
    fs.writeFileSync(file, original);
    assert.equal(retireAstraPriority(file), false);
    assert.equal(fs.readFileSync(file, 'utf8'), original);
    assert.equal(fs.existsSync(`${file}.before-fast-only`), false);
  }));
}
test('missing file is not bootstrapped; malformed files and symlinks are not overwritten', () => fixture(file => {
  assert.equal(retireAstraPriority(file), false);
  fs.writeFileSync(file, '{broken');
  assert.throws(() => retireAstraPriority(file), SyntaxError);
  assert.equal(fs.readFileSync(file, 'utf8'), '{broken');
  fs.renameSync(file, `${file}.target`);
  fs.symlinkSync(`${file}.target`, file);
  assert.throws(() => retireAstraPriority(file), /non-regular/);
  assert.equal(fs.readFileSync(file, 'utf8'), '{broken');
}));
test('existing rollback file refuses another retirement without changing either file', () => fixture(file => {
  const original = JSON.stringify(legacy);
  fs.writeFileSync(file, original);
  fs.writeFileSync(`${file}.before-fast-only`, 'preserve');
  assert.throws(() => retireAstraPriority(file), /EEXIST/);
  assert.equal(fs.readFileSync(file, 'utf8'), original);
  assert.equal(fs.readFileSync(`${file}.before-fast-only`, 'utf8'), 'preserve');
}));
