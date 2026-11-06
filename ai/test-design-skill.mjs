#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'ai/skills/mu-design-eng');

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(dir, entry.name);
    assert(!entry.isSymbolicLink(), `Unexpected symlink: ${target}`);
    return entry.isDirectory() ? files(target) : [target];
  });
}

function localLinks(file) {
  const text = fs.readFileSync(file, 'utf8');
  return [...text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)]
    .map(match => match[1])
    .filter(link => !/^[a-z][a-z\d+.-]*:/i.test(link) && !link.startsWith('#'))
    .map(link => path.resolve(path.dirname(file), link.split('#')[0]));
}

function validateTree(dir) {
  const inventory = files(dir);
  const markdown = inventory.filter(file => file.endsWith('.md'));
  assert.deepEqual(inventory.filter(file => path.basename(file) === 'SKILL.md'), [path.join(dir, 'SKILL.md')]);
  assert(!inventory.some(file => /\.(?:mjs|js|sh|ts|wasm)$/.test(file)), 'Candidate must remain instruction-only');
  const entry = fs.readFileSync(path.join(dir, 'SKILL.md'), 'utf8');
  assert.match(entry, /^---\nname: mu-design-eng\n/);
  assert.match(entry, /^disable-model-invocation: true$/m, 'Candidate must stay manual until acceptance');
  assert.match(entry, /^user-invocable: true$/m);

  for (const file of markdown) {
    for (const target of localLinks(file)) {
      assert(target.startsWith(`${dir}${path.sep}`), `Reference leaves candidate: ${file} -> ${target}`);
      assert(fs.existsSync(target), `Missing reference: ${file} -> ${target}`);
    }
    const text = fs.readFileSync(file, 'utf8');
    assert(!/\{\{[a-z_]+\}\}/.test(text), `Unresolved placeholder: ${file}`);
    assert(!/\/Users\/|~\/\.cache\//.test(text), `Machine-local pointer: ${file}`);
  }

  const visited = new Set();
  function visit(file) {
    const relative = path.relative(dir, file);
    if (relative !== 'SKILL.md' && !/^(playbooks|references)\//.test(relative)) return;
    if (visited.has(file)) return;
    visited.add(file);
    if (file.endsWith('.md')) localLinks(file).forEach(visit);
  }
  visit(path.join(dir, 'SKILL.md'));
  for (const file of markdown.filter(file => /\/(playbooks|references)\//.test(file))) {
    assert(visited.has(file), `Unreachable guidance: ${file}`);
  }
  for (const license of ['emil-LICENSE', 'impeccable-LICENSE', 'impeccable-NOTICE.md', 'pstack-LICENSE']) {
    assert(fs.statSync(path.join(dir, 'licenses', license)).size > 100, `Missing notice: ${license}`);
  }
  return inventory;
}

validateTree(source);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'design-skill-'));
try {
  const input = path.join(temp, 'source');
  fs.mkdirSync(input);
  fs.cpSync(source, path.join(input, 'mu-design-eng'), { recursive: true });
  for (const provider of ['pi', 'codex', 'claude-code', 'opencode']) {
    const output = path.join(temp, provider);
    const project = () => execFileSync(process.execPath, [path.join(root, 'ai/scripts/project-skills.mjs'), provider, input, output]);
    project();
    const projected = path.join(output, 'mu-design-eng');
    const inventory = validateTree(projected);
    const before = inventory.map(file => [path.relative(projected, file), fs.readFileSync(file)]);
    fs.writeFileSync(path.join(projected, 'stale-output.txt'), 'fixture');
    project();
    assert(!fs.existsSync(path.join(projected, 'stale-output.txt')), `${provider}: stale output survived rebuild`);
    assert.deepEqual(validateTree(projected).map(file => [path.relative(projected, file), fs.readFileSync(file)]), before,
      `${provider}: repeat projection changed content`);
  }

  const broken = path.join(temp, 'broken');
  fs.cpSync(source, broken, { recursive: true });
  fs.appendFileSync(path.join(broken, 'SKILL.md'), '\n[Missing](references/missing.md)\n');
  assert.throws(() => validateTree(broken), /Missing reference/);
  fs.cpSync(source, broken, { recursive: true });
  fs.writeFileSync(path.join(broken, 'references/orphan.md'), '# Unreachable\n');
  fs.appendFileSync(path.join(broken, 'VENDORED_FROM.md'), '\n[Historical pointer only](references/orphan.md)\n');
  assert.throws(() => validateTree(broken), /Unreachable guidance/);
  console.log('PASS: design references, single entry point, notices, 4 disposable projections, repeat projection, and negative fixtures');
  console.log('Static checks do not establish routing behavior, design quality, or browser acceptance.');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
