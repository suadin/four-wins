import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { writeFileSync } from 'node:fs';

function localStamp(date = new Date()): string {
  const pad = (value: number): string => String(value).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

/** Writes the numbers the footer shows after a browser run. */
export default class MetricsReporter implements Reporter {
  private tests = 0;
  private failures = 0;
  private durationMs = 0;

  onTestEnd(_test: TestCase, result: TestResult): void {
    if (result.status === 'skipped') {
      return;
    }
    this.tests += 1;
    this.durationMs += result.duration;
    if (
      result.status === 'failed' ||
      result.status === 'timedOut' ||
      result.status === 'interrupted'
    ) {
      this.failures += 1;
    }
  }

  onEnd(result: FullResult): void {
    const metrics = {
      tests: this.tests,
      failures: this.failures,
      durationSeconds: Number((this.durationMs / 1000).toFixed(3)),
      measuredAt: localStamp(),
      status: result.status,
    };
    writeFileSync('e2e-results.json', `${JSON.stringify(metrics, null, 2)}\n`);
  }
}
