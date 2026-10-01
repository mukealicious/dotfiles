// Test the installed, pinned npm package (with source-owned policy patch), not a fork.
// No model or priority-tier requests. PI_FAST_PACKAGE_DIR can point at an offline unpack.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { DefaultResourceLoader, ModelRuntime, SettingsManager } from '@earendil-works/pi-coding-agent';
import { InMemoryCredentialStore } from '@earendil-works/pi-ai';
import { retireAstraPriority } from './retire-astra-priority.mjs';

const packageDir = process.env.PI_FAST_PACKAGE_DIR ?? path.join(os.homedir(), '.pi/agent/npm/node_modules/@benvargas/pi-openai-fast');
const manifest = JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8'));
assert.equal(manifest.name, '@benvargas/pi-openai-fast');
assert.equal(manifest.version, '1.1.1');
// Deliberately retain the old local order rather than trigger upstream default expansion.
const supportedModels = ['openai/gpt-5.4', 'openai-codex/gpt-5.4', 'openai/gpt-5.5', 'openai-codex/gpt-5.5',
  'openai/gpt-5.6-luna', 'openai-codex/gpt-5.6-luna', 'openai/gpt-5.6-terra', 'openai-codex/gpt-5.6-terra',
  'openai/gpt-5.6-sol', 'openai-codex/gpt-5.6-sol', 'openai-codex/gpt-6-astra', 'openai/gpt-6-astra'];

