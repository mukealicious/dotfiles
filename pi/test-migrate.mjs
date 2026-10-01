import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const script = fileURLToPath(new URL('./migrate-to-native.mjs', import.meta.url));
const put = (home, name, value) => {
  const file = path.join(home, name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value));
};
const run = home => spawnSync(process.execPath, [script], { env: { ...process.env, HOME: home }, encoding: 'utf8' });
const get = (home, name) => JSON.parse(fs.readFileSync(path.join(home, '.pi/agent', name), 'utf8'));
test('consolidates without modifying originals, converts MCP, excludes legacy auth, and reruns safely', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-migrate-'));
  try {
    for (const name of ['agent', 'personal', 'work']) put(home, `.pi/${name}/sessions/project/${name}.jsonl`, `${name}\n`);
    put(home, '.pi/personal/settings.json', { deviceId: 'stable', trackingId: 'tracking' });
    put(home, '.pi/personal/auth.json', { 'openai-codex': { type: 'oauth', access: 'secret-test' } });
    put(home, '.pi/work/auth.json', { openai: { type: 'api_key', key: 'test' } });
    put(home, '.pi/agent/auth.json', { anthropic: { type: 'oauth', access: 'test' } });
    put(home, '.config/mcp/mcp.json', { mcpServers: { github: { url: 'https://example.com/mcp', auth: 'bearer', bearerToken: '!gh auth token' } } });
    put(home, '.pi/personal/mcp-adapter.json', { mcpServers: { 'mobbin-personal': { url: 'https://api.mobbin.com/mcp', auth: 'oauth' } } });
    put(home, '.pi/work/mcp-adapter.json', { mcpServers: { 'mobbin-work': { url: 'https://api.mobbin.com/mcp', auth: 'oauth' } } });
    put(home, '.pi/work/agents/custom.md', 'custom agent');
    const result = run(home);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.includes('secret-test'), false);
    assert.equal(get(home, 'settings.json').deviceId, 'stable');
    assert.equal(get(home, 'settings.json').defaultProvider, 'openai');
    assert.deepEqual(Object.keys(get(home, 'auth.json')), ['anthropic']);
    const servers = get(home, 'mcp.json').mcpServers;
    assert.deepEqual(Object.keys(servers), ['github', 'mobbin']);
    assert.match(servers.github.headers.Authorization, /^!token=\$\(gh auth token\) && test/);
    assert.equal(servers.mobbin.auth, undefined);
    for (const name of ['agent', 'work', 'personal']) assert.equal(fs.readFileSync(path.join(home, `.pi/agent/sessions/project/${name}.jsonl`), 'utf8'), `${name}\n`);
    assert.equal(fs.readFileSync(path.join(home, '.pi/work/agents/custom.md'), 'utf8'), 'custom agent');
    assert.ok(fs.readdirSync(path.join(home, '.pi')).some(name => name.startsWith('agent.before-native-')));
    const before = fs.readFileSync(path.join(home, '.pi/agent/mcp.json'));
    assert.equal(run(home).status, 0);
    assert.deepEqual(fs.readFileSync(path.join(home, '.pi/agent/mcp.json')), before);
    assert.equal(fs.statSync(path.join(home, '.pi/agent/auth.json')).mode & 0o777, 0o600);
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});
for (const owner of ['agent', 'work', 'personal']) {
  test(`preserves native model and keybinding files from ${owner}`, () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-migrate-native-'));
    try {
      const files = {
        'models.json': '{ "providers": { "custom": { "baseUrl": "https://example.com" } } }\n',
        'keybindings.json': '{ "app.exit": ["ctrl+q"] }\n',
      };
      for (const [name, contents] of Object.entries(files)) put(home, `.pi/${owner}/${name}`, contents);
      if (owner !== 'agent') put(home, `.pi/${owner}/mcp.json`, { mcpServers: { native: { url: 'https://example.com/mcp' } } });
      const result = run(home);
      assert.equal(result.status, 0, result.stderr);
      for (const [name, contents] of Object.entries(files)) {
        assert.equal(fs.readFileSync(path.join(home, '.pi/agent', name), 'utf8'), contents);
        assert.equal(fs.statSync(path.join(home, '.pi/agent', name)).mode & 0o777, 0o600);
      }
      if (owner !== 'agent') assert.equal(get(home, 'mcp.json').mcpServers.native.url, 'https://example.com/mcp');
    } finally { fs.rmSync(home, { recursive: true, force: true }); }
  });
}
for (const name of ['models.json', 'keybindings.json', 'mcp.json']) {
  test(`refuses conflicting native ${name} before activation`, () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-migrate-conflict-'));
    try {
      const original = name === 'mcp.json' ? { mcpServers: { same: { url: 'https://one.example/mcp' } } } : { original: true };
      const other = name === 'mcp.json' ? { mcpServers: { same: { url: 'https://two.example/mcp' } } } : { other: true };
      put(home, `.pi/agent/${name}`, original);
      put(home, `.pi/personal/${name}`, other);
      const result = run(home);
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /Conflicting/);
      assert.deepEqual(get(home, name), original);
      assert.equal(fs.existsSync(path.join(home, '.pi/agent/.native-consolidation.json')), false);
      assert.equal(fs.readdirSync(path.join(home, '.pi')).some(n => n.startsWith('.native-stage-') || n.startsWith('agent.before-native-')), false);
    } finally { fs.rmSync(home, { recursive: true, force: true }); }
  });
}
for (const fastOwner of ['agent', 'work', 'personal']) {
  test(`preserves preferences, custom prompts and ${fastOwner} fast fallback`, () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-migrate-preferences-'));
    try {
      put(home, '.pi/agent/settings.json', { theme: 'old-agent', quietStartup: true });
      put(home, '.pi/work/settings.json', { theme: 'work-theme', defaultThinkingLevel: 'high' });
      const preferences = { defaultProvider: 'openai', defaultModel: 'gpt-5.6-sol', defaultThinkingLevel: 'max', theme: 'personal-theme', editorPaddingX: 2, packages: ['retired-adapter'], defaultTools: ['old-tool'], defaultProjectTrust: 'always' };
      put(home, '.pi/personal/settings.json', preferences);
      put(home, '.pi/personal/prompts/custom.md', 'Custom prompt $ARGUMENTS');
      const fast = { active: true, persistState: false, supportedModels: ['openai/gpt-5.4', 'openai/gpt-5.5'] };
      for (const owner of ['agent', 'work', 'personal']) {
        put(home, `.pi/${owner}/extensions/pi-openai-fast.json`, owner === fastOwner ? fast : { active: false });
        if (owner === fastOwner) break;
      }
      const result = run(home);
      assert.equal(result.status, 0, result.stderr);
      const settings = get(home, 'settings.json');
      for (const key of ['defaultProvider', 'defaultModel', 'defaultThinkingLevel', 'theme', 'editorPaddingX']) assert.equal(settings[key], preferences[key]);
      assert.equal(settings.quietStartup, true);
      assert.equal(settings.defaultProjectTrust, undefined);
      assert.notDeepEqual(settings.packages, preferences.packages);
      assert.notDeepEqual(settings.defaultTools, preferences.defaultTools);
      assert.deepEqual(get(home, 'extensions/pi-openai-fast.json'), fast);
      assert.equal(fs.readFileSync(path.join(home, '.pi/agent/prompts/custom.md'), 'utf8'), 'Custom prompt $ARGUMENTS');
      assert.deepEqual(JSON.parse(fs.readFileSync(path.join(home, '.pi/personal/settings.json'), 'utf8')), preferences);
    } finally { fs.rmSync(home, { recursive: true, force: true }); }
  });
}
test('retired provider/model pair does not override native defaults', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-migrate-provider-'));
  try {
    put(home, '.pi/personal/settings.json', { defaultProvider: 'openai-codex', defaultModel: 'old-codex-model', theme: 'kept' });
    assert.equal(run(home).status, 0);
    assert.equal(get(home, 'settings.json').defaultProvider, 'openai');
    assert.notEqual(get(home, 'settings.json').defaultModel, 'old-codex-model');
    assert.equal(get(home, 'settings.json').theme, 'kept');
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});
for (const kind of ['history conflict', 'prompt conflict', 'unsupported MCP option']) {
  test(`fails before switching for ${kind}`, () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-migrate-'));
    try {
      put(home, '.pi/agent/sessions/project/a.jsonl', 'original');
      if (kind === 'history conflict') put(home, '.pi/personal/sessions/project/a.jsonl', 'different');
      else if (kind === 'prompt conflict') {
        put(home, '.pi/agent/prompts/custom.md', 'original');
        put(home, '.pi/personal/prompts/custom.md', 'different');
      }
      else put(home, '.pi/personal/mcp-adapter.json', { mcpServers: { custom: { url: 'https://example.com', approveTools: true } } });
      assert.notEqual(run(home).status, 0);
      assert.equal(fs.readFileSync(path.join(home, '.pi/agent/sessions/project/a.jsonl'), 'utf8'), 'original');
      assert.equal(fs.existsSync(path.join(home, '.pi/agent/.native-consolidation.json')), false);
      assert.equal(fs.readdirSync(path.join(home, '.pi')).some(name => name.startsWith('.native-stage-')), false);
    } finally { fs.rmSync(home, { recursive: true, force: true }); }
  });
}
