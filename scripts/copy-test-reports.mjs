import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Copies the test reports into the Pages build, next to the static overview page.
const target = join('dist', 'four-wins', 'browser', 'test');
mkdirSync(target, { recursive: true });
cpSync(join('test-report', 'unit'), join(target, 'unit'), { recursive: true });
cpSync(join('test-report', 'e2e'), join(target, 'e2e'), { recursive: true });
cpSync(join('test', 'index.html'), join(target, 'index.html'));

// The journey video lives in the per-test output folder; copy it to a stable name.
for (const dir of readdirSync('test-results')) {
  const src = join('test-results', dir, 'journey.webm');
  if (existsSync(src)) {
    cpSync(src, join(target, 'e2e', 'journey.webm'));
    break;
  }
}

console.log(`Test reports copied to ${target}`);
