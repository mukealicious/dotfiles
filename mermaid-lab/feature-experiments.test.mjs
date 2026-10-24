import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';
import katex from 'katex';
import { render } from 'pele';

// Creator updates: 2113990622168367440 and 2113610353385120110.
// This file contains only synthetic inputs, never private vault diagrams.
const typographyFixtures = [
  ['flowchart', 'flowchart LR\n A["Capture a useful source"] --> B["Review a very long label with Živjo 🌋 and inline <code>identifier</code>"] --> C["Connect the next idea"]'],
  ['subgraphs', 'flowchart LR\n subgraph Local[Local processing]\n direction TB\n A[Input] --> B[Review]\n end\n subgraph Output[Result storage]\n C[Save] --> D[Connect]\n end\n B --> C\n A --> D'],
  ['sequence', 'sequenceDiagram\n participant A as Reader on a phone\n participant B as Local renderer\n participant C as Knowledge store\n A->>B: Render a long technical label with Živjo 🌋\n B->>C: Save the local result\n C-->>A: Ready to review'],
];

const richSource = 'flowchart TD\n A["H<sub>2</sub>O and x<sup>2</sup><br/><code>inline code</code> <kbd>Ctrl</kbd><br/><u>underline</u> <ins>inserted</ins> <cite>citation</cite>"]';
const sankeySource = 'sankey\nCapture,Review,8\nReview,Keep,6\nReview,Archive,2';
const escapeHtml = (text) => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

