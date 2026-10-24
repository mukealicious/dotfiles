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

// This conservative test guard is not a general SVG/CSS sanitizer. It runs in Chrome.
function inspectPreviewSvg(svg) {
  const xml = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const issues = [];
  if (xml.querySelector('parsererror')) issues.push('Invalid XML');
  if (xml.querySelector('script,foreignObject,iframe,object,embed,a,image')) issues.push('Active element');
  const ids = new Set([...xml.querySelectorAll('[id]')].map((element) => element.id));
  const paintAttributes = new Set(['fill', 'stroke', 'filter', 'clip-path', 'mask', 'marker', 'marker-start', 'marker-mid', 'marker-end', 'cursor']);
  const localReference = (value) => /^#[\w:.-]+$/.test(value) && ids.has(value.slice(1));
  const inspectCssReferences = (value, location) => {
    // Normalize CSS comments, escapes, and line continuations before checking URLs.
    const normalized = value.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\\(?:\r\n|[\n\r\f])/g, '').replace(/\\([\da-f]{1,6})(?:\r\n|[\t\n\f\r ])?|\\([^\n\r\f])/gi, (_, hex, character) => {
      if (!hex) return character;
      const code = parseInt(hex, 16);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '\ufffd';
    });
    if (/@import\b|expression\s*\(/i.test(normalized)) issues.push(`Unsafe ${location}`);
    const urls = [...normalized.matchAll(/url\s*\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/gi)];
    if ((normalized.match(/url\s*\(/gi) ?? []).length !== urls.length) issues.push(`Malformed URL in ${location}`);
    for (const match of urls) {
      if (!localReference((match[1] ?? match[2] ?? match[3]).trim())) issues.push(`External or unresolved URL in ${location}`);
    }
  };
  for (const stylesheet of xml.querySelectorAll('style')) inspectCssReferences(stylesheet.textContent, 'stylesheet');
  for (const element of xml.querySelectorAll('*')) {
    for (const attribute of element.attributes) {
      const name = attribute.name.toLowerCase();
      if (/^on/.test(name)) issues.push('Event attribute');
      if (/^(href|xlink:href|src)$/.test(name) && !localReference(attribute.value)) issues.push('External or unresolved reference');
      if (name === 'style') inspectCssReferences(attribute.value, 'style attribute');
      if (paintAttributes.has(name)) inspectCssReferences(attribute.value, `paint attribute ${name}`);
    }
  }
  return issues;
}

const importControl = (url) => `<svg xmlns="http://www.w3.org/2000/svg"><style>@import url("${url}");</style><rect width="10" height="10"/></svg>`;

test('Pele preview SVG guard and request detection without CSP', async (t) => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  try {
    const context = await browser.newContext();
    const requests = [];
    // Abortion prevents network access, while the missing CSP makes attempts observable.
    await context.route('**/*', (route) => { requests.push(route.request().url()); return route.abort(); });
    const page = await context.newPage();
    await page.setContent('<div id="host"></div>');

    await t.test('positive control intercepts and aborts an SVG stylesheet import', async () => {
      const url = 'https://example.invalid/positive-control.css';
      const svg = importControl(url);
      assert.match((await page.evaluate(inspectPreviewSvg, svg)).join('\n'), /Unsafe stylesheet/);
      const failed = page.waitForEvent('requestfailed', { predicate: (request) => request.url() === url, timeout: 3000 });
      await page.evaluate((svg) => { document.getElementById('host').innerHTML = svg; }, svg);
      const request = await failed;
      assert.equal(request.failure().errorText, 'net::ERR_FAILED');
      assert.deepEqual(requests, [url]);
      await page.evaluate(() => { document.getElementById('host').replaceChildren(); });
      requests.length = 0;
    });

    await t.test('regression rejects the stylesheet that passed the former guard under CSP', async () => {
      const url = 'https://example.invalid/former-blind-spot.css';
      const svg = importControl(url);
      const protectedPage = await context.newPage();
      try {
        await protectedPage.setContent('<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'"><div id="host"></div>');
        // Reproduce the former guard's attribute-only checks on this controlled SVG.
        const formerIssues = await protectedPage.evaluate((svg) => {
          const xml = new DOMParser().parseFromString(svg, 'image/svg+xml');
          const issues = [];
          if (xml.querySelector('parsererror')) issues.push('Invalid XML');
          if (xml.querySelector('script,foreignObject,iframe,object,embed,a,image')) issues.push('Active element');
          for (const element of xml.querySelectorAll('*')) for (const attribute of element.attributes) {
            if (/^on/i.test(attribute.name)) issues.push('Event attribute');
            if (/^(href|xlink:href|src)$/i.test(attribute.name) && !attribute.value.startsWith('#')) issues.push('External reference');
            if (attribute.name === 'style' && /@import|expression\s*\(|url\s*\(\s*["']?(?!#)/i.test(attribute.value)) issues.push('Unsafe style');
          }
          return issues;
        }, svg);
        assert.deepEqual(formerIssues, []);
        const blocked = await protectedPage.evaluate(({ svg, url }) => new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('Expected CSP violation was not observed.')), 3000);
          document.addEventListener('securitypolicyviolation', (event) => {
            if (event.blockedURI === url) { clearTimeout(timer); resolve(event.blockedURI); }
          });
          document.getElementById('host').innerHTML = svg;
        }), { svg, url });
        assert.equal(blocked, url);
        assert.deepEqual(requests, []);
        const issues = await protectedPage.evaluate(inspectPreviewSvg, svg);
        assert.match(issues.join('\n'), /Unsafe stylesheet/);
        assert.throws(() => assert.deepEqual(issues, []), assert.AssertionError);
      } finally { await protectedPage.close(); }
    });

    await t.test('guard inspects stylesheet contents, including escaped CSS URLs and imports', async () => {
      for (const css of [
        '@import "https://example.invalid/import.css";',
        '@\\69mport "https://example.invalid/escaped-import.css";',
        'rect { fill: url(https://example.invalid/paint.svg#color); }',
        'rect { fill: u\\72l(https://example.invalid/escaped-paint.svg#color); }',
        '@font-face { font-family: remote; src: url(https://example.invalid/font.woff2); }',
      ]) {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg"><style>${css}</style></svg>`;
        assert.notDeepEqual(await page.evaluate(inspectPreviewSvg, svg), [], css);
      }
    });

    await t.test('guard rejects external paint references and allows resolved local fragments', async () => {
      for (const attribute of ['fill', 'stroke', 'filter', 'clip-path', 'mask', 'marker', 'marker-start', 'marker-mid', 'marker-end', 'cursor']) {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg"><rect ${attribute}="url(https://example.invalid/paint.svg#color)"/></svg>`;
        assert.match((await page.evaluate(inspectPreviewSvg, svg)).join('\n'), /paint attribute/, attribute);
      }
      const local = '<svg xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="color"/></defs><style>rect { fill: url("#color"); }</style><rect fill="url(#color) red" stroke="url(\'#color\')" style="fill:url(#color)"/></svg>';
      assert.deepEqual(await page.evaluate(inspectPreviewSvg, local), []);
      const unresolved = '<svg xmlns="http://www.w3.org/2000/svg"><rect fill="url(#missing)"/></svg>';
      assert.match((await page.evaluate(inspectPreviewSvg, unresolved)).join('\n'), /unresolved/);
    });

    for (const [name, source] of hostileDiagrams) {
      await t.test(name, async () => {
        const svg = await renderPeleSvg(source);
        assert.deepEqual(await page.evaluate(inspectPreviewSvg, svg), []);
        await page.evaluate((svg) => { document.getElementById('host').innerHTML = svg; }, svg);
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
