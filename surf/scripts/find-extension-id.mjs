#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const browser = process.argv[2];
const extensionPathArg = process.argv[3] || '';
const browserRootArg = process.argv[4] || '';

const browsers = {
  brave: {
    label: 'Brave',
    env: 'SURF_BRAVE_EXTENSION_ID',
    altEnv: 'SURF_EXTENSION_ID_BRAVE',
    darwinRoot: ['Library', 'Application Support', 'BraveSoftware', 'Brave-Browser'],
    linuxRoot: ['.config', 'BraveSoftware', 'Brave-Browser'],
  },
  edge: {
    label: 'Microsoft Edge',
    env: 'SURF_EDGE_EXTENSION_ID',
    altEnv: 'SURF_EXTENSION_ID_EDGE',
    darwinRoot: ['Library', 'Application Support', 'Microsoft Edge'],
    linuxRoot: ['.config', 'microsoft-edge'],
  },
};

const config = browsers[browser];
if (!config) {
  console.error('Usage: find-extension-id.mjs <brave|edge> [surf-extension-path] [browser-root]');
  process.exit(64);
}

const extensionIdPattern = /^[a-p]{32}$/;

function validateOverride(name, value) {
  if (!value) return null;
  if (!extensionIdPattern.test(value)) {
    console.error(`${name} is not a valid Chromium extension ID: ${value}`);
    process.exit(2);
  }
  return value;
}

const override =
  validateOverride(config.env, process.env[config.env]) ||
  validateOverride(config.altEnv, process.env[config.altEnv]);

if (override) {
  console.log(override);
  process.exit(0);
}

function browserRoot() {
  if (browserRootArg) return realish(browserRootArg);
  const parts = process.platform === 'linux' ? config.linuxRoot : config.darwinRoot;
  return path.join(os.homedir(), ...parts);
}

function realish(filePath) {
  if (!filePath) return '';
  try {
    return fs.realpathSync(filePath);
  } catch {
    return path.resolve(filePath);
  }
}

function comparable(filePath) {
  const normalized = realish(filePath);
  return process.platform === 'darwin' ? normalized.toLowerCase() : normalized;
}

const expectedExtensionPath = extensionPathArg ? comparable(extensionPathArg) : '';

function pathMatchesSurf(setting) {
  if (!expectedExtensionPath || !setting || !setting.path) return false;
  return comparable(setting.path) === expectedExtensionPath;
}

function manifestLooksLikeSurf(manifest) {
  if (!manifest || typeof manifest !== 'object') return false;

  const name = String(manifest.name || manifest.short_name || '');
  const description = String(manifest.description || '');

  return (
    name === 'Surf' ||
    description.includes('Browser automation CLI for AI agents') ||
    description.includes('AI agents to control Chrome')
  );
}

function readJson(jsonPath) {
  try {
    return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch {
    return null;
  }
}

function collectFromPreferences(root) {
  const candidates = [];
  let entries = [];

  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return candidates;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const profileDir = path.join(root, entry.name);
    for (const prefName of ['Preferences', 'Secure Preferences']) {
      const prefPath = path.join(profileDir, prefName);
      if (!fs.existsSync(prefPath)) continue;

      const prefs = readJson(prefPath);
      const settings = prefs?.extensions?.settings;
      if (!settings || typeof settings !== 'object') continue;

      for (const [id, setting] of Object.entries(settings)) {
        if (!extensionIdPattern.test(id)) continue;

        const reasons = [];
        if (pathMatchesSurf(setting)) reasons.push('path');
        if (manifestLooksLikeSurf(setting?.manifest)) reasons.push('manifest');

        if (reasons.length > 0) {
          candidates.push({ id, profile: entry.name, source: prefName, reasons });
        }
      }
    }
  }

  return candidates;
}

function collectFromInstalledExtensionManifests(root) {
  const candidates = [];
  let profiles = [];
  try {
    profiles = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return candidates;
  }

  for (const profileEntry of profiles) {
    if (!profileEntry.isDirectory()) continue;

    const extensionsRoot = path.join(root, profileEntry.name, 'Extensions');
    let ids = [];
    try {
      ids = fs.readdirSync(extensionsRoot, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const idEntry of ids) {
      if (!idEntry.isDirectory() || !extensionIdPattern.test(idEntry.name)) continue;

      const idDir = path.join(extensionsRoot, idEntry.name);
      let versions = [];
      try {
        versions = fs.readdirSync(idDir, { withFileTypes: true });
      } catch {
        continue;
      }

      for (const versionEntry of versions) {
        if (!versionEntry.isDirectory()) continue;
        const manifest = readJson(path.join(idDir, versionEntry.name, 'manifest.json'));
        if (manifestLooksLikeSurf(manifest)) {
          candidates.push({
            id: idEntry.name,
            profile: profileEntry.name,
            source: versionEntry.name,
            reasons: ['installed-manifest'],
          });
        }
      }
    }
  }

  return candidates;
}

const root = browserRoot();
let candidates = [
  ...collectFromPreferences(root),
  ...collectFromInstalledExtensionManifests(root),
];

const pathCandidates = candidates.filter((candidate) => candidate.reasons.includes('path'));
if (pathCandidates.length > 0) candidates = pathCandidates;

const byId = new Map();
for (const candidate of candidates) {
  if (!byId.has(candidate.id)) byId.set(candidate.id, []);
  byId.get(candidate.id).push(candidate);
}

const ids = [...byId.keys()];

if (ids.length === 1) {
  console.log(ids[0]);
  process.exit(0);
}

if (ids.length > 1) {
  console.error(`Found multiple Surf extension IDs in ${config.label}; set ${config.env} explicitly.`);
  for (const id of ids) {
    const places = byId
      .get(id)
      .map((candidate) => `${candidate.profile}/${candidate.source}:${candidate.reasons.join('+')}`)
      .join(', ');
    console.error(`  ${id} (${places})`);
  }
  process.exit(3);
}

console.error(`Could not find the Surf extension ID in ${config.label}.`);
if (extensionPathArg) {
  console.error('Load the unpacked Surf extension from:');
  console.error(`  ${extensionPathArg}`);
}
console.error(`Then rerun surf/install.sh, or set ${config.env}=<extension-id> for this run.`);
process.exit(1);
