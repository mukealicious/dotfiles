import { Worker } from 'node:worker_threads';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

/** Render a local Pele preview with fixed safety options and a worker time limit. */
export function renderPeleSvg(source, width = 800) {
  if (typeof source !== 'string' || source.length > 50_000) {
    return Promise.reject(new Error('Pele preview source must be text of at most 50000 characters.'));
  }
  if (!Number.isInteger(width) || width < 200 || width > 2400) {
    return Promise.reject(new Error('Pele preview width must be an integer from 200 to 2400.'));
  }
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./render-worker.mjs', import.meta.url), { workerData: { source, width } });
    let settled = false;
    const finish = (error, svg) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      void worker.terminate();
      if (error) reject(error);
      else resolve(svg);
    };
    const timer = setTimeout(() => finish(new Error('Pele preview exceeded the 5 second worker time limit.')), 5000);
    worker.once('message', (result) => finish(result.error ? new Error(result.error) : null, result.svg));
    worker.once('error', (error) => finish(error));
    worker.once('exit', () => {
      if (!settled) finish(new Error('Pele preview worker stopped before completion.'));
    });
  });
}

async function renderPeleFile(args) {
  if (args.length < 2 || args.length > 3) {
    throw new Error('Pele preview usage: node render-pele.mjs input.mmd new-output.svg [width]');
  }
  const [input, output, width = '800'] = args;
  if ((await stat(input)).size > 200_000) throw new Error('Pele preview input exceeds 200000 bytes.');
  const svg = await renderPeleSvg(await readFile(input, 'utf8'), Number(width));
  await writeFile(output, svg, { flag: 'wx', mode: 0o600 });
  console.log('Pele preview created. This is not official Mermaid validation.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  renderPeleFile(process.argv.slice(2)).catch((error) => {
    console.error('Pele preview failed:', error.message);
    process.exitCode = 1;
  });
}
