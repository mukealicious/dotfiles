// Minimal old-side fixture for installer patch tests, built from exact contexts.
// These are not executable package implementations; runtime tests use real packages.
import fs from 'node:fs';
const lines = [];
const args = process.argv.slice(2);
for (const file of args) {
  let index;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const hunk = /^@@ -(\d+)(?:,\d+)? \+/.exec(line);
    if (hunk) { index = Number(hunk[1]) - 1; continue; }
    if (index === undefined || line.startsWith('---') || line.startsWith('+++')) continue;
    if (line.startsWith(' ') || line.startsWith('-')) {
      const text = line.slice(1);
      if (lines[index] !== undefined && lines[index] !== text) throw new Error(`Conflicting patch fixture at ${index + 1}`);
      lines[index++] = text;
    }
  }
}
process.stdout.write(Array.from({ length: lines.length }, (_, i) => lines[i] ?? '').join('\n') + '\n');
