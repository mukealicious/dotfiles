import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright-core';
import { rendererFixtures } from './fixtures.mjs';

const require = createRequire(import.meta.url);
const escapeHtml = (text) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
try {
  const context = await browser.newContext();
  await context.route('**/*', (route) => route.abort());
  const page = await context.newPage();
  await page.setContent('<div id="host"></div>');
  await page.addScriptTag({ content: await readFile(require.resolve('pele/global'), 'utf8') });
  await page.addScriptTag({ content: await readFile(join(dirname(require.resolve('mermaid/package.json')), 'dist/mermaid.min.js'), 'utf8') });
  await page.evaluate(() => mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' }));
  const sections = [];
  for (const fixture of rendererFixtures.filter((fixture) => ['flowchart', 'subgraph', 'math'].includes(fixture.id))) {
    for (const width of [960, 320]) {
      const snapshots = await page.evaluate(async ({ fixture, width }) => {
        const host = document.getElementById('host');
        host.style.width = `${width}px`;
        host.style.fontFamily = 'Arial, sans-serif';
        const mounted = pele.mount(host, fixture.source, { links: false, images: false, idPrefix: `pele-${fixture.id}-${width}` });
        await new Promise((resolve) => setTimeout(resolve, 100));
        const peleSvg = host.querySelector('svg').outerHTML;
        mounted.destroy();
        const { svg: mermaidSvg } = await mermaid.render(`mermaid-${fixture.id}-${width}`, fixture.source);
        return { peleSvg, mermaidSvg };
      }, { fixture, width });
      sections.push(`<section><h2>${escapeHtml(fixture.id)} · ${width}px container</h2><div class="pair"><figure><figcaption>Pele 1.10.0</figcaption><div style="max-width:${width}px">${snapshots.peleSvg}</div></figure><figure><figcaption>Mermaid 12.1.0</figcaption><div style="max-width:${width}px">${snapshots.mermaidSvg}</div></figure></div><details><summary>Mermaid source</summary><pre>${escapeHtml(fixture.source)}</pre></details></section>`);
    }
  }
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:"><title>Pele compatibility lab</title><style>
:root{color:oklch(25% .008 70);background:oklch(98% .007 80);font:16px/1.55 system-ui,sans-serif}body{margin:0;padding:24px}main{max-width:1200px;margin:auto}header{max-width:70ch;margin-bottom:48px}h1{font-size:2rem;line-height:1.15}h2{font-size:1.25rem}section{border-top:1px solid oklch(82% .01 70);padding:24px 0}.pair{display:grid;grid-template-columns:1fr 1fr;gap:24px}figure{margin:0;min-width:0;overflow:auto}figcaption{font-weight:650;margin-bottom:16px}svg{max-width:100%;height:auto}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:.875rem}summary{cursor:pointer;padding:12px 0}summary:focus-visible{outline:2px solid oklch(45% .1 160)}p{max-width:70ch}@media(max-width:700px){body{padding:20px}.pair{grid-template-columns:1fr;gap:28px}}
</style></head><body><main><header><p>ADOPTION LAB · 24 OCTOBER 2026</p><h1>Same syntax. Different renderer.</h1><p>Public synthetic inputs only. The October 24 run rendered all 39 vault diagrams and 14 synthetic diagrams in both engines. This does not prove identical meaning or layout.</p><p>The flowchart changes direction at 320px. The subgraph keeps its own direction in Pele. Math needs a trusted typesetter in Pele; the default shows the source.</p><p>These are static snapshots at the stated container widths. They do not rerun layout when this page resizes. No library, font, or private note is loaded.</p></header>${sections.join('\n')}</main></body></html>`;
  await mkdir(new URL('./results/', import.meta.url), { recursive: true, mode: 0o700 });
  await writeFile(new URL('./results/public-gallery.html', import.meta.url), html, { mode: 0o600 });
  console.log('Public synthetic gallery: mermaid-lab/results/public-gallery.html');
} finally { await browser.close(); }
