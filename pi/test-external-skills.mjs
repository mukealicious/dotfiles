// Native package/global discovery in disposable homes. No live installs or model calls.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { createHash } from 'node:crypto';

const settings = JSON.parse(fs.readFileSync(new URL('./settings.json', import.meta.url)));
const source = process.env.MU_STACK_DIR || path.join(os.homedir(), 'Code/mu-stack');
const host = import.meta.resolve('@earendil-works/pi-coding-agent');

test('portable provenance, resources, and project-policy boundaries survive extraction', () => {
  const skills = path.join(source, 'skills');
  // Dillon's bdf5e06 snapshot, plus Matt Pocock's LICENSE at 49dd158.
  const blobs = {
    'SKILL.md': '645088cb14b438f1cdc922dc2f279fd3a46f51be',
    'SKILL-MECHANICS.md': '9cdbdb22aadc438755392216e75ad9a14cc9832e',
    'agents/openai.yaml': '079c933b75743dec18b5d0c01006def20b6aad26',
    'LICENSE': 'f1dd2c09108dde1a5f56097cee8461b3ea834499',
  };
  for (const [file, expected] of Object.entries(blobs)) {
    const bytes = fs.readFileSync(path.join(skills, 'writing-for-agents', file));
    assert.equal(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'), expected, file);
  }
  for (const file of ['write-discoverable-code/LICENSE', 'uncomplect/references/source-map.md', 'uncomplect/evals/trigger-evals.json', 'effect-service-design/references/AUDIT.md', 'effect-service-design/agents/openai.yaml', 'writing-for-agents/SKILL-MECHANICS.md', 'writing-for-agents/agents/openai.yaml', 'writing-for-agents/LICENSE', 'effect-service-design/LICENSE', 'tech-spec/LICENSE', 'herdr/references/workflows.md', 'mermaid/tools/validate.sh']) {
    assert.ok(fs.statSync(path.join(skills, file)).size > 0, file);
  }
  const spec = fs.readFileSync(path.join(skills, 'tech-spec/SKILL.md'), 'utf8');
  assert.ok(spec.includes("repository's testing policy"));
  assert.ok(!spec.includes('Use the sibling TDD workflow'));
  for (const name of ['tech-spec', 'effect-service-design', 'write-discoverable-code']) {
    assert.ok(!fs.readFileSync(path.join(skills, name, 'SKILL.md'), 'utf8').includes('../coding-standards/'));
  }
  for (const retired of ['diagnosing-bugs', 'coding-standards', 'mu-mode', 'mu-stack', 'rat-stack', 'tdd', 'domain-modeling', 'codebase-design', 'code-review', 'grill-with-docs', 'build-skill', 'agent-context', 'librarian', 'visual-deliverables', 'cloudflare-composition-root', 'prelude', 'bootstrap-prelude', 'upstream-review']) {
    assert.ok(!fs.existsSync(path.join(skills, retired)), retired);
  }
  const seed = fs.readFileSync(path.join(skills, 'project-guidance/references/coding-standards/typescript.md'), 'utf8');
  assert.ok(seed.includes('not active engineering policy'));
  assert.ok(seed.includes('## Testing'));
});

for (const location of ['repository', 'nested', 'external']) {
  test(`mu-stack package and global Codex links deduplicate in ${location} cwd`, () => {
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'mu-stack-discovery-')));
    try {
      const packageRoot = path.join(root, 'Code/mu-stack');
      fs.mkdirSync(packageRoot, { recursive: true });
      fs.copyFileSync(path.join(source, 'package.json'), path.join(packageRoot, 'package.json'));
      fs.cpSync(path.join(source, 'skills'), path.join(packageRoot, 'skills'), { recursive: true });
      const globalSkills = path.join(root, '.agents/skills');
      fs.mkdirSync(globalSkills, { recursive: true });
      const names = fs.readdirSync(path.join(packageRoot, 'skills')).sort();
      for (const name of names) fs.symlinkSync(path.join(packageRoot, 'skills', name), path.join(globalSkills, name));
      const repo = path.join(root, '.dotfiles');
      const external = path.join(root, 'external');
      for (const dir of [path.join(repo, '.git'), path.join(repo, 'pi'), path.join(external, '.git'), path.join(root, '.pi/agent')]) {
        fs.mkdirSync(dir, { recursive: true });
      }
      execFileSync(process.execPath, [path.resolve('ai/scripts/project-skills.mjs'), 'pi', path.resolve('ai/skills'), path.join(repo, '.ai-runtime/pi/skills')]);
      execFileSync(process.execPath, [path.resolve('ai/scripts/project-skills.mjs'), 'codex', path.resolve('ai/skills'), path.join(repo, '.ai-runtime/codex/skills')]);
      fs.mkdirSync(path.join(repo, '.agents/skills'), { recursive: true });
      for (const name of ['apple-reminders', 'dotfiles-dev']) {
        fs.symlinkSync(path.join(repo, '.ai-runtime/codex/skills', name), path.join(repo, '.agents/skills', name));
      }
      const tldraw = path.join(root, 'skills/tldraw-offline');
      fs.mkdirSync(tldraw, { recursive: true });
      fs.writeFileSync(path.join(tldraw, 'SKILL.md'), '---\nname: tldraw-offline\ndescription: External canvas fixture\n---\nCanvas guidance\n');
      const cwd = location === 'repository' ? repo : location === 'nested' ? path.join(repo, 'pi') : external;
      const selected = settings.packages.filter(entry => entry.source === '~/Code/mu-stack');
      assert.equal(selected.length, 1);
      const config = { skills: settings.skills, packages: selected };
      const result = execFileSync(process.execPath, ['--input-type=module', '-e', `
        import { DefaultResourceLoader, SettingsManager } from ${JSON.stringify(host)};
        const manager = SettingsManager.inMemory(${JSON.stringify(config)});
        manager.setProjectTrusted(true);
        const loader = new DefaultResourceLoader({ cwd: process.cwd(), agentDir: ${JSON.stringify(path.join(root, '.pi/agent'))},
          settingsManager: manager, noExtensions: true, noPromptTemplates: true, noThemes: true });
        await loader.reload();
        console.log(JSON.stringify(loader.getSkills()));
      `], { cwd, env: { ...process.env, HOME: root, PI_CODING_AGENT_DIR: path.join(root, '.pi/agent'), PI_OFFLINE: '1' }, encoding: 'utf8' });
      const discovered = JSON.parse(result);
      assert.deepEqual(discovered.diagnostics, []);
      assert.deepEqual(discovered.skills.map(skill => skill.name).sort(), [...names, 'apple-reminders', 'dotfiles-dev', 'tldraw-offline'].sort());
      for (const name of names) {
        const skill = discovered.skills.find(skill => skill.name === name);
        assert.equal(fs.realpathSync(skill.filePath), fs.realpathSync(path.join(packageRoot, 'skills', name, 'SKILL.md')));
      }
      assert.ok(!names.includes('upstream-review'));
      for (const name of ['tech-spec', 'writing-for-agents', 'write-discoverable-code', 'uncomplect', 'mu-design-eng', 'effect-service-design', 'project-guidance']) {
        const loaded = discovered.skills.find(skill => skill.name === name);
        assert.equal(loaded?.disableModelInvocation, !['effect-service-design', 'project-guidance'].includes(name), name);
        assert.ok(loaded.description.length > 20, 'native loader parses descriptions');
      }
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
}
