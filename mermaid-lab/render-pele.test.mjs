import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { render } from 'pele';
import { renderPeleSvg } from './render-pele.mjs';

const diagram = 'flowchart LR\n A[Input] --> B[Output]';

test('Pele preview renders SVG without a DOM', async () => {
  assert.match(await renderPeleSvg(diagram), /^<svg\b/);
});
test('Pele preview keeps static diagrams deterministic', async () => {
  assert.equal(await renderPeleSvg(diagram), await renderPeleSvg(diagram));
});
test('Pele preview rejects malformed syntax', async () => {
  await assert.rejects(renderPeleSvg('flowchart TD\n A -->'), /Parse error|syntax|Unexpected|Expecting/i);
});
test('Pele preview rejects unsupported external plugin types', async () => {
  await assert.rejects(renderPeleSvg('zenuml\n A->B: Hello'), /type|supported/i);
});
test('Pele preview bounds source length before worker creation', async () => {
  await assert.rejects(renderPeleSvg('x'.repeat(50_001)), /50000/);
});
test('Pele preview rejects non-text inputs', async () => {
  await assert.rejects(renderPeleSvg({ source: diagram }), /must be text/);
});
test('Pele preview validates width before worker creation', async () => {
  for (const width of [0, 199, 2401, NaN, 320.5, '320']) {
    await assert.rejects(renderPeleSvg(diagram, width), /width/);
  }
});
test('Pele preview bounds edge expansion despite diagram configuration', async () => {
  const nodes = Array.from({ length: 24 }, (_, i) => `n${i}`).join(' & ');
  await assert.rejects(renderPeleSvg(`%%{init: {"maxEdges": 999999}}%%\nflowchart TD\n ${nodes} --> ${nodes}`), /edge limit/i);
});
test('Pele library enforces source and output limits', () => {
  assert.throws(() => render(diagram, { outputLimit: 10 }), /output.*limit/i);
  assert.throws(() => render(diagram, { limit: 10 }), /source.*limit/i);
});
test('Pele preview creates a private file and refuses to overwrite it', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pele-preview-test-'));
  try {
    const input = join(directory, 'source.mmd');
    const output = join(directory, 'preview.svg');
    await writeFile(input, diagram);
    const command = promisify(execFile);
    const script = new URL('./render-pele.mjs', import.meta.url).pathname;
    const first = await command(process.execPath, [script, input, output, '320']);
    assert.match(first.stdout, /not official Mermaid validation/);
    const original = await readFile(output, 'utf8');
    assert.match(original, /^<svg\b/);
    assert.equal((await stat(output)).mode & 0o777, 0o600);
    await assert.rejects(command(process.execPath, [script, input, output]), /EEXIST/);
    assert.equal(await readFile(output, 'utf8'), original);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
