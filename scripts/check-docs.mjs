// Checks that the deployed documents are the source documents and that every
// automated test is named in the matching SPECS page.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'dist', 'four-wins', 'browser');
const errors = [];

function read(relative) {
  return readFileSync(join(root, relative), 'utf8');
}

const copied = ['README.md'];
for (const name of readdirSync(join(root, 'docs'))) {
  if (name.endsWith('.md') || name.endsWith('.yaml')) {
    copied.push(join('docs', name));
  }
}
copied.push('public/test-metrics.json');

for (const file of copied) {
  const deployed = file === 'public/test-metrics.json' ? 'test-metrics.json' : file;
  const target = join(dist, deployed);
  if (!existsSync(target)) {
    errors.push(`missing deployed file: ${file} (run pnpm build first)`);
    continue;
  }
  if (read(file) !== readFileSync(target, 'utf8')) {
    errors.push(`deployed file differs from source: ${file}`);
  }
}

let metrics;
try {
  metrics = JSON.parse(read(join('public', 'test-metrics.json')));
} catch (error) {
  errors.push(`cannot read public/test-metrics.json: ${error.message}`);
  metrics = null;
}

const testTitle = /test\(\s*'([^']+)'/g;
const specTest = /^- `([^`]+)`/gm;
const specs = [
  ['docs/APP-SPECS.md', 'app-specs'],
  ['docs/BASIC-SPECS.md', 'basic-specs'],
];

for (const [file, key] of specs) {
  const listed = [...read(file).matchAll(specTest)]
    .map((match) => match[1])
    .filter((title) => /^\[/.test(title));
  if (!listed.length) {
    errors.push(`${file}: no automated test names found`);
    continue;
  }
  for (const title of listed) {
    if (!/^\[[A-Z0-9-]+\]/.test(title)) {
      errors.push(`${file}: test name lacks a bracket tag: ${title}`);
    }
  }
  const actual = metrics?.requirements?.[key];
  if (!actual) {
    errors.push(`${file}: no requirements entry for ${key}`);
    continue;
  }
  const expected = new Set([...actual.unit, ...actual.e2e]);
  for (const title of listed) {
    if (!expected.has(title)) {
      errors.push(`${file}: listed test is not in the test sources: ${title}`);
    }
  }
  for (const title of expected) {
    if (!listed.includes(title)) {
      errors.push(`${file}: test is missing from the SPECS page: ${title}`);
    }
  }
}

for (const file of [
  'test/game-logic.test.ts',
  'test/reader.test.ts',
  'test/metrics.test.ts',
  'e2e/game.spec.ts',
  'e2e/site.spec.ts',
]) {
  for (const match of read(file).matchAll(testTitle)) {
    if (!/^\[[A-Z0-9-]+\]/.test(match[1])) {
      errors.push(`${file}: test name lacks a bracket tag: ${match[1]}`);
    }
  }
}

if (errors.length) {
  for (const error of errors) {
    console.error(`check-docs: ${error}`);
  }
  process.exit(1);
}
console.log(`check-docs: ${copied.length} deployed files match; SPECS and tests agree.`);
