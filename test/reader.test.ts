import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  docsHash,
  escapeHtml,
  iconFor,
  parseRoute,
  playHash,
  renderMarkdown,
  slugify,
  splitDocument,
} from '../src/app/docs/reader';

test('a heading becomes a slug', () => {
  assert.equal(slugify('Tests and metrics!'), 'tests-and-metrics');
  assert.equal(slugify('---'), 'page');
});

test('a document is split at level-two headings', () => {
  const doc = splitDocument('readme', 'README',
    '# Four Wins\n\nIntro.\n\n## Play\n\nDrop a disc.\n\n## Tests\n\nRun them.\n');
  assert.equal(doc.pages.length, 3);
  assert.deepEqual(doc.pages.map((page) => page.slug), ['overview', 'play', 'tests']);
  assert.equal(doc.pages[0].markdown, 'Intro.');
  assert.equal(doc.pages[1].markdown, 'Drop a disc.');
});

test('repeated headings get their own slug', () => {
  const doc = splitDocument('guide', 'GUIDE', '## Same\n\nA\n\n## Same\n\nB\n');
  assert.deepEqual(doc.pages.map((page) => page.slug), ['same', 'same-2']);
});

test('sections pick an icon and fall back to a dot', () => {
  assert.equal(iconFor('▶ Play the game'), 'play');
  assert.equal(iconFor('Tests and metrics'), 'flask');
  assert.equal(iconFor('Project structure'), 'tree');
  assert.equal(iconFor('Something else'), 'dot');
});

test('routes survive a reload', () => {
  assert.deepEqual(parseRoute('#/docs/readme/tests'),
    { view: 'docs', doc: 'readme', section: 'tests' });
  assert.deepEqual(parseRoute('#/docs/api'),
    { view: 'docs', doc: 'api', section: null });
  assert.deepEqual(parseRoute('#/play/ai'), { view: 'play', mode: 'ai' });
  assert.deepEqual(parseRoute(''), { view: 'play', mode: 'pvp' });
});

test('address helpers agree with the parser', () => {
  assert.equal(docsHash('readme', 'tests'), '#/docs/readme/tests');
  assert.equal(playHash('ai'), '#/play/ai');
});

test('html is escaped before markup is added', () => {
  assert.equal(escapeHtml('<b>"x"</b>'), '&lt;b&gt;&quot;x&quot;&lt;/b&gt;');
});

test('markdown renders lists, tables and code', () => {
  const html = renderMarkdown([
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
  ].join('\n'));
  assert.equal(html.includes('<strong>bold</strong>'), true);
  assert.equal(html.includes('<ul><li>one</li></ul>'), true);
  assert.equal(html.includes('<th>a</th><th>b</th>'), true);
  assert.equal(html.includes('<pre><code>&lt;x&gt;</code></pre>'), true);
});
