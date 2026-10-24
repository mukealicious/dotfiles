import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { render } from 'pele';
import { renderPeleSvg } from './render-pele.mjs';

const hostileDiagrams = [
  ['script label', 'flowchart TD\n A["</text></g></svg><script>alert(1)</script>"] --> B'],
  ['HTML event label', 'flowchart TD\n A["<img src=x onerror=alert(1)>"] --> B'],
  ['unsafe URL', 'flowchart TD\n A --> B\n click A "javascript:alert(1)"'],
  ['encoded unsafe URL', 'flowchart TD\n A --> B\n click A "#106;avascript:alert(1)"'],
  ['web link', 'flowchart TD\n A --> B\n click A "https://example.invalid/private"'],
  ['internal link', 'flowchart TD\n A["javascript:alert(1)"]:::internal-link'],
  ['remote image', 'flowchart TD\n A@{ img: "https://example.invalid/pixel", label: "Image" }'],
  ['CSS request', 'block\n a["x"]\n classDef bad fill:url(https://example.invalid/pixel),stroke:red\n class a bad'],
  ['diagram config cannot enable images', '%%{init: {"images": true, "links": true, "securityLevel": "loose"}}%%\nflowchart TD\n A@{ img: "https://example.invalid/pixel" }\n click A "https://example.invalid/private"'],
  ['callback', 'flowchart TD\n A --> B\n click A call alert()'],
  ['prototype names', 'flowchart TD\n __proto__ --> constructor --> toString'],
];

test('Pele previews have inert SVG structure and make no browser requests', async (t) => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  try {
    const context = await browser.newContext();
    const requests = [];
    await context.route('**/*', (route) => { requests.push(route.request().url()); return route.abort(); });
    const page = await context.newPage();
    await page.setContent('<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'"><div id="host"></div>');
    for (const [name, source] of hostileDiagrams) {
      await t.test(name, async () => {
        const svg = await renderPeleSvg(source);
        const issues = await page.evaluate((svg) => {
          const xml = new DOMParser().parseFromString(svg, 'image/svg+xml');
          const issues = [];
          if (xml.querySelector('parsererror')) issues.push('Invalid XML');
          if (xml.querySelector('script,foreignObject,iframe,object,embed,a,image')) issues.push('Active element');
          for (const element of xml.querySelectorAll('*')) {
            for (const attribute of element.attributes) {
              if (/^on/i.test(attribute.name)) issues.push('Event attribute');
              if (/^(href|xlink:href|src)$/i.test(attribute.name) && !attribute.value.startsWith('#')) issues.push('External reference');
              if (attribute.name === 'style' && /@import|expression\s*\(|url\s*\(\s*["']?(?!#)/i.test(attribute.value)) issues.push('Unsafe style');
            }
          }
          document.getElementById('host').innerHTML = svg;
          return issues;
        }, svg);
        assert.deepEqual(issues, []);
      });
    }
    await page.waitForTimeout(100);
    assert.deepEqual(requests, []);
    assert.equal({}.polluted, undefined);
  } finally { await browser.close(); }
});

test('Pele defaults allow remote images; hardened options are necessary', () => {
  const source = 'flowchart TD\n A@{ img: "https://example.invalid/pixel" }';
  assert.match(render(source).svg, /<image\b/);
  assert.doesNotMatch(render(source, { images: false, links: false }).svg, /<image\b|<a\b/);
});
