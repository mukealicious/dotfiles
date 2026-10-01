// One-time, explicit retirement of the old dotfiles Astra priority policy.
// Not part of normal installation: future user model overrides remain user-owned.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function retireAstraPriority(modelsPath) {
  let stat;
  try { stat = fs.lstatSync(modelsPath); }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
  if (!stat.isFile()) throw new Error('Refusing non-regular models.json; resolve ownership first');
  const original = fs.readFileSync(modelsPath);
  const config = JSON.parse(original.toString('utf8'));
  const params = config?.providers?.openai?.modelOverrides?.['gpt-6-astra']?.samplingParams;
  if (params?.service_tier !== 'priority') return false;
  delete params.service_tier;
  // Keep all other fields, including empty containers, rather than pruning user data.
  const backup = `${modelsPath}.before-fast-only`;
  fs.writeFileSync(backup, original, { flag: 'wx', mode: 0o600 });
  const staging = fs.mkdtempSync(`${modelsPath}.fast-only-`);
  const temporary = path.join(staging, 'models.json');
  try {
    fs.writeFileSync(temporary, `${JSON.stringify(config, null, 2)}\n`, { flag: 'wx', mode: stat.mode & 0o777 });
    if (!fs.readFileSync(modelsPath).equals(original)) {
      throw new Error('models.json changed during retirement; backup preserved, retry after inspection');
    }
    fs.renameSync(temporary, modelsPath);
  } finally {
    fs.rmSync(staging, { recursive: true, force: true });
  }
  return true;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 3 || !path.isAbsolute(process.argv[2])) {
    throw new Error('Usage: node pi/retire-astra-priority.mjs /absolute/path/to/models.json');
  }
  console.log(retireAstraPriority(process.argv[2])
    ? 'Retired Astra priority override; original models.json preserved in .before-fast-only backup.'
    : 'No legacy Astra priority override to retire.');
}
