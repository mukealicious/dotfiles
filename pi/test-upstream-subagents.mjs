// Owned installation/configuration seams against the actual Pi host. No model calls.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import * as host from '@earendil-works/pi-coding-agent';
import { InMemoryCredentialStore } from '@earendil-works/pi-ai';

const vendor = new URL('./packages/pi-subagents/', import.meta.url);
const require = createRequire(new URL('package.json', vendor));
const { createJiti } = require('jiti');
const jiti = createJiti(import.meta.url);
const settings = JSON.parse(fs.readFileSync(new URL('./settings.json', import.meta.url), 'utf8'));

test('vendored manifest and selected resources match the reviewed upstream release', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('package.json', vendor), 'utf8'));
  assert.equal(manifest.version, '0.74.0');
  assert.deepEqual(manifest.dependencies, { acorn: '8.18.0', jiti: '2.7.0', undici: '8.10.2', yaml: '2.8.3' });
  const selection = settings.packages.find(p => p.source?.endsWith('/pi-subagents'));
  assert.deepEqual(selection.skills, ['skills/pi-subagents/SKILL.md']);
  assert.deepEqual(selection.prompts, []);
  assert.deepEqual(settings.subagents.agentOverrides.scout.tools, ['read', 'grep', 'find', 'ls']);
});

test('personal researcher providers and restricted tools load in real upstream SDK children', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-upstream-host-'));
  const previous = process.env.PI_CODING_AGENT_DIR;
  let factory;
  try {
    process.env.PI_CODING_AGENT_DIR = root;
    const { createDefaultChildSessionFactory } = await jiti.import(new URL('src/runs/shared/child-session.ts', vendor).pathname);
    // Substitute only credential/model-network access. Session, loader, tool filtering
    // and upstream child creation/disposal are real host implementations.
    factory = createDefaultChildSessionFactory({ loadPiCodingAgent: async () => ({
      ...host,
      ModelRuntime: { create: () => host.ModelRuntime.create({ credentials: new InMemoryCredentialStore(), modelsPath: null, allowModelNetwork: false }) },
    }) });
    const researcher = host.parseFrontmatter(fs.readFileSync(new URL('./agents/researcher.md', import.meta.url), 'utf8')).frontmatter;
    const providers = [
      path.resolve('pi/packages/pi-exa/extensions/index.ts'),
      path.resolve('pi/packages/pi-parallel/extension/index.ts'),
    ];
    assert.deepEqual(researcher.extensions.split(',').map(p => p.trim().replace('~/.dotfiles', process.cwd())), providers);
    for (const role of [
      { tools: settings.subagents.agentOverrides.scout.tools, extensions: [], model: 'openai/gpt-6-luna' },
      { tools: researcher.tools.split(',').map(s => s.trim()), extensions: providers, model: researcher.model },
    ]) {
      const errors = [];
      let active;
      const child = await factory.create({
        cwd: root, storage: { kind: 'memory' }, projectTrusted: false,
        model: role.model, tools: role.tools, extensionPaths: role.extensions,
        ambientExtensions: false, noSkills: true, noContextFiles: true, runtime: {},
        hooks: [{ name: 'acceptance', factory: pi => pi.on('session_start', () => { active = pi.getActiveTools(); }) }],
        onExtensionError: error => errors.push(error),
      });
      try {
        assert.deepEqual(errors, []);
        assert.equal(child.modelId, role.model);
        assert.deepEqual([...active].sort(), [...role.tools].sort());
        for (const name of ['write', 'edit', 'bash', 'codemode', 'subagent']) assert.ok(!active.includes(name), name);
      } finally { await child.dispose(); }
    }
  } finally {
    await factory?.dispose();
    if (previous === undefined) delete process.env.PI_CODING_AGENT_DIR;
    else process.env.PI_CODING_AGENT_DIR = previous;
    fs.rmSync(root, { recursive: true, force: true });
  }
});
