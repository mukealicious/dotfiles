// Installed native discovery/filtering, including symlink projections; no model calls.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { DefaultResourceLoader, SettingsManager } from '@earendil-works/pi-coding-agent';

const settings = JSON.parse(fs.readFileSync(new URL('./settings.json', import.meta.url), 'utf8'));

test('fresh native discovery loads the consolidated source projection without retired skills', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-engineering-skills-'));
  try {
    const projection = path.join(root, 'skills');
    execFileSync(process.execPath, [path.resolve('ai/scripts/project-skills.mjs'), 'pi', path.resolve('ai/skills'), projection]);
    const loader = new DefaultResourceLoader({ cwd: root, agentDir: root,
      settingsManager: SettingsManager.inMemory({}), noExtensions: true,
      noSkills: true, noPromptTemplates: true, noThemes: true,
      additionalSkillPaths: [projection] });
    await loader.reload();
    const result = loader.getSkills();
    assert.deepEqual(result.diagnostics, []);
    for (const name of ['diagnosing-bugs', 'write-discoverable-code', 'uncomplect', 'cloudflare-composition-root', 'effect-service-design', 'tech-spec', 'writing-for-agents']) {
      const loaded = result.skills.find(skill => skill.name === name);
      assert.ok(loaded, `${name} is discoverable`);
      assert.equal(loaded.filePath, path.join(projection, name, 'SKILL.md'));
      assert.equal(loaded.disableModelInvocation, ['tech-spec', 'writing-for-agents'].includes(name), 'preserve deliberate manual versus automatic invocation');
      assert.ok(loaded.description.length > 20, 'native loader parses multiline descriptions');
    }
    const retired = ['coding-standards', 'mu-mode', 'mu-stack', 'rat-stack', 'tdd', 'domain-modeling', 'codebase-design', 'code-review', 'grill-with-docs', 'build-skill', 'agent-context', 'prelude', 'bootstrap-prelude'];
    assert.deepEqual(result.skills.filter(skill => retired.includes(skill.name)), []);
    for (const file of ['diagnosing-bugs/scripts/hitl-loop.template.sh', 'write-discoverable-code/LICENSE', 'uncomplect/references/source-map.md', 'cloudflare-composition-root/EXAMPLES.md', 'effect-service-design/references/AUDIT.md', 'effect-service-design/agents/openai.yaml', 'writing-for-agents/SKILL-MECHANICS.md', 'writing-for-agents/agents/openai.yaml', 'writing-for-agents/LICENSE', ...['cloudflare-composition-root', 'effect-service-design', 'tech-spec'].map(name => `${name}/LICENSE`)]) {
      assert.ok(fs.existsSync(path.join(projection, file)), file);
    }
    const spec = fs.readFileSync(path.join(projection, 'tech-spec/SKILL.md'), 'utf8');
    assert.ok(spec.includes("repository's testing policy"));
    const seed = fs.readFileSync(path.resolve('ai/references/coding-standards/typescript.md'), 'utf8');
    assert.ok(seed.includes('not active engineering policy'));
    assert.ok(seed.includes('## Testing'));
    for (const name of ['tech-spec', 'cloudflare-composition-root', 'effect-service-design', 'write-discoverable-code']) {
      const specialist = fs.readFileSync(path.join(projection, name, 'SKILL.md'), 'utf8');
      assert.ok(!specialist.includes('../coding-standards/'), `${name} must not depend on the retired policy skill`);
    }
    assert.ok(!spec.includes('Use the sibling TDD workflow'), 'missing upstream dependency is repaired');
    assert.ok(!fs.existsSync(path.join(projection, 'coding-standards')), 'plain reference material must not be installed as a skill');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('writing-for-agents retains the exact reviewed upstream files and original MIT notice', () => {
  // Dillon's bdf5e06 snapshot, plus Matt Pocock's LICENSE at 49dd158.
  const blobs = {
    'SKILL.md': '645088cb14b438f1cdc922dc2f279fd3a46f51be',
    'SKILL-MECHANICS.md': '9cdbdb22aadc438755392216e75ad9a14cc9832e',
    'agents/openai.yaml': '079c933b75743dec18b5d0c01006def20b6aad26',
    'LICENSE': 'f1dd2c09108dde1a5f56097cee8461b3ea834499',
  };
  for (const [file, expected] of Object.entries(blobs)) {
    const bytes = fs.readFileSync(path.resolve('ai/skills/writing-for-agents', file));
    const actual = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
    assert.equal(actual, expected, `${file} must remain unchanged from the reviewed source`);
  }
});

function skill(directory, name, body) {
  fs.mkdirSync(directory, { recursive: true });
  const file = path.join(directory, 'SKILL.md');
  fs.writeFileSync(file, `---\nname: ${name}\ndescription: ${name} fixture\n---\n${body}\n`);
  return file;
}

for (const location of ['repository', 'nested', 'external']) {
  test(`native skills select Pi projection in ${location} cwd without excluding other skills`, async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-native-skills-'));
    try {
      const repo = path.join(root, '.dotfiles');
      const agentDir = path.join(root, 'agent');
      const external = path.join(root, 'external');
      for (const dir of [path.join(repo, '.git'), path.join(repo, 'pi'), path.join(external, '.git'), agentDir]) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const piPath = skill(path.join(repo, '.ai-runtime/pi/skills/projection'), 'projection', 'Use /skill:projection');
      const codexPath = skill(path.join(repo, '.ai-runtime/codex/skills/projection'), 'projection', 'Use $projection');
      const alias = path.join(repo, '.agents/skills/projection');
      fs.mkdirSync(path.dirname(alias), { recursive: true });
      fs.symlinkSync(path.dirname(codexPath), alias, 'dir');
      const externalPath = skill(path.join(root, 'skills/tldraw-offline'), 'tldraw-offline', 'External skill');
      const cwd = location === 'repository' ? repo : location === 'nested' ? path.join(repo, 'pi') : external;
      const localPath = skill(path.join(cwd, '.pi/skills/local'), 'local', 'Local Pi skill');
      const otherPath = location === 'external'
        ? skill(path.join(external, '.agents/skills/other'), 'other', 'Unrelated Agent Skills resource') : undefined;
      const entries = settings.skills.map(entry => entry.replace(/^~\//, `${root}/`));
      async function load(skills) {
        const manager = SettingsManager.inMemory({ skills });
        manager.setProjectTrusted(true);
        const loader = new DefaultResourceLoader({ cwd, agentDir, settingsManager: manager,
          noExtensions: true, noPromptTemplates: true, noThemes: true });
        await loader.reload();
        return loader.getSkills();
      }
      // The original configuration must reproduce the bug, not just a synthetic warning.
      const baseline = await load(entries.filter(entry => !entry.includes('.agents/skills')));
      if (location !== 'external') {
        assert.equal(baseline.skills.find(s => s.name === 'projection')?.filePath, path.join(alias, 'SKILL.md'));
        assert.ok(baseline.diagnostics.some(d => d.type === 'collision'));
      }
      const result = await load(entries);
      assert.deepEqual(result.diagnostics, []);
      for (const [name, expected] of [['projection', piPath], ['tldraw-offline', externalPath], ['local', localPath], ...(otherPath ? [['other', otherPath]] : [])]) {
        assert.equal(result.skills.find(s => s.name === name)?.filePath, expected);
      }
      assert.equal(fs.readFileSync(result.skills.find(s => s.name === 'projection').filePath, 'utf8'), fs.readFileSync(piPath, 'utf8'));
      assert.match(fs.readFileSync(piPath, 'utf8'), /\/skill:projection/);
      assert.match(fs.readFileSync(codexPath, 'utf8'), /\$projection/);
      assert.equal(fs.realpathSync(alias), fs.realpathSync(path.dirname(codexPath)), 'Codex projection stays intact');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
}
