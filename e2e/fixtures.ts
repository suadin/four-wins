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
  sourceMap?: unknown;
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
        for (const entry of entries) {
          const reference = /\/\/# sourceMappingURL=([^\s]+)\s*$/m.exec(entry.source)?.[1];
          if (!reference || reference.startsWith('data:')) {
            continue;
          }
          try {
            const response = await page.request.get(new URL(reference, entry.url).href);
            if (response.ok()) {
              entry.sourceMap = await response.json();
            }
          } catch {
            // Coverage still records the script; only the map is missing.
          }
        }
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
