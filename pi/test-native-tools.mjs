// Exercise restrictions against the real Pi runtime, not just mocked CLI args.
// No model requests, credentials, external MCP servers, or user resources.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { Type } from 'typebox';
import { InMemoryCredentialStore } from '@earendil-works/pi-ai';
import { createAgentSession, createCodemodeExtension, createToolSearchExtension, DefaultResourceLoader, ModelRuntime, SessionManager, SettingsManager } from '@earendil-works/pi-coding-agent';

const { parseArgs } = await import(new URL('./cli/args.js', import.meta.resolve('@earendil-works/pi-coding-agent')));
for (const tools of [undefined, [], ['./fixture.ts'], ['read', './fixture.ts'], ['read', 'grep', 'find', 'ls'], ['read', 'web_search'], ['read', 'codemode']]) {
  test(`native discovery cannot broaden ${tools?.join(',') ?? 'unrestricted parent'}`, async () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-native-tools-'));
    let session;
    try {
      const allowed = tools === undefined ? undefined : tools.filter(name => !name.includes('/') && !/\.[jt]s$/.test(name));
      const parsed = parseArgs(allowed === undefined ? [] : ['--tools', allowed.join(',')]);
      assert.deepEqual(parsed.diagnostics, []);
      assert.deepEqual(parsed.tools, allowed);
      const settingsManager = SettingsManager.inMemory({ defaultTools: ['+codemode'] });
      const loader = new DefaultResourceLoader({
        cwd, agentDir: cwd, settingsManager, noExtensions: true, noSkills: true,
        extensionFactories: [createCodemodeExtension(), createToolSearchExtension(), pi => {
          // A native MCP tool with indirect exposure; simulate discovery activation
          // on session_start, after the initial --tools selection has been applied.
          pi.registerTool({ name: 'mcp__fixture__write', label: 'MCP fixture', description: 'Fixture', exposure: 'codemode', parameters: Type.Object({}), execute: async () => ({ content: [{ type: 'text', text: 'ok' }], details: undefined }) });
          pi.registerTool({ name: 'web_search', label: 'Search fixture', description: 'Fixture', parameters: Type.Object({}), execute: async () => ({ content: [{ type: 'text', text: 'ok' }], details: undefined }) });
          pi.on('session_start', () => {
            pi.registerTool({ name: 'late_write', label: 'Late tool', description: 'Must stay forbidden', exposure: 'deferred', parameters: Type.Object({}), execute: async () => ({ content: [], details: undefined }) });
            pi.setActiveTools([...pi.getActiveTools(), 'codemode', 'tool_search', 'late_write']);
          });
        }],
      });
      await loader.reload();
      assert.deepEqual(loader.getExtensions().errors, []);
      const modelRuntime = await ModelRuntime.create({ credentials: new InMemoryCredentialStore(), modelsPath: null, allowModelNetwork: false });
      ({ session } = await createAgentSession({ cwd, agentDir: cwd, modelRuntime, model: modelRuntime.getModels()[0], resourceLoader: loader, settingsManager, sessionManager: SessionManager.inMemory(), tools: parsed.tools }));
      await session.bindExtensions({});
      const active = session.getActiveToolNames();
      const callable = session.getCallableToolNames();
      if (allowed !== undefined) {
        assert.deepEqual(active.sort(), [...allowed].sort());
        for (const name of ['codemode', 'tool_search', 'mcp__fixture__write', 'late_write'].filter(name => !allowed.includes(name))) {
          assert.ok(!active.includes(name), name);
          assert.ok(!callable.includes(name), name);
        }
      } else {
        assert.ok(active.includes('codemode'));
        assert.ok(callable.includes('mcp__fixture__write'));
      }
    } finally {
      session?.dispose();
      fs.rmSync(cwd, { recursive: true, force: true });
    }
  });
}

test('real orchestration tools stay direct but cannot be called through codemode', async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-orchestration-exposure-'));
  const previous = process.env.PI_CODING_AGENT_DIR;
  let session;
  try {
    process.env.PI_CODING_AGENT_DIR = cwd;
    const settingsManager = SettingsManager.inMemory({});
    const loader = new DefaultResourceLoader({ cwd, agentDir: cwd, settingsManager,
      noExtensions: true, noSkills: true, noThemes: true, noPromptTemplates: true,
      additionalExtensionPaths: [
        path.resolve('pi/packages/pi-subagents/index.ts'),
      ],
    });
    await loader.reload();
    assert.deepEqual(loader.getExtensions().errors, []);
    const definitions = loader.getExtensions().extensions.flatMap(e => [...e.tools.values()].map(t => t.definition));
    assert.equal(definitions.find(t => t.name === 'subagent')?.exposure, 'model-only');
    for (const name of ['handoff_control', 'handoff_accept']) assert.ok(!definitions.some(t => t.name === name));
    const modelRuntime = await ModelRuntime.create({ credentials: new InMemoryCredentialStore(), modelsPath: null, allowModelNetwork: false });
    ({ session } = await createAgentSession({ cwd, agentDir: cwd, modelRuntime,
      model: modelRuntime.getModels()[0], resourceLoader: loader, settingsManager, sessionManager: SessionManager.inMemory() }));
    assert.ok(session.getActiveToolNames().includes('subagent'));
    assert.ok(!session.getCallableToolNames().includes('subagent'));
  } finally {
    session?.dispose();
    if (previous === undefined) delete process.env.PI_CODING_AGENT_DIR;
    else process.env.PI_CODING_AGENT_DIR = previous;
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});
