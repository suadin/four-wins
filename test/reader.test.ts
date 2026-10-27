import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  composeSpecs,
  docSlugForFile,
  docsHash,
  escapeHtml,
  iconFor,
  iconsFor,
  isDocSlug,
  parseRoute,
  playHash,
  renderMarkdown,
  resolveRoute,
  routeHash,
  slugify,
  splitDocument,
} from '../src/app/docs/reader';

test('[BASIC-READER-02] a heading becomes a slug', () => {
  assert.equal(slugify('Tests and metrics!'), 'tests-and-metrics');
  assert.equal(slugify('---'), 'page');
});

test('[BASIC-READER-02] a document is split at level-two headings', () => {
  const doc = splitDocument(
    'readme',
    'README',
    '# Four Wins\n\nIntro.\n\n## Play\n\nDrop a disc.\n\n## Tests\n\nRun them.\n',
  );
  assert.equal(doc.pages.length, 3);
  assert.deepEqual(
    doc.pages.map((page) => page.slug),
    ['overview', 'play', 'tests'],
  );
  assert.equal(doc.pages[0].markdown, 'Intro.');
  assert.equal(doc.pages[1].markdown, 'Drop a disc.');
});

test('[BASIC-READER-02] repeated headings get their own slug', () => {
  const doc = splitDocument('guide', 'GUIDE', '## Same\n\nA\n\n## Same\n\nB\n');
  assert.deepEqual(
    doc.pages.map((page) => page.slug),
    ['same', 'same-2'],
  );
});

test('[BASIC-READER-05] SPECS starts with one Changelog page', () => {
  const markdown = composeSpecs(
    '# App specs\n\n## Board\n\nRules.\n',
    '# Release notes\n\n## 2026-10-27\n\nNew.\n\n## 2026-10-26\n\nOld.\n',
  );
  const doc = splitDocument('app-specs', 'SPECS', markdown);
  assert.equal(doc.pages[0].slug, 'changelog');
  assert.equal(doc.pages[0].title, 'Changelog');
  assert.match(doc.pages[0].markdown, /### 2026-10-27/);
  assert.equal(doc.pages[1].title, 'Board');
});

test('[BASIC-READER-03] sections pick an icon and fall back to a dot', () => {
  assert.equal(iconFor('▶ Play the game'), 'play');
  assert.equal(iconFor('Tests and metrics'), 'clipboard');
  assert.equal(iconFor('Project structure'), 'tree');
  assert.equal(iconFor('Something else'), 'dot');
});

test('[BASIC-READER-03] section icons are unique within one document', () => {
  const doc = splitDocument(
    'guide',
    'GUIDE',
    '## Play\n\nA\n\n## Install\n\nB\n\n## Tests\n\nC\n\n## Tests\n\nD\n',
  );
  const icons = iconsFor(doc.pages);
  assert.equal(icons.length, doc.pages.length);
  assert.equal(new Set(icons).size, icons.length);
});

test('[BASIC-READER-04] html is escaped before markup is added', () => {
  assert.equal(escapeHtml('<b>"x"</b>'), '&lt;b&gt;&quot;x&quot;&lt;/b&gt;');
});

test('[BASIC-READER-04] markdown renders lists, tables and code', () => {
  const html = renderMarkdown(
    [
      'A **bold** word.',
      '',
      '- one',
      '',
      '| a | b |',
      '| --- | --- |',
      '| 1 | 2 |',
      '',
      '```',
      '<x>',
      '```',
    ].join('\n'),
  );
  assert.equal(html.includes('<strong>bold</strong>'), true);
  assert.equal(html.includes('<ul><li>one</li></ul>'), true);
  assert.equal(html.includes('<th>a</th><th>b</th>'), true);
  assert.equal(html.includes('<pre><code>&lt;x&gt;</code></pre>'), true);
});

test('[BASIC-READER-04] relative markdown links map to reader documents', () => {
  assert.equal(docSlugForFile('docs/APP-SPECS.md'), 'app-specs');
  assert.equal(docSlugForFile('BASIC-SPECS.md'), 'basic-specs');
  assert.equal(docSlugForFile('RELEASE-NOTES.md'), 'app-specs');
  assert.equal(docSlugForFile('openapi.yaml'), 'api');
  assert.equal(docSlugForFile('notes.txt'), null);
  const html = renderMarkdown('[SPECS](docs/APP-SPECS.md#board-and-rules)');
  assert.equal(html.includes('data-doc-file="APP-SPECS.md"'), true);
  assert.equal(html.includes('data-doc-anchor="#board-and-rules"'), true);
});

test('[BASIC-LINKS-01] routes survive a reload', () => {
  assert.deepEqual(parseRoute('#/docs/readme/tests'), {
    view: 'docs',
    doc: 'readme',
    section: 'tests',
  });
  assert.deepEqual(parseRoute('#/docs/api'), { view: 'docs', doc: 'api', section: null });
  assert.deepEqual(parseRoute('#/play/ai'), { view: 'play', mode: 'ai' });
  assert.deepEqual(parseRoute(''), { view: 'play', mode: 'pvp' });
});

test('[BASIC-LINKS-01] address helpers agree with the parser', () => {
  assert.equal(docsHash('readme', 'tests'), '#/docs/readme/tests');
  assert.equal(playHash('ai'), '#/play/ai');
  assert.equal(
    routeHash(parseRoute('#/docs/app-specs/board-and-rules')),
    '#/docs/app-specs/board-and-rules',
  );
});

test('[BASIC-LINKS-01] unknown routes return to the start', () => {
  assert.equal(isDocSlug('nope'), false);
  assert.deepEqual(resolveRoute('#/docs/nope'), { view: 'docs', doc: 'readme', section: null });
  assert.equal(routeHash(resolveRoute('#/docs/nope')), '#/docs/readme');
  assert.deepEqual(resolveRoute('#/nope'), { view: 'play', mode: 'pvp' });
});