test('Pele creator-update experiments: typography, rich labels, math, gradients', async (t) => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const measurements = [];
  const additional = {};
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const requests = [];
    await context.route('**/*', (route) => { requests.push(route.request().url()); return route.abort(); });
    const page = await context.newPage();
    await page.setContent('<div id="host" style="font-family:Arial,sans-serif"></div>');
    await page.addScriptTag({ content: await readFile(createRequire(import.meta.url).resolve('pele/global'), 'utf8') });
    for (const [name, source] of typographyFixtures) {
      for (const width of [1000, 390]) {
        for (const fontSize of [12, 16, 24, 32]) {
          await t.test(`${name}, ${width}px container, ${fontSize}px font`, async () => {
            const result = await page.evaluate(async ({ source, width, fontSize }) => {
              const host = document.getElementById('host');
              host.style.width = `${width}px`;
              const mounted = pele.mount(host, source, { fontSize, links: false, images: false });
              await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
              const svg = host.querySelector('svg');
              const viewBox = svg.viewBox.baseVal;
              const box = svg.getBoundingClientRect();
              const scale = box.width / viewBox.width;
              const texts = [...svg.querySelectorAll('text')];
              const effectiveFontSizes = texts.map((text) => parseFloat(getComputedStyle(text).fontSize) * scale);
              const outOfBounds = texts.filter((text) => {
                const bounds = text.getBBox();
                const matrix = svg.getScreenCTM().inverse().multiply(text.getScreenCTM());
                return [[bounds.x, bounds.y], [bounds.x + bounds.width, bounds.y + bounds.height]].some(([x, y]) => {
                  const point = new DOMPoint(x, y).matrixTransform(matrix);
                  return point.x < -1 || point.y < -1 || point.x > viewBox.width + 1 || point.y > viewBox.height + 1;
                });
              }).length;
              const result = { width: box.width, height: box.height, viewBox: svg.getAttribute('viewBox'), minEffectiveFont: Math.min(...effectiveFontSizes), outOfBounds, svg: svg.outerHTML };
              mounted.destroy();
              return result;
            }, { source, width, fontSize });
            assert.ok(Number.isFinite(result.width) && result.width > 0);
            assert.ok(Number.isFinite(result.height) && result.height > 0);
            assert.ok(result.width <= width + 1, 'SVG must fit the requested container');
            // Readability and clipping are measured diagnostics, not compatibility assertions.
            measurements.push({ name, container: width, fontSize, ...result });
          });
        }
      }
    }
    await t.test('rich labels become SVG text styles, not arbitrary HTML', async () => {
      const svg = render(richSource, { links: false, images: false, maxWidth: 390 }).svg;
      assert.match(svg, /baseline-shift="sub"/);
      assert.match(svg, /baseline-shift="super"/);
      assert.match(svg, /font-family="var\(--_fm\)"/);
      assert.match(svg, /text-decoration="underline"/);
      assert.match(svg, /font-style="italic"/);
      assert.doesNotMatch(svg, /<foreignObject|<sub>|<sup>|<kbd>|<cite>|<code>/);
      additional.richLabelSvg = svg;
    });
    await t.test('KaTeX resolver typesets native MathML without external fonts', async () => {
      const markup = katex.renderToString('x^2 + \\frac{1}{2}', { output: 'mathml', displayMode: true, trust: false, throwOnError: true, strict: 'error', maxExpand: 1000 });
      const result = await page.evaluate(({ markup }) => {
        const host = document.getElementById('host');
        const probe = document.createElement('div');
        probe.style.cssText = 'position:absolute;visibility:hidden;display:inline-block;font-size:16px';
        probe.innerHTML = markup;
        host.append(probe);
        const math = probe.querySelector('math');
        const { width, height } = math.getBoundingClientRect();
        const source = 'flowchart LR\n A["$$x^2 + \\frac{1}{2}$$"] --> B[Result]';
        const rendered = pele.render(source, { links: false, images: false, math: () => ({ html: math.outerHTML, width, height }) });
        probe.remove();
        const documentSvg = new DOMParser().parseFromString(rendered.svg, 'image/svg+xml');
        return { svg: rendered.svg, width, height, mathElements: documentSvg.getElementsByTagName('math').length, unsafe: Boolean(documentSvg.querySelector('script,a,image')) };
      }, { markup });
      assert.ok(result.width > 0 && result.height > 0);
      assert.equal(result.mathElements, 1);
      assert.equal(result.unsafe, false);
      assert.match(result.svg, /<foreignObject/);
      additional.math = result;
    });
    await t.test('math resolvers are trusted markup, not an SVG sanitization boundary', () => {
      const { svg } = render('flowchart LR\n A["$$x$$"]', { math: () => ({ svg: '<g data-trusted-resolver="unchanged"></g>', width: 10, height: 10 }) });
      assert.match(svg, /<g data-trusted-resolver="unchanged"><\/g>/);
    });
    await t.test('Sankey gradients resolve locally and stay distinct across diagrams', async () => {
      const first = render(sankeySource, { idPrefix: 'sankey-one' }).svg;
      const second = render(sankeySource, { idPrefix: 'sankey-two' }).svg;
      assert.match(first, /<linearGradient/);
      assert.doesNotMatch(render(sankeySource).svg, /<linearGradient/);
      const result = await page.evaluate(({ first, second }) => {
        const host = document.getElementById('host');
        host.innerHTML = first + second;
        const ids = [...host.querySelectorAll('[id]')].map((node) => node.id);
        // SVG paint values can include a fallback color after url(#id).
        const references = [...host.querySelectorAll('[fill]')].map((node) => /^url\(#([^)]+)\)/.exec(node.getAttribute('fill'))?.[1]).filter(Boolean);
        const before = getComputedStyle(host.querySelector('stop')).stopColor;
        host.style.setProperty('--pele-series-1', 'rgb(200, 20, 30)');
        const after = getComputedStyle(host.querySelector('stop')).stopColor;
        host.style.removeProperty('--pele-series-1');
        return { gradientCount: host.querySelectorAll('linearGradient').length, unique: new Set(ids).size === ids.length, resolved: references.every((id) => ids.includes(id)), before, after };
      }, { first, second });
      assert.ok(result.gradientCount > 0);
      assert.equal(result.unique, true);
      assert.equal(result.resolved, true);
      assert.notEqual(result.before, result.after);
      additional.sankey = result;
      additional.sankeySvg = first;
    });
    assert.deepEqual(requests, []);
    const report = { at: new Date().toISOString(), chrome: browser.version(), viewport: '390x844', pele: '1.10.0', katex: '0.19.1', measurements, additional, interceptedRequests: requests.length };
    await mkdir(new URL('./results/', import.meta.url), { recursive: true, mode: 0o700 });
    await writeFile(new URL('./results/features.json', import.meta.url), JSON.stringify(report, null, 2) + '\n', { mode: 0o600 });
    const examples = measurements.filter((item) => item.container === 390 && [16, 32].includes(item.fontSize));
    const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><title>Pele typography at 390px</title><style>:root{font:16px/1.55 system-ui;color:oklch(25% .008 70);background:oklch(98% .007 80)}body{margin:24px auto;max-width:70ch;padding:0 20px}h1{font-size:2rem;line-height:1.15}h2{font-size:1.25rem}section{padding:24px 0;border-top:1px solid oklch(82% .01 70)}svg{max-width:100%;height:auto}.diagram{max-width:390px}small{font-variant-numeric:tabular-nums}</style><h1>Pele typography at 390px</h1><p>Local synthetic experiments for the October 23–24 creator posts. The browser viewport was 390×844. Increasing the requested font does not guarantee larger visible text when an entire diagram scales down.</p>${examples.map((item) => `<section><h2>${escapeHtml(item.name)} · requested ${item.fontSize}px</h2><p><small>Smallest effective text: ${item.minEffectiveFont.toFixed(1)}px. Text boxes outside viewBox: ${item.outOfBounds}.</small></p><div class="diagram">${item.svg}</div></section>`).join('')}<section><h2>Rich labels</h2><div class="diagram">${additional.richLabelSvg}</div></section><section><h2>Trusted KaTeX MathML resolver</h2><p>MathML is inside foreignObject. SVG sanitizers can remove it.</p><div class="diagram">${additional.math.svg}</div></section><section><h2>Sankey gradients</h2><p>Distinct ID prefixes prevent collisions between diagrams.</p>${additional.sankeySvg}</section></html>`;
    await writeFile(new URL('./results/typography.html', import.meta.url), html, { mode: 0o600 });
  } finally { await browser.close(); }
});
