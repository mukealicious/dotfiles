// Verify the retained skills and disabled extension surface against native Pi.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { DefaultResourceLoader, SettingsManager } from '@earendil-works/pi-coding-agent';

const packageDir = process.env.PI_MITSUPI_PACKAGE_DIR ?? path.join(os.homedir(), '.pi/agent/git/github.com/mitsuhiko/agent-stuff');
const settings = JSON.parse(fs.readFileSync(new URL('./settings.json', import.meta.url), 'utf8'));
const selection = settings.packages.find(p => p.source?.includes('mitsuhiko/agent-stuff'));

test('Mitsupi retains eight selected skills and no extensions at the pinned revision', () => {
  assert.equal(JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8')).name, 'mitsupi');
  assert.equal(execFileSync('git', ['-C', packageDir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), '0865c849befd2021490679f96a8dee58c84ac857');
  assert.deepEqual(selection.extensions, []);
  assert.deepEqual(selection.prompts, []);
  assert.deepEqual(selection.themes, []);
  assert.equal(selection.skills.length, 8);
  for (const file of selection.skills) assert.ok(fs.existsSync(path.join(packageDir, file)), file);
});

test('native discovery loads selected Mitsupi skills without files or todos extensions', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-mitsupi-skills-'));
  try {
    const agentDir = path.join(root, 'agent');
    fs.mkdirSync(agentDir);
    const todosDir = path.join(root, '.pi/todos');
    fs.mkdirSync(todosDir, { recursive: true });
    const history = path.join(todosDir, 'kept.md');
    fs.writeFileSync(history, 'Historical closed task\n');
    const manager = SettingsManager.inMemory({ packages: [{ ...selection, source: packageDir }] });
    manager.setProjectTrusted(true);
    const loader = new DefaultResourceLoader({ cwd: root, agentDir, settingsManager: manager });
    await loader.reload();
    assert.deepEqual(loader.getExtensions().errors, []);
    const extensions = loader.getExtensions().extensions;
    assert.ok(!extensions.some(e => e.path.startsWith(packageDir)), 'no Mitsupi extension should load');
    const commands = extensions.flatMap(e => [...e.commands.keys()]);
    const tools = extensions.flatMap(e => [...e.tools.keys()]);
    assert.ok(!commands.includes('files'));
    assert.ok(!commands.includes('todos'));
    assert.ok(!tools.includes('todo'));
    const expected = selection.skills.map(file => path.basename(path.dirname(file))).sort();
    assert.deepEqual(loader.getSkills().skills.map(s => s.name).sort(), expected);
    assert.deepEqual(loader.getSkills().diagnostics, []);
    assert.equal(fs.readFileSync(history, 'utf8'), 'Historical closed task\n');
    assert.deepEqual(fs.readdirSync(todosDir), ['kept.md']);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
