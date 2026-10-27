// Runs both suites and writes the numbers the footer and the reader show.
//
// A static page cannot start a test run itself: `pnpm metrics` is the run
// button, and public/test-metrics.json is the last measurement.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lineCoverageFromTestResults } from './coverage.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const baseURL = 'http://127.0.0.1:4173';

function stamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function number(pattern, text) {
  const match = pattern.exec(text);
  return match ? Number(match[1]) : null;
}

function titles(file) {
  const text = readFileSync(join(root, file), 'utf8');
  return [...text.matchAll(/test\(\s*'([^']+)'/g)].map((match) => match[1]);
}

const unitStart = new Date();
const unit = spawnSync(
  process.execPath,
  [
    '--experimental-strip-types',
    '--import',
    './test/register.mjs',
    '--test',
    '--test-reporter=tap',
    '--experimental-test-coverage',
    '--test-coverage-include=src/app/**/*.ts',
    'test/game-logic.test.ts',
    'test/reader.test.ts',
    'test/metrics.test.ts',
    'test/version.test.ts',
  ],
  { cwd: root, encoding: 'utf8' },
);
process.stdout.write(unit.stdout ?? '');
process.stderr.write(unit.stderr ?? '');

const unitOutput = `${unit.stdout ?? ''}\n${unit.stderr ?? ''}`;
const unitTests = number(/^# tests (\d+)$/m, unitOutput);
const unitFailures = number(/^# fail (\d+)$/m, unitOutput) ?? 0;
const unitDurationMs = number(/^# duration_ms ([\d.]+)$/m, unitOutput);
const unitCoverage = number(/^# all files\s+\|\s+([\d.]+)/m, unitOutput);
const unitMetrics =
  unitTests === null
    ? null
    : {
        tests: unitTests,
        failures: unitFailures,
        coverage: unitCoverage,
        measuredAt: stamp(unitStart),
        durationSeconds:
          unitDurationMs === null ? null : Number((unitDurationMs / 1000).toFixed(3)),
        perTest:
          unitDurationMs === null || !unitTests
            ? null
            : Number((unitDurationMs / 1000 / unitTests).toFixed(4)),
      };

rmSync(join(root, 'e2e-results.json'), { force: true });
rmSync(join(root, 'test-results'), { recursive: true, force: true });

const e2e = spawnSync(
  process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
  ['exec', 'playwright', 'test'],
  { cwd: root, stdio: 'inherit' },
);

let e2eResult = null;
const e2eFile = join(root, 'e2e-results.json');
if (existsSync(e2eFile)) {
  e2eResult = JSON.parse(readFileSync(e2eFile, 'utf8'));
}
const e2eCoverage = await lineCoverageFromTestResults(root, baseURL);
const e2eMetrics =
  e2eResult === null
    ? null
    : {
        tests: e2eResult.tests,
        failures: e2eResult.failures,
        coverage: e2eCoverage?.coverage ?? null,
        coveredLines: e2eCoverage?.coveredLines ?? null,
        totalLines: e2eCoverage?.totalLines ?? null,
        measuredAt: e2eResult.measuredAt ?? stamp(),
        durationSeconds: e2eResult.durationSeconds ?? null,
        perTest: e2eResult.tests
          ? Number(((e2eResult.durationSeconds ?? 0) / e2eResult.tests).toFixed(4))
          : null,
      };

const requirements = {
  'app-specs': {
    unit: titles('test/game-logic.test.ts'),
    e2e: titles('e2e/game.spec.ts'),
  },
  'basic-specs': {
    unit: [
      ...titles('test/reader.test.ts'),
      ...titles('test/metrics.test.ts'),
      ...titles('test/version.test.ts'),
    ],
    e2e: titles('e2e/site.spec.ts'),
  },
};

const metrics = { unit: unitMetrics, e2e: e2eMetrics, requirements };
writeFileSync(join(root, 'public', 'test-metrics.json'), `${JSON.stringify(metrics, null, 2)}\n`);

console.log(
  `unit: ${unitMetrics?.tests ?? 'not executed'} tests, ${unitMetrics?.failures ?? '?'} failed, ` +
    `coverage ${unitMetrics?.coverage ?? 'not measured'} %`,
);
console.log(
  `e2e: ${e2eMetrics?.tests ?? 'not executed'} tests, ${e2eMetrics?.failures ?? '?'} failed, ` +
    `coverage ${e2eMetrics?.coverage ?? 'not measured'} %`,
);
console.log('wrote public/test-metrics.json');

const unitCoverageMissing = (unitMetrics?.tests ?? 0) > 0 && unitMetrics?.coverage == null;
const coverageMissing = (e2eMetrics?.tests ?? 0) > 0 && e2eMetrics?.coverage == null;
if (unitCoverageMissing) {
  console.error('Unit tests ran without line coverage; that is a defect, not a display state.');
}
if (coverageMissing) {
  console.error('E2E ran without line coverage; that is a defect, not a display state.');
}
const failed = unit.status !== 0 || e2e.status !== 0 || unitCoverageMissing || coverageMissing;
process.exit(failed ? 1 : 0);
