#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const IMPECCABLE_COMMAND_HINT =
  'craft|shape · audit|critique · animate|bolder|colorize|delight|layout|overdrive|quieter|typeset · adapt|clarify|distill · harden|onboard|optimize|polish · teach|document|extract|live';

const PROVIDER_PLACEHOLDERS = {
  'claude-code': {
    model: 'Claude',
    config_file: 'CLAUDE.md',
    ask_instruction: 'STOP and call the AskUserQuestion tool to clarify.',
    command_prefix: '/',
    command_hint: IMPECCABLE_COMMAND_HINT,
  },
  codex: {
    model: 'GPT',
    config_file: 'AGENTS.md',
    ask_instruction: 'ask the user directly to clarify what you cannot infer.',
    command_prefix: '$',
    command_hint: IMPECCABLE_COMMAND_HINT,
  },
  opencode: {
    model: 'Claude',
    config_file: 'AGENTS.md',
    ask_instruction: 'STOP and call the `question` tool to clarify.',
    command_prefix: '/',
    command_hint: IMPECCABLE_COMMAND_HINT,
  },
  pi: {
    model: 'the model',
    config_file: 'AGENTS.md',
    ask_instruction: 'ask the user directly to clarify what you cannot infer.',
    command_prefix: '/',
    command_hint: IMPECCABLE_COMMAND_HINT,
  },
};

const EXCLUDED_FROM_SUGGESTIONS = new Set();

function usage() {
  console.error('Usage: project-skills.mjs <provider> <source-dir> <target-dir>');
  process.exit(1);
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return {};
  }

  const frontmatter = {};
  for (const line of match[1].split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, colonIndex).trim();
    let value = trimmed.slice(colonIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    frontmatter[key] = value;
  }

  return frontmatter;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replacePlaceholders(content, provider, commandNames, allSkillNames, extra = {}) {
  const placeholders = PROVIDER_PLACEHOLDERS[provider];
  const commandPrefix = placeholders.command_prefix;
  const availableCommands = extra.availableCommands || commandNames
    .filter((name) => !EXCLUDED_FROM_SUGGESTIONS.has(name))
    .map((name) => `${commandPrefix}${name}`)
    .join(', ');

  let result = content
    .replace(/\{\{model\}\}/g, placeholders.model)
    .replace(/\{\{config_file\}\}/g, placeholders.config_file)
    .replace(/\{\{ask_instruction\}\}/g, placeholders.ask_instruction)
    .replace(/\{\{command_prefix\}\}/g, commandPrefix)
    .replace(/\{\{command_hint\}\}/g, placeholders.command_hint || '')
    .replace(/\{\{available_commands\}\}/g, availableCommands);

  if (commandPrefix !== '/') {
    const sortedSkillNames = [...allSkillNames].sort((left, right) => right.length - left.length);
    for (const skillName of sortedSkillNames) {
      result = result.replace(
        new RegExp(`\\/(?=${escapeRegex(skillName)}(?:[^a-zA-Z0-9_-]|$))`, 'g'),
        commandPrefix,
      );
    }
  }

  result = result.replace(/\{\{scripts_path\}\}/g, extra.scriptsPath || '{{scripts_path}}');

  return result;
}

function copyDirectoryRecursive(sourceDir, targetDir, transformText) {
  fs.mkdirSync(targetDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectoryRecursive(sourcePath, targetPath, transformText);
      continue;
    }

    if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mjs'))) {
      const content = fs.readFileSync(sourcePath, 'utf8');
      fs.writeFileSync(targetPath, transformText(content), 'utf8');
      continue;
    }

    fs.copyFileSync(sourcePath, targetPath);
  }
}

const [, , provider, sourceDir, targetDir] = process.argv;
if (!provider || !sourceDir || !targetDir) {
  usage();
}

if (!PROVIDER_PLACEHOLDERS[provider]) {
  console.error(`Unknown provider: ${provider}`);
  process.exit(1);
}

if (!fs.existsSync(sourceDir)) {
  console.error(`Source directory does not exist: ${sourceDir}`);
  process.exit(1);
}

const skillDirs = fs.readdirSync(sourceDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const skillInfo = skillDirs.map((skillName) => {
  const skillPath = path.join(sourceDir, skillName, 'SKILL.md');
  const frontmatter = parseFrontmatter(fs.readFileSync(skillPath, 'utf8'));
  return {
    dirName: skillName,
    name: frontmatter.name || skillName,
    userInvocable: frontmatter['user-invocable'] === 'true',
  };
});

const allSkillNames = skillInfo.map((skill) => skill.name);
const commandNames = skillInfo.filter((skill) => skill.userInvocable).map((skill) => skill.name);

function impeccableSubcommands(skillSourceDir, provider) {
  const metadataPath = path.join(skillSourceDir, 'scripts', 'command-metadata.json');
  if (!fs.existsSync(metadataPath)) {
    return null;
  }

  const commandPrefix = PROVIDER_PLACEHOLDERS[provider].command_prefix;
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  return Object.keys(metadata)
    .map((command) => `${commandPrefix}impeccable ${command}`)
    .join(', ');
}

fs.rmSync(targetDir, { recursive: true, force: true });
fs.mkdirSync(targetDir, { recursive: true });

for (const skill of skillInfo) {
  const projectedSkillDir = path.join(targetDir, skill.dirName);
  const sourceSkillDir = path.join(sourceDir, skill.dirName);
  copyDirectoryRecursive(
    sourceSkillDir,
    projectedSkillDir,
    (content) => replacePlaceholders(content, provider, commandNames, allSkillNames, {
      availableCommands: skill.name === 'impeccable' ? impeccableSubcommands(sourceSkillDir, provider) : undefined,
      scriptsPath: path.resolve(projectedSkillDir, 'scripts'),
    }),
  );
}
