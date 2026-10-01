// Installed native discovery/filtering, including symlink projections; no model calls.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { DefaultResourceLoader, SettingsManager } from '@earendil-works/pi-coding-agent';

const settings = JSON.parse(fs.readFileSync(new URL('./settings.json', import.meta.url), 'utf8'));

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
