import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const routes = new Map([
  ['/', ['copy-descriptions.fixture.html', 'text/html; charset=utf-8']],
  ['/copy-duplicate-descriptions.mjs', ['copy-duplicate-descriptions.mjs', 'text/javascript; charset=utf-8']],
]);
const server = createServer(async (request, response) => {
  const route = routes.get(request.url);
  if (!route || request.method !== 'GET') {
    response.writeHead(404).end('Not found');
    return;
  }
  try {
    const content = await readFile(new URL(route[0], import.meta.url));
    response.writeHead(200, { 'content-type': route[1], 'cache-control': 'no-store' }).end(content);
  } catch (error) {
    console.error('Copy fixture read failed:', error.message);
    response.writeHead(500).end('Copy fixture read failed');
  }
});
server.on('error', error => {
  console.error('Copy fixture server failed:', error.message);
  process.exitCode = 1;
});
server.listen(0, '127.0.0.1', () => {
  console.log(`Copy fixture: http://127.0.0.1:${server.address().port}`);
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close());
}
