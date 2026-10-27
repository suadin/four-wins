import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatMeasured, measurementTip, metricLabel, metricView } from '../src/app/metrics';

test('[BASIC-FOOTER-02] metric labels show count and coverage', () => {
  assert.equal(metricLabel('Unit', { tests: 21, failures: 0, coverage: 93.9 }), 'Unit 21 · 93.9 %');
  assert.equal(
    metricLabel('E2E', { tests: 21, failures: 2, coverage: 88 }),
    'E2E 21 · 88 % · 2 fail',
  );
  assert.equal(
    metricLabel('Unit', { tests: 21, failures: 0, coverage: null }),
    'Unit 21 · coverage not measured',
  );
  assert.equal(metricView('Unit', { tests: 21, failures: 0, coverage: 93.9 }).failed, false);
});

test('[BASIC-FOOTER-03] measurement tooltips have three rows', () => {
  const tip = measurementTip({
    measuredAt: '2026-10-27T18:09',
    durationSeconds: 12.3,
    perTest: 0.5857,
  });
  assert.deepEqual(tip.split('\n'), [
    'Measured 2026-10-27 18:09',
    'Duration 12.3 s',
    'Per test 0.59 s',
  ]);
  assert.equal(measurementTip({ measuredAt: '2026-10-27T18:09' }).split('\n').length, 3);
});

test('[BASIC-FOOTER-03] a missing run is not executed', () => {
  const view = metricView('Unit', null);
  assert.equal(view.label, 'Unit not executed');
  assert.equal(view.failed, true);
  assert.equal(view.tip, 'not executed');
});

test('[BASIC-DATES-01] measured dates use yyyy-mm-dd hh:mm', () => {
  assert.equal(formatMeasured('2026-10-27T18:09'), '2026-10-27 18:09');
  assert.equal(formatMeasured('2026-10-27 18:09'), '2026-10-27 18:09');
  assert.equal(formatMeasured(undefined), '—');
});
