// Acceptance contract for retiring Mitsupi's edit override; no model requests.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { createEditTool, createEditToolDefinition } from '@earendil-works/pi-coding-agent';

async function fixture(run) {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'pi-native-edit-'));
  const file = path.join(cwd, 'file.txt');
  try {
    await fs.writeFile(file, 'alpha\nbeta\ngamma\n');
    await run({ cwd, file, tool: createEditTool(cwd), read: () => fs.readFile(file, 'utf8') });
  } finally {
    await fs.rm(cwd, { recursive: true, force: true });
  }
}

const replacement = (oldText, newText) => ({ oldText, newText });

test('native edit declares one file and edits[] rather than multi/patch', () => {
  const definition = createEditToolDefinition(process.cwd());
  assert.deepEqual(Object.keys(definition.parameters.properties).sort(), ['edits', 'path']);
  assert.ok(definition.promptGuidelines.some(line => line.includes('original file')));
});

test('native edit matches all disjoint replacements against the original file', async () => {
  await fixture(async ({ tool, read }) => {
    await tool.execute('disjoint', { path: 'file.txt', edits: [replacement('alpha', 'beta'), replacement('beta', 'delta')] });
    assert.equal(await read(), 'beta\ndelta\ngamma\n');
  });
});

for (const [name, edits, error] of [
  ['missing match', [replacement('alpha', 'changed'), replacement('missing', 'value')], /Could not find/],
  ['overlap', [replacement('alpha\nbeta', 'changed'), replacement('beta', 'value')], /overlap/],
  ['sequential dependency', [replacement('alpha', 'new text'), replacement('new text', 'value')], /Could not find/],
]) {
  test(`native edit leaves the whole file intact on ${name}`, async () => {
    await fixture(async ({ tool, read }) => {
      await assert.rejects(tool.execute(name, { path: 'file.txt', edits }), error);
      assert.equal(await read(), 'alpha\nbeta\ngamma\n');
    });
  });
}

test('native edit rejects ambiguous matches without changing the file', async () => {
  await fixture(async ({ tool, file, read }) => {
    await fs.writeFile(file, 'duplicate\nduplicate\n');
    await assert.rejects(tool.execute('ambiguous', { path: 'file.txt', edits: [replacement('duplicate', 'changed')] }), /unique/);
    assert.equal(await read(), 'duplicate\nduplicate\n');
  });
});

test('concurrent native edits serialize the complete same-file read-modify-write', async () => {
  await fixture(async ({ cwd, read }) => {
    let activeReads = 0;
    let maxActiveReads = 0;
    const tool = createEditTool(cwd, { operations: {
      access: file => fs.access(file),
      readFile: async file => {
        activeReads++;
        maxActiveReads = Math.max(maxActiveReads, activeReads);
        const content = await fs.readFile(file);
        // Force competing unqueued calls to read the same original content.
        await new Promise(resolve => setTimeout(resolve, 20));
        return content;
      },
      writeFile: async (file, content) => {
        await fs.writeFile(file, content);
        activeReads--;
      },
    } });
    await Promise.all([
      tool.execute('first', { path: 'file.txt', edits: [replacement('alpha', 'first')] }),
      tool.execute('second', { path: 'file.txt', edits: [replacement('gamma', 'last')] }),
    ]);
    assert.equal(maxActiveReads, 1);
    assert.equal(activeReads, 0);
    assert.equal(await read(), 'first\nbeta\nlast\n');
  });
});
