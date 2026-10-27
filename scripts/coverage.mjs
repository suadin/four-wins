import coverage from 'istanbul-lib-coverage';
import v8toIstanbul from 'v8-to-istanbul';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const { createCoverageMap } = coverage;

function walk(dir) {
  const files = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }
  for (const name of entries) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      files.push(...walk(path));
    } else if (name === 'coverage.json') {
      files.push(path);
    }
  }
  return files;
}

function mergeFunctions(functions) {
  const byKey = new Map();
  for (const block of functions) {
    const key =
      `${block.functionName}|${block.isBlockCoverage}|` +
      block.ranges.map((range) => `${range.startOffset}-${range.endOffset}`).join(',');
    const merged = byKey.get(key);
    if (!merged) {
      byKey.set(key, {
        functionName: block.functionName,
        isBlockCoverage: block.isBlockCoverage,
        ranges: block.ranges.map((range) => ({ ...range })),
      });
      continue;
    }
    for (const range of block.ranges) {
      const target = merged.ranges.find(
        (item) => item.startOffset === range.startOffset && item.endOffset === range.endOffset,
      );
      if (target) {
        target.count = Math.max(target.count, range.count);
      }
    }
  }
  return [...byKey.values()];
}

function isAppFile(file) {
  return file.includes('/src/app/') || file.startsWith('src/app/');
}

async function sourceMapFor(entry, source) {
  const match = /\/\/# sourceMappingURL=([^\s]+)\s*$/m.exec(source);
  if (!match) {
    return null;
  }
  const reference = match[1];
  if (reference.startsWith('data:')) {
    const comma = reference.indexOf(',');
    const payload = reference.slice(comma + 1);
    const decoded = reference.slice(0, comma).includes(';base64')
      ? Buffer.from(payload, 'base64').toString('utf8')
      : decodeURIComponent(payload);
    return { sourcemap: JSON.parse(decoded) };
  }
  const url = new URL(reference, entry.url).href;
  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }
  return { sourcemap: await response.json() };
}

/**
 * Turns Playwright's V8 coverage files into line coverage for `src/app`.
 * Returns null when no app file could be mapped.
 */
export async function lineCoverageFromTestResults(root, baseURL) {
  const files = walk(join(root, 'test-results'));
  if (!files.length) {
    return null;
  }

  const functionsByUrl = new Map();
  const sources = new Map();
  const sourceMaps = new Map();
  for (const file of files) {
    let entries;
    try {
      entries = JSON.parse(readFileSync(file, 'utf8'));
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.url.startsWith(baseURL) || !entry.url.endsWith('.js')) {
        continue;
      }
      if (!entry.source) {
        continue;
      }
      const functions = functionsByUrl.get(entry.url) ?? [];
      functions.push(...(entry.functions ?? []));
      functionsByUrl.set(entry.url, functions);
      sources.set(entry.url, entry.source);
      if (entry.sourceMap) {
        sourceMaps.set(entry.url, entry.sourceMap);
      }
    }
  }

  const coverageMap = createCoverageMap({});
  for (const [url, functions] of functionsByUrl) {
    try {
      const source = sources.get(url);
      if (!source) {
        continue;
      }
      const cachedMap = sourceMaps.get(url);
      const sourceMap = cachedMap ? { sourcemap: cachedMap } : await sourceMapFor({ url }, source);
      if (!sourceMap) {
        continue;
      }
      const converter = v8toIstanbul(url, 0, { source, sourceMap });
      await converter.load();
      converter.applyCoverage(mergeFunctions(functions));
      const converted = converter.toIstanbul();
      const filtered = {};
      for (const [file, data] of Object.entries(converted)) {
        if (isAppFile(file)) {
          filtered[file] = data;
        }
      }
      coverageMap.merge(filtered);
    } catch (error) {
      console.warn(
        `coverage: could not map ${url}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  const summary = coverageMap.getCoverageSummary();
  if (!summary.lines.total) {
    return null;
  }
  return {
    coverage: Number(summary.lines.pct.toFixed(2)),
    coveredLines: summary.lines.covered,
    totalLines: summary.lines.total,
  };
}
