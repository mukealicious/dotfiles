import { parentPort, workerData } from 'node:worker_threads';
import { render } from 'pele';

try {
  const result = render(workerData.source, {
    links: false,
    images: false,
    maxEdges: 500,
    limit: 50_000,
    outputLimit: 4_000_000,
    maxWidth: workerData.width,
    idPrefix: 'pele-preview',
  });
  parentPort.postMessage({ svg: result.svg });
} catch (error) {
  parentPort.postMessage({ error: error.message });
}
