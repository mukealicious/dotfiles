#!/usr/bin/env node
/** One-time, local migration. Originals remain available for rollback.
 * Run before ai/install.sh and pi/install.sh. Never prints configuration values.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const home = os.homedir();
const base = path.join(home, '.pi');
const target = path.join(base, 'agent');
const marker = path.join(target, '.native-consolidation.json');
const readJson = (file, fallback = {}) => {
  if (!fs.existsSync(file)) return fallback;
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { throw new Error(`Cannot read valid JSON from ${file}`); }
};
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const writeJson = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
};

function mergeTree(source, destination) {
  if (!fs.existsSync(source)) return;
  const stat = fs.lstatSync(source);
  if (stat.isSymbolicLink()) {
    // Sessions must be self-contained, not links into mutable old profiles.
    throw new Error(`Cannot merge symlink: ${source}`);
  }
  if (stat.isDirectory()) {
    fs.mkdirSync(destination, { recursive: true, mode: 0o700 });
    for (const name of fs.readdirSync(source)) {
      // Cleanup timestamps are disposable cache state, not conversation history.
      if (path.basename(source) === 'subagent-artifacts' && name === '.last-cleanup') continue;
      mergeTree(path.join(source, name), path.join(destination, name));
    }
  } else if (stat.isFile()) {
    if (fs.existsSync(destination)) {
      if (!fs.readFileSync(source).equals(fs.readFileSync(destination))) throw new Error(`Conflicting preserved file: ${destination}`);
    } else {
      fs.mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 });
      fs.copyFileSync(source, destination, fs.constants.COPYFILE_FICLONE);
      fs.chmodSync(destination, 0o600);
    }
  } else throw new Error(`Unsupported preserved entry: ${source}`);
}

function convertServer(name, config) {
  if (!object(config)) throw new Error(`Invalid MCP server: ${name}`);
  const supported = new Set(['url', 'command', 'args', 'env', 'cwd', 'headers', 'oauth', 'auth', 'bearerToken', 'type', 'timeout', 'enabled', 'exposure', 'toolExposure']);
  if (Object.keys(config).some(key => !supported.has(key))) throw new Error(`MCP server ${name} has adapter options requiring manual conversion`);
  const { auth, bearerToken, ...native } = config;
  if (auth && !['oauth', 'bearer'].includes(auth)) throw new Error(`Unsupported MCP authentication for ${name}`);
  if (auth === 'bearer') {
    if (typeof bearerToken !== 'string' || !bearerToken) throw new Error(`Missing bearer credential for ${name}`);
    if (native.headers?.Authorization) throw new Error(`Conflicting Authorization header for ${name}`);
    // A command must print the entire header. Preserve command failure.
    const header = bearerToken.startsWith('!')
      ? `!token=$(${bearerToken.slice(1)}) && test -n "$token" && printf 'Bearer %s' "$token"`
      : `Bearer ${bearerToken}`;
    native.headers = { ...native.headers, Authorization: header };
  } else if (bearerToken !== undefined) throw new Error(`Unexpected bearer credential for ${name}`);
  if (native.type === 'sse') throw new Error(`Legacy SSE needs a new endpoint for ${name}`);
  if (!native.url && !native.command) throw new Error(`Missing MCP transport for ${name}`);
  return native;
}

if (fs.existsSync(marker)) {
  console.log('Native Pi consolidation already completed; nothing changed.');
  process.exit(0);
}
fs.mkdirSync(base, { recursive: true });
const stage = fs.mkdtempSync(path.join(base, '.native-stage-'));
fs.chmodSync(stage, 0o700);
let backup;
try {
  const sources = ['agent', 'work', 'personal'].map(name => path.join(base, name));
  // Histories and their adjacent handoff/artifact files are copied verbatim.
  for (const source of sources) mergeTree(path.join(source, 'sessions'), path.join(stage, 'sessions'));

  // Keep native user configuration verbatim. Conflicting files require a
  // one-time manual choice; do not invent a merge policy for model settings.
  for (const name of ['models.json', 'keybindings.json']) {
    for (const source of sources) mergeTree(path.join(source, name), path.join(stage, name));
  }

  // Preserve custom resources, but regenerate managed resources and Herdr.
  const fastSource = sources.toReversed().find(source => fs.existsSync(path.join(source, 'extensions/pi-openai-fast.json')));
  for (const folder of ['agents', 'skills', 'themes', 'extensions', 'prompts']) {
    for (const source of sources) {
      const directory = path.join(source, folder);
      if (!fs.existsSync(directory)) continue;
      if (fs.lstatSync(directory).isSymbolicLink()) throw new Error(`Resource directory needs manual migration: ${directory}`);
      for (const name of fs.readdirSync(directory)) {
        const file = path.join(directory, name);
        if (folder === 'extensions' && name === 'herdr-agent-state.ts') continue;
        // The canonical app-managed skill is already selected by settings.
        if (folder === 'skills' && name === 'tldraw-offline' && fs.existsSync(path.join(home, 'skills/tldraw-offline/SKILL.md'))) continue;
        const stat = fs.lstatSync(file);
        if (stat.isSymbolicLink()) {
          const link = fs.readlinkSync(file);
          if (link.startsWith(`${root}/pi/`) || link.startsWith(`${root}/.ai-runtime/pi/`)) continue;
          throw new Error(`Custom resource symlink needs manual migration: ${file}`);
        }
        if (folder === 'agents' && name.endsWith('.md') && fs.readFileSync(file, 'utf8').includes('# Managed by ~/.dotfiles/ai/install.sh.')) continue;
        // Personal wins when present, otherwise work then the old agent directory.
        if (folder === 'extensions' && name === 'pi-openai-fast.json' && source !== fastSource) continue;
        mergeTree(file, path.join(stage, folder, name));
      }
    }
  }

  const settings = readJson(path.join(root, 'pi/settings.json'));
  // Same resource ownership as the installer, with explicit provider/trust cutover.
  // Preference precedence is personal > work > old agent > tracked defaults.
  const managedKeys = new Set(['packages', 'skills', 'extensions', 'prompts', 'themes', 'defaultTools', 'defaultProjectTrust']);
  for (const source of sources) {
    const preferences = readJson(path.join(source, 'settings.json'));
    if (!object(preferences)) throw new Error(`Invalid settings object: ${source}`);
    const retiredProvider = typeof preferences.defaultProvider === 'string' && preferences.defaultProvider.startsWith('openai-codex');
    for (const [key, value] of Object.entries(preferences)) {
      if (managedKeys.has(key)) continue;
      // Do not reinterpret a retired provider/model pair as native OpenAI.
      if (retiredProvider && ['defaultProvider', 'defaultModel'].includes(key)) continue;
      settings[key] = value;
    }
  }
  writeJson(path.join(stage, 'settings.json'), settings);

  // Never relabel legacy OAuth credentials or activate a stored OpenAI API key.
  const credentials = {};
  for (const source of sources) {
    for (const [provider, credential] of Object.entries(readJson(path.join(source, 'auth.json')))) {
      if (provider === 'openai-codex' || provider.startsWith('openai-codex-')) continue;
      if (provider === 'openai' && credential.type !== 'oauth') continue;
      credentials[provider] = credential;
    }
  }
  writeJson(path.join(stage, 'auth.json'), credentials);

  const servers = {};
  const configFiles = [
    path.join(home, '.config/mcp/mcp.json'),
    path.join(base, 'work/mcp-adapter.json'), path.join(base, 'work/mcp.json'),
    path.join(base, 'personal/mcp-adapter.json'), path.join(base, 'personal/mcp.json'),
    path.join(target, 'mcp.json'),
  ];
  for (const file of configFiles) {
    const config = readJson(file);
    if (Object.keys(config).some(key => key !== 'mcpServers')) throw new Error(`MCP top-level options need manual migration: ${file}`);
    if (!object(config.mcpServers ?? {})) throw new Error(`Invalid MCP configuration: ${file}`);
    for (const [name, server] of Object.entries(config.mcpServers ?? {})) {
      if (name === 'mobbin-work') continue; // One account per URL; personal is the selected account.
      const nativeName = name === 'mobbin-personal' ? 'mobbin' : name;
      const native = convertServer(nativeName, server);
      if (servers[nativeName] && JSON.stringify(servers[nativeName]) !== JSON.stringify(native)) throw new Error(`Conflicting MCP server: ${nativeName}`);
      servers[nativeName] = native;
    }
  }
  writeJson(path.join(stage, 'mcp.json'), { mcpServers: servers });
  // Trust is not broadened by unioning historical approvals; Pi asks again.
  writeJson(path.join(stage, '.native-consolidation.json'), { version: 1, migratedAt: new Date().toISOString(), sources });

  if (fs.existsSync(target)) {
    backup = `${target}.before-native-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    fs.renameSync(target, backup);
  }
  try { fs.renameSync(stage, target); }
  catch (error) {
    if (backup) fs.renameSync(backup, target);
    throw error;
  }
  console.log(`Consolidated Pi into ${target}.`);
  if (backup) console.log(`Previous agent directory preserved at ${backup}.`);
  console.log('Work and personal originals remain untouched. Run ai/install.sh, pi/install.sh, then sign in through /login openai and /mcp.');
} catch (error) {
  fs.rmSync(stage, { recursive: true, force: true });
  console.error(`Migration stopped; original profiles preserved. ${error.message}`);
  process.exitCode = 1;
}