async function fixture(config, run, { project, trusted = false, flag = false, hasUI = true } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-native-fast-'));
  const previous = process.env.PI_CODING_AGENT_DIR;
  const agentDir = path.join(root, 'isolated-agent');
  const cwd = path.join(root, 'project');
  const file = path.join(agentDir, 'extensions/pi-openai-fast.json');
  const projectFile = path.join(cwd, '.pi/extensions/pi-openai-fast.json');
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.mkdirSync(path.dirname(projectFile), { recursive: true });
    if (config !== undefined) fs.writeFileSync(file, typeof config === 'string' ? config : JSON.stringify(config));
    if (project !== undefined) fs.writeFileSync(projectFile, JSON.stringify(project));
    process.env.PI_CODING_AGENT_DIR = agentDir;
    const loader = new DefaultResourceLoader({ cwd, agentDir, settingsManager: SettingsManager.inMemory({}),
      noExtensions: true, noSkills: true, noThemes: true, noPromptTemplates: true,
      additionalExtensionPaths: [path.join(packageDir, 'extensions/index.ts')] });
    await loader.reload();
    const loaded = loader.getExtensions();
    assert.deepEqual(loaded.errors, []);
    assert.equal(loaded.extensions.length, 1);
    loaded.runtime.flagValues.set('fast', flag);
    const extension = loaded.extensions[0];
    assert.deepEqual([...extension.commands.keys()], ['fast']);
    const notices = [];
    const statuses = [];
    const ctx = { cwd, isProjectTrusted: () => trusted, model: { provider: 'openai', id: 'gpt-6-astra' }, hasUI,
      ui: { notify: (...args) => notices.push(args), setStatus: (key, text) => statuses.push({ key, text }),
        theme: { fg: (color, text) => `${color}:${text}` } } };
    const event = async (name, value = {}) => {
      let result;
      for (const handler of extension.handlers.get(name) ?? []) result = await handler(value, ctx);
      return result;
    };
    await run({ ctx, notices, statuses, file, projectFile, event, agentDir,
      command: args => extension.commands.get('fast').handler(args, ctx),
      read: () => JSON.parse(fs.readFileSync(file, 'utf8')) });
  } finally {
    if (previous === undefined) delete process.env.PI_CODING_AGENT_DIR;
    else process.env.PI_CODING_AGENT_DIR = previous;
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test('omitted model list follows package defaults and stays omitted after toggles', async () => {
  await fixture({ active: true, persistState: true }, async ({ event, command, ctx, read, statuses }) => {
    await event('session_start');
    // This model is in upstream defaults but absent from the old personal list.
    ctx.model = { provider: 'openai', id: 'gpt-5.4-mini' };
    await event('model_select');
    assert.equal((await event('before_provider_request', { payload: {} })).service_tier, 'priority');
    assert.deepEqual(statuses.at(-1), { key: 'pi-openai-fast', text: 'accent:⚡ FAST' });
    await command('off');
    assert.deepEqual(read(), { active: false, persistState: true });
    await command('on');
    assert.deepEqual(read(), { active: true, persistState: true });
  });
});

test('pinned fast preserves existing list and state, adds only a supported priority payload', async () => {
  const config = { active: true, persistState: true, supportedModels };
  await fixture(config, async ({ event, command, read, ctx }) => {
    await event('session_start');
    assert.deepEqual(read(), config);
    const payload = { model: 'unchanged', value: 42 };
    assert.deepEqual(await event('before_provider_request', { payload }), { ...payload, service_tier: 'priority' });
    assert.deepEqual(payload, { model: 'unchanged', value: 42 });
    ctx.model.id = 'unsupported';
    assert.equal(await event('before_provider_request', { payload }), undefined);
    await command('status');
    assert.deepEqual(read(), config);
    await command('off');
    assert.deepEqual(read(), { ...config, active: false });
    ctx.model.id = 'gpt-6-astra';
    assert.equal(await event('before_provider_request', { payload }), undefined);
    await command('on');
    assert.deepEqual(read(), config);
  });
});
test('native status shows FAST only while enabled on a configured current model', async () => {
  await fixture({ active: false, persistState: true, supportedModels: ['openai/gpt-6-astra'] }, async ({ event, command, ctx, statuses }) => {
    await event('session_start');
    assert.deepEqual(statuses.at(-1), { key: 'pi-openai-fast', text: undefined });
    await command('on');
    assert.deepEqual(statuses.at(-1), { key: 'pi-openai-fast', text: 'accent:⚡ FAST' });

    ctx.model.id = 'unsupported';
    await event('model_select', { model: ctx.model, source: 'set' });
    assert.deepEqual(statuses.at(-1), { key: 'pi-openai-fast', text: undefined });
    assert.equal(await event('before_provider_request', { payload: {} }), undefined);

    ctx.model.id = 'gpt-6-astra';
    await event('model_select', { model: ctx.model, source: 'set' });
    assert.deepEqual(statuses.at(-1), { key: 'pi-openai-fast', text: 'accent:⚡ FAST' });
    assert.equal((await event('before_provider_request', { payload: {} })).service_tier, 'priority');

    await command('off');
    assert.deepEqual(statuses.at(-1), { key: 'pi-openai-fast', text: undefined });
  });
});
test('native status hides enabled fast mode when no model is selected', async () => {
  await fixture({ active: true, persistState: true, supportedModels: ['openai/gpt-6-astra'] }, async ({ event, ctx, statuses }) => {
    await event('session_start');
    assert.deepEqual(statuses.at(-1), { key: 'pi-openai-fast', text: 'accent:⚡ FAST' });
    ctx.model = undefined;
    await event('model_select', { model: undefined, source: 'set' });
    assert.deepEqual(statuses.at(-1), { key: 'pi-openai-fast', text: undefined });
    ctx.model = { provider: 'openai', id: 'gpt-6-astra' };
    await event('model_select', { model: ctx.model, source: 'set' });
    assert.deepEqual(statuses.at(-1), { key: 'pi-openai-fast', text: 'accent:⚡ FAST' });
  });
});
test('non-UI fast sessions do not attempt to render footer status', async () => {
  await fixture({ active: true, persistState: true, supportedModels }, async ({ event, statuses }) => {
    await event('session_start');
    assert.deepEqual(statuses, []);
  }, { hasUI: false });
});
test('native payload follows fast on/off across supported and unsupported model switches', async () => {
  const config = { active: false, persistState: true, supportedModels: ['openai/gpt-6-astra', 'openai/gpt-6-sol'] };
  await fixture(config, async ({ event, command, read, ctx, agentDir }) => {
    const modelsPath = path.join(agentDir, 'models.json');
    fs.writeFileSync(modelsPath, JSON.stringify({ providers: { openai: { modelOverrides: {
      'gpt-6-astra': { samplingParams: { service_tier: 'priority' } },
    } } } }));
    retireAstraPriority(modelsPath);
    const runtime = await ModelRuntime.create({ modelsPath, modelsStorePath: path.join(agentDir, 'catalog.json'),
      credentials: new InMemoryCredentialStore(), allowModelNetwork: false, refreshOnCreate: false });
    assert.equal(runtime.getError(), undefined);
    await event('session_start');
    async function payloadFor(id, priority) {
      ctx.model = runtime.getModel('openai', id);
      assert.ok(ctx.model, id);
      await event('model_select', { model: ctx.model, source: 'set' });
      let payload;
      let requests = 0;
      const result = await runtime.stream(ctx.model, { messages: [{ role: 'user', content: 'Offline fixture', timestamp: 0 }] }, {
        apiKey: 'offline-fixture',
        onPayload: async value => {
          payload = await event('before_provider_request', { payload: value }) ?? value;
          throw new Error('STOP_BEFORE_NETWORK');
        },
        fetch: () => { requests++; throw new Error('HTTP forbidden'); },
      }).result();
      assert.match(result.errorMessage, /STOP_BEFORE_NETWORK/);
      assert.ok(payload);
      assert.equal(payload.service_tier, priority ? 'priority' : undefined, id);
      assert.equal(requests, 0);
    }
    await payloadFor('gpt-6-astra', false);
    await command('on');
    await payloadFor('gpt-6-astra', true);
    await payloadFor('gpt-6-sol', true);
    await payloadFor('gpt-6-luna', false); // Not in this explicit allowlist.
    assert.equal(read().active, true);
    await payloadFor('gpt-6-astra', true);
    await command('off');
    await payloadFor('gpt-6-sol', false);
    await payloadFor('gpt-6-astra', false);
    assert.deepEqual(read(), config);
  });
});
test('persistState false starts off, command toggle works without writing', async () => {
  const config = { active: true, persistState: false, supportedModels };
  await fixture(config, async ({ event, command, read }) => {
    await event('session_start');
    assert.equal(await event('before_provider_request', { payload: {} }), undefined);
    await command('on');
    assert.deepEqual(await event('before_provider_request', { payload: {} }), { service_tier: 'priority' });
    assert.deepEqual(read(), config);
  });
});
test('--fast enables a supported model without changing model selection', async () => {
  await fixture({ active: false, persistState: false, supportedModels }, async ({ event, ctx, statuses }) => {
    const model = ctx.model;
    await event('session_start');
    assert.deepEqual(statuses.at(-1), { key: 'pi-openai-fast', text: 'accent:⚡ FAST' });
    assert.deepEqual(await event('before_provider_request', { payload: {} }), { service_tier: 'priority' });
    assert.equal(ctx.model, model);
  }, { flag: true });
});
test('/fast status refreshes policy and updates the native badge', async () => {
  await fixture({ active: true, persistState: true, supportedModels: ['openai/gpt-6-astra'] }, async ({ event, command, file, statuses }) => {
    await event('session_start');
    assert.deepEqual(statuses.at(-1), { key: 'pi-openai-fast', text: 'accent:⚡ FAST' });
    fs.writeFileSync(file, JSON.stringify({ active: true, persistState: true, supportedModels: ['openai/gpt-6-sol'] }));
    await command('status');
    assert.deepEqual(statuses.at(-1), { key: 'pi-openai-fast', text: undefined });
  });
});
for (const trusted of [false, true]) {
  test(`fast project override honors native trust=${trusted}`, async () => {
    const project = { active: true, persistState: true, supportedModels };
    await fixture({ active: false, persistState: true, supportedModels }, async ({ event, command, read, projectFile }) => {
      const before = fs.readFileSync(projectFile, 'utf8');
      await event('session_start');
      assert.equal(Boolean(await event('before_provider_request', { payload: {} })), trusted);
      await command(trusted ? 'off' : 'on');
      if (!trusted) assert.equal(fs.readFileSync(projectFile, 'utf8'), before);
      assert.equal(read().active, !trusted);
    }, { trusted, project });
  });
}
test('empty allowlist stays empty; no model is also a no-op', async () => {
  await fixture({ active: true, persistState: true, supportedModels: [] }, async ({ event, ctx, read }) => {
    await event('session_start');
    assert.equal(await event('before_provider_request', { payload: {} }), undefined);
    ctx.model = undefined;
    assert.equal(await event('before_provider_request', { payload: {} }), undefined);
    assert.deepEqual(read().supportedModels, []);
  });
});
test('fresh explicit agent directory starts off, never inherits active unified config', async () => {
  await fixture(undefined, async ({ event, read }) => {
    await event('session_start');
    assert.equal(read().active, false);
    assert.equal(await event('before_provider_request', { payload: {} }), undefined);
  });
});
test('malformed existing configuration fails without overwriting data', async () => {
  await fixture('{broken', async ({ event, file }) => {
    await assert.rejects(event('session_start'), /Failed to read/);
    assert.equal(fs.readFileSync(file, 'utf8'), '{broken');
  });
});

for (const invalid of ['openai/gpt-5.4', null, {}, 42, [null], ['invalid'], ['openai/gpt-5.4', false]]) {
  test(`explicit malformed allowlist fails closed: ${JSON.stringify(invalid)}`, async () => {
    const config = { active: true, persistState: true, supportedModels: invalid };
    await fixture(config, async ({ event, read }) => {
      await assert.rejects(event('session_start'), /supportedModels must be an array/);
      await assert.rejects(event('before_provider_request', { payload: {} }), /supportedModels must be an array/);
      assert.deepEqual(read(), config);
    });
  });
}

for (const project of [[], null, 42, true, 'invalid-root']) {
  test(`non-object trusted project policy fails closed: ${JSON.stringify(project)}`, async () => {
    await fixture({ active: true, persistState: true, supportedModels }, async ({ event, projectFile }) => {
      const before = fs.readFileSync(projectFile, 'utf8');
      await assert.rejects(event('session_start'), /configuration must be a JSON object/);
      await assert.rejects(event('before_provider_request', { payload: {} }), /configuration must be a JSON object/);
      assert.equal(fs.readFileSync(projectFile, 'utf8'), before);
    }, { project, trusted: true });
  });
}
test('non-object global policy is rejected while an untrusted project is ignored', async () => {
  await fixture('[]', async ({ event }) => {
    await assert.rejects(event('session_start'), /configuration must be a JSON object/);
  });
  await fixture({ active: true, persistState: true, supportedModels }, async ({ event }) => {
    await event('session_start');
    assert.deepEqual(await event('before_provider_request', { payload: {} }), { service_tier: 'priority' });
  }, { project: null, trusted: false });
});

test('a failed active-policy refresh clears cached paid eligibility and the badge', async () => {
  await fixture({ active: true, persistState: true, supportedModels }, async ({ event, command, file, statuses }) => {
    await event('session_start');
    assert.deepEqual(statuses.at(-1), { key: 'pi-openai-fast', text: 'accent:⚡ FAST' });
    assert.deepEqual(await event('before_provider_request', { payload: {} }), { service_tier: 'priority' });
    fs.writeFileSync(file, JSON.stringify({ active: true, persistState: true, supportedModels: 'openai/gpt-5.4' }));
    await assert.rejects(command('status'), /supportedModels must be an array/);
    assert.deepEqual(statuses.at(-1), { key: 'pi-openai-fast', text: undefined });
    await assert.rejects(event('before_provider_request', { payload: {} }), /supportedModels must be an array/);
    // Even after the disk is repaired, a failed refresh has disabled this session.
    fs.writeFileSync(file, JSON.stringify({ active: true, persistState: true, supportedModels }));
    assert.equal(await event('before_provider_request', { payload: {} }), undefined);
  });
});

test('failed persistence does not turn on a paid priority tier', { skip: process.getuid?.() === 0 }, async () => {
  await fixture({ active: false, persistState: true, supportedModels }, async ({ event, command, file, read }) => {
    await event('session_start');
    fs.chmodSync(file, 0o400);
    try {
      await assert.rejects(command('on'), /Failed to write/);
      assert.equal(await event('before_provider_request', { payload: {} }), undefined);
      assert.equal(read().active, false);
    } finally { fs.chmodSync(file, 0o600); }
  });
});

test('legacy-shaped explicit allowlists never silently expand to Astra', async () => {
  const config = { active: true, persistState: true, supportedModels: ['openai/gpt-5.4', 'openai-codex/gpt-5.4'] };
  await fixture(config, async ({ event, read, ctx }) => {
    await event('session_start');
    assert.equal(await event('before_provider_request', { payload: {} }), undefined);
    ctx.model.id = 'gpt-5.4';
    assert.deepEqual(await event('before_provider_request', { payload: {} }), { service_tier: 'priority' });
    assert.deepEqual(read(), config);
  });
});
test('off stops priority even if persistence fails, with an explicit startup warning', { skip: process.getuid?.() === 0 }, async () => {
  await fixture({ active: true, persistState: true, supportedModels }, async ({ event, command, file, read, notices }) => {
    await event('session_start');
    fs.chmodSync(file, 0o400);
    try {
      await command('off');
      assert.equal(await event('before_provider_request', { payload: {} }), undefined);
      assert.equal(read().active, true, 'disk failure is not concealed');
      assert.match(notices.at(-1)[0], /off for this session.*saved startup state may still be on/);
      assert.equal(notices.at(-1)[1], 'warning');
    } finally { fs.chmodSync(file, 0o600); }
  });
});
