import { test as base, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface CoverageRange {
  startOffset: number;
  endOffset: number;
  count: number;
}

interface CoverageFunction {
  functionName: string;
  isBlockCoverage: boolean;
  ranges: CoverageRange[];
}

interface CoverageEntry {
  url: string;
  scriptId: string;
  source: string;
  functions: CoverageFunction[];
}

/** Starts V8 coverage before the first navigation and stores it per test. */
export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    await page.coverage.startJSCoverage({ resetOnNavigation: false });
    try {
      await use(page);
    } finally {
      try {
        const entries = await page.coverage.stopJSCoverage();
        if (entries.length) {
          const dir = testInfo.outputPath();
          mkdirSync(dir, { recursive: true });
          writeFileSync(join(dir, 'coverage.json'), JSON.stringify(entries));
        }
      } catch {
        // A test may close the page; the other tests still write coverage.
      }
    }
  },
});

export { expect };
export type { CoverageEntry };
