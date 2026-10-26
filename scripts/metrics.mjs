// Runs the unit suite and writes the numbers the footer shows.
//
// The page is static, so it cannot start a test run itself: this script is the
// run button, and public/test-metrics.json is the last measurement. Coverage
// and a browser suite do not exist yet, so the file says null instead of zero.
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const result = spawnSync(
  process.execPath,
  [
    '--experimental-strip-types',
    '--import', './test/register.mjs',
    '--test', '--test-reporter=tap', 'test/game-logic.test.ts',
  ],
  { cwd: root, encoding: 'utf8' },
);
process.stdout.write(result.stdout ?? '');
process.stderr.write(result.stderr ?? '');

const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
const number = (pattern) => {
  const match = pattern.exec(output);
  return match ? Number(match[1]) : null;
};

const total = number(/^# tests (\d+)$/m);
const failed = number(/^# fail (\d+)$/m) ?? 0;
if (total === null) {
  console.error('No test count in the runner output.');
  process.exit(1);
}

const now = new Date();
const pad = (value) => String(value).padStart(2, '0');
const measured = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  + `T${pad(now.getHours())}:${pad(now.getMinutes())}`;

const metrics = {
  unit: { total, coverage: null, failed, measured },
  e2e: null,
};
writeFileSync(join(root, 'public', 'test-metrics.json'),
  `${JSON.stringify(metrics, null, 2)}\n`);

console.log(`unit: ${total} tests, ${failed} failed — wrote public/test-metrics.json`);
if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
