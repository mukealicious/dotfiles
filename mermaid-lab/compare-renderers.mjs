import { createServer } from 'node:http';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { chromium } from 'playwright-core';
import { rendererFixtures } from './fixtures.mjs';

const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
if (args.length && (args[0] !== '--vault' || args.length !== 2)) {
  throw new Error('Renderer comparison usage: node compare-renderers.mjs [--vault /absolute/vault]');
}
const cases = [...rendererFixtures];
if (args.length) {
  const root = resolve(args[1]);
  async function collectVaultDiagrams(directory) {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name.startsWith('.') || ['node_modules', 'assets'].includes(entry.name)) continue;
      const file = join(directory, entry.name);
      if (entry.isDirectory()) await collectVaultDiagrams(file);
      else if (entry.isFile() && entry.name.endsWith('.md')) {
        const lines = (await readFile(file, 'utf8')).split(/\r?\n/);
        let fence = null;
        let source = [];
        for (let line = 0; line < lines.length; line++) {
          if (!fence) {
            const opening = lines[line].match(/^\s{0,3}(`{3,}|~{3,})mermaid\s*$/);
            if (opening) fence = { marker: opening[1][0], length: opening[1].length, line: line + 1 };
          } else if (new RegExp(`^\\s{0,3}${fence.marker}{${fence.length},}\\s*$`).test(lines[line])) {
            cases.push({ id: `vault-${cases.length - rendererFixtures.length + 1}`, file, line: fence.line, source: source.join('\n') });
            fence = null;
            source = [];
          } else source.push(lines[line]);
        }
      }
    }
  }
  await collectVaultDiagrams(root);
}

const peleCode = await readFile(require.resolve('pele/global'));
const mermaidCode = await readFile(join(dirname(require.resolve('mermaid/package.json')), 'dist/mermaid.min.js'));
const routes = {
  '/': ['text/html', '<!doctype html><meta charset="utf-8"><div id="host" style="width:1000px;font-family:Arial"></div><script src="/pele.js"></script><script src="/mermaid.js"></script>'],
  '/pele.js': ['text/javascript', peleCode],
  '/mermaid.js': ['text/javascript', mermaidCode],
};
const server = createServer((request, response) => {
  const route = routes[request.url];
  if (!route) return response.writeHead(404).end();
  response.writeHead(200, {
    'content-type': route[0],
    'content-security-policy': "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; img-src 'none'; connect-src 'none'; font-src 'none'",
  }).end(route[1]);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const origin = `http://127.0.0.1:${server.address().port}`;
  const blockedRequests = [];
  await context.route('**/*', (route) => {
    if (route.request().url().startsWith(origin + '/')) return route.continue();
    blockedRequests.push(route.request().url());
    return route.abort();
  });
  const page = await context.newPage();
  await page.goto(origin);
  await page.evaluate(() => mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', suppressErrorRendering: true }));
  const results = [];
  for (const fixture of cases) {
    const result = await page.evaluate(async ({ source }) => {
      const host = document.getElementById('host');
      let id = 0;
      const draw = {
        pele: () => pele.render(source, { links: false, images: false, maxEdges: 500, idPrefix: 'comparison', now: new Date('2026-10-24T12:00:00Z') }).svg,
        mermaid: async () => (await mermaid.render(`mermaid-${id++}`, source)).svg,
      };
      const engines = {};
      for (const engine of ['pele', 'mermaid']) {
        try {
          const svg = await draw[engine]();
          host.innerHTML = svg;
          const element = host.querySelector('svg');
          const box = element.getBoundingClientRect();
          const clone = element.cloneNode(true);
          clone.querySelectorAll('style,title,desc').forEach((node) => node.remove());
          engines[engine] = { ok: true, bytes: new TextEncoder().encode(svg).length, width: box.width, height: box.height, text: clone.textContent.replace(/\s+/g, ' ').trim() };
        } catch (error) { engines[engine] = { ok: false, error: error.message }; }
      }
      if (engines.pele.ok && engines.mermaid.ok) {
        const times = { pele: [], mermaid: [] };
        for (let pass = 0; pass < 5; pass++) {
          for (const engine of pass % 2 ? ['mermaid', 'pele'] : ['pele', 'mermaid']) {
            // Match render + SVG insertion + browser layout. Exclude imports and startup.
            const repetitions = engine === 'pele' ? 30 : 1;
            const start = performance.now();
            for (let i = 0; i < repetitions; i++) {
              host.innerHTML = await draw[engine]();
              host.firstElementChild.getBoundingClientRect();
            }
            times[engine].push((performance.now() - start) / repetitions);
          }
        }
        for (const engine of ['pele', 'mermaid']) engines[engine].medianMs = times[engine].sort((a, b) => a - b)[2];
      }
      return engines;
    }, { source: fixture.source });
    results.push({ id: fixture.id, file: fixture.file, line: fixture.line, ...result });
    console.log(`${fixture.id}: Pele ${result.pele.ok ? 'OK' : 'FAIL'}, Mermaid ${result.mermaid.ok ? 'OK' : 'FAIL'}`);
  }
  const responsive = await page.evaluate(async ({ source }) => {
    const host = document.getElementById('host');
    const mounted = pele.mount(host, source, { links: false, images: false });
    const measurements = [];
    for (const width of [1000, 320, 1000]) {
      host.style.width = `${width}px`;
      await new Promise((resolve) => setTimeout(resolve, 150));
      const svg = host.querySelector('svg');
      measurements.push({ container: width, svgWidth: svg.getBoundingClientRect().width, viewBox: svg.getAttribute('viewBox'), text: svg.textContent });
    }
    mounted.destroy();
    return measurements;
  }, rendererFixtures[0]);
  const report = {
    at: new Date().toISOString(), node: process.version, chrome: browser.version(), platform: process.platform, arch: process.arch,
    packages: { pele: '1.10.0', mermaid: '12.1.0' },
    method: '5 alternating passes; median per diagram; Pele 30 repetitions, Mermaid 1; render + insert + layout; warm imports; both-success cases only',
    bundles: { pele: { bytes: peleCode.length, gzip: gzipSync(peleCode).length }, mermaid: { bytes: mermaidCode.length, gzip: gzipSync(mermaidCode).length } },
    blockedRequests, responsive, results,
  };
  await mkdir(new URL('./results/', import.meta.url), { recursive: true, mode: 0o700 });
  await writeFile(new URL('./results/comparison.json', import.meta.url), JSON.stringify(report, null, 2) + '\n', { mode: 0o600 });
  console.log(`Compared ${cases.length} diagrams. Private local report: mermaid-lab/results/comparison.json`);
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
