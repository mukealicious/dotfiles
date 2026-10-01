import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { DefaultResourceLoader, SettingsManager } from '@earendil-works/pi-coding-agent';
const { expandPromptTemplate } = await import(new URL('./core/prompt-templates.js', import.meta.resolve('@earendil-works/pi-coding-agent')));

test('native review prompt loads and expands without a checkout/fix-loop command', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-native-review-'));
  try {
    const loader = new DefaultResourceLoader({ cwd: root, agentDir: root, settingsManager: SettingsManager.inMemory({}),
      noExtensions: true, noSkills: true, noThemes: true,
      additionalPromptTemplatePaths: [path.resolve('pi/prompts/review.md')] });
    await loader.reload();
    const { prompts, diagnostics } = loader.getPrompts();
    assert.deepEqual(diagnostics, []);
    assert.equal(prompts.length, 1);
    assert.equal(prompts[0].name, 'review');
    const expanded = expandPromptTemplate('/review staged changes', prompts);
    assert.match(expanded, /Review staged changes using the code-review skill/);
    assert.match(expanded, /do not edit files, check out branches or PRs/);
    assert.match(expanded, /automatic review\/fix loop/);
    assert.match(expandPromptTemplate('/review', prompts), /current uncommitted changes/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
