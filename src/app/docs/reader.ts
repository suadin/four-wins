// Pure helpers for the in-page documentation reader.
//
// The same rules as in die-wand and diary: one page per level-two heading,
// deep links such as #/docs/readme/tests, and a small Markdown renderer.

export interface DocPage {
  title: string;
  slug: string;
  markdown: string;
}

export interface Doc {
  slug: string;
  title: string;
  pages: DocPage[];
}

export interface DocSource {
  slug: string;
  title: string;
  file: string;
  changelog?: string;
  continuous?: boolean;
  raw?: boolean;
}

/** The reader's document set. README, SPECS and BASIC SPECS are the footer items. */
export const DOC_SOURCES: readonly DocSource[] = [
  { slug: 'readme', title: 'README', file: 'README.md' },
  {
    slug: 'app-specs',
    title: 'SPECS',
    file: 'docs/APP-SPECS.md',
    changelog: 'docs/RELEASE-NOTES.md',
  },
  { slug: 'basic-specs', title: 'BASIC SPECS', file: 'docs/BASIC-SPECS.md' },
  { slug: 'api', title: 'API', file: 'docs/openapi.yaml', raw: true, continuous: true },
];

export const DOC_SLUGS: readonly string[] = DOC_SOURCES.map((source) => source.slug);

const BASE_TO_SLUG = new Map(
  DOC_SOURCES.map((source) => [source.file.split('/').pop()?.toLowerCase() ?? '', source.slug]),
);
BASE_TO_SLUG.set('release-notes.md', 'app-specs');

/** Builds SPECS with one continuous Changelog page before the app rules. */
export function composeSpecs(appSpecs: string, releaseNotes: string): string {
  const notes = releaseNotes
    .replace(/^#\s+.*$/m, '')
    .replace(/^##\s+/gm, '### ')
    .trim();
  const rules = appSpecs.replace(/^#\s+.*$/m, '').trim();
  return `# SPECS\n\n## Changelog\n\n${notes}\n\n${rules}\n`;
}

export type Route =
  { view: 'play'; mode: 'pvp' | 'ai' } | { view: 'docs'; doc: string; section: string | null };

const SLUG = /[^a-z0-9]+/g;

export function slugify(value: string): string {
  return (
    String(value ?? '')
      .toLowerCase()
      .replace(SLUG, '-')
      .replace(/^-+|-+$/g, '') || 'page'
  );
}

export function isDocSlug(slug: string): boolean {
  return DOC_SLUGS.includes(slug);
}

/** Maps a link target such as `docs/APP-SPECS.md` or `BASIC-SPECS.md` to a tab. */
export function docSlugForFile(file: string): string | null {
  const name =
    String(file ?? '')
      .split('/')
      .pop()
      ?.toLowerCase() ?? '';
  return BASE_TO_SLUG.get(name) ?? null;
}

export function splitDocument(
  slug: string,
  title: string,
  markdown: string,
  continuous = false,
): Doc {
  const text = String(markdown ?? '')
    .replace(/\r\n/g, '\n')
    .trim();
  if (continuous) {
    const body = text.replace(/^#\s+.*(?:\n|$)/, '').trim();
    return { slug, title, pages: [{ title, slug: 'all', markdown: body || text }] };
  }

  const pages: DocPage[] = [];
  const used: Record<string, number> = {};
  let currentTitle = 'Overview';
  let currentLines: string[] = [];

  const push = (pageTitle: string, lines: string[]): void => {
    const body = lines.join('\n').trim();
    if (!body) {
      return;
    }
    let pageSlug = slugify(pageTitle);
    const seen = used[pageSlug] ?? 0;
    used[pageSlug] = seen + 1;
    if (seen) {
      pageSlug = `${pageSlug}-${seen + 1}`;
    }
    pages.push({ title: pageTitle, slug: pageSlug, markdown: body });
  };

  for (const line of text.split('\n')) {
    if (line.startsWith('# ') && pages.length === 0 && !currentLines.join('').trim()) {
      continue;
    }
    const heading = /^##\s+(.+?)\s*$/.exec(line);
    if (heading) {
      push(currentTitle, currentLines);
      currentTitle = heading[1].trim();
      currentLines = [];
      continue;
    }
    currentLines.push(line);
  }
  push(currentTitle, currentLines);
  return { slug, title, pages };
}

export function docsHash(doc: string, section: string | null = null): string {
  return section ? `#/docs/${doc}/${section}` : `#/docs/${doc}`;
}

export function playHash(mode: 'pvp' | 'ai'): string {
  return `#/play/${mode}`;
}

export function parseRoute(hash: string): Route {
  const raw = String(hash ?? '').replace(/^#\/?/, '');
  const [kind, first, second] = raw.split('/');
  if (kind === 'docs') {
    return { view: 'docs', doc: first || 'readme', section: second || null };
  }
  return { view: 'play', mode: kind === 'play' && first === 'ai' ? 'ai' : 'pvp' };
}

/** Parses a hash and replaces unknown documents with the start page. */
export function resolveRoute(hash: string): Route {
  const route = parseRoute(hash);
  if (route.view === 'docs' && !isDocSlug(route.doc)) {
    return { view: 'docs', doc: 'readme', section: null };
  }
  return route;
}

/** The canonical address for a route, used to rewrite unknown addresses. */
export function routeHash(route: Route): string {
  return route.view === 'docs' ? docsHash(route.doc, route.section) : playHash(route.mode);
}

/**
 * The icon that stands for a section. Sections are navigated by icons, so the
 * mapping is data: the tooltip still gives the full heading.
 */
const ICON_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/play|start page/, 'play'],
  [/install|setup|download/, 'install'],
  [/game mode|modes|board|rules/, 'gamepad'],
  [/tech|stack|layout|surface/, 'layers'],
  [/run|local/, 'terminal'],
  [/api/, 'plug'],
  [/project|structure/, 'tree'],
  [/e2e|playwright|browser test/, 'browser'],
  [/test/, 'clipboard'],
  [/security|data|access/, 'shield'],
  [/config|setting/, 'sliders'],
  [/why|reason|own machine/, 'home'],
  [/deploy|server|host/, 'server'],
  [/footer/, 'pages'],
  [/github|pages/, 'pages'],
  [/how|written/, 'pen'],
  [/design|date|licen[cs]e/, 'scale'],
  [/feature|does|capab|dark/, 'sparkle'],
  [/bookmark|supported|source|woher/, 'bookmark'],
  [/read|chrome|automatic|sync|fresh|helper|link/, 'sync'],
  [/export|import/, 'bookmark'],
  [/documentation|guide|readme|overview|address/, 'book'],
];

const FALLBACK_ICONS: readonly string[] = [
  'bookmark',
  'sparkle',
  'scale',
  'shield',
  'sliders',
  'sync',
  'home',
  'pen',
  'pages',
  'server',
  'tree',
  'terminal',
  'layers',
  'gamepad',
  'install',
  'play',
  'book',
  'clipboard',
  'browser',
  'plug',
  'dot',
];

export function iconFor(title: string): string {
  const text = String(title ?? '').toLowerCase();
  for (const [pattern, icon] of ICON_RULES) {
    if (pattern.test(text)) {
      return icon;
    }
  }
  return 'dot';
}

/** Assigns a unique icon to every page of one document. */
export function iconsFor(pages: readonly DocPage[]): string[] {
  const used = new Set<string>();
  return pages.map((page) => {
    let icon = iconFor(page.title);
    if (used.has(icon)) {
      icon = FALLBACK_ICONS.find((candidate) => !used.has(candidate)) ?? 'dot';
    }
    used.add(icon);
    return icon;
  });
}

export function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineMarkdown(text: string): string {
  const codes: string[] = [];
  let output = escapeHtml(text).replace(/`([^`]+)`/g, (_, code: string) => {
    codes.push(code);
    return `\u0000${codes.length - 1}\u0000`;
  });
  output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  output = output.replace(
    /\[([^\]]+)\]\((#[A-Za-z0-9-]+)\)/g,
    (_, label: string, anchor: string) =>
      `<a href="#" data-doc-anchor="${escapeHtml(anchor)}">${label}</a>`,
  );
  output = output.replace(
    /\[([^\]]+)\]\(([^)\s]+\.(?:md|ya?ml))(#[A-Za-z0-9-]+)?\)/g,
    (_, label: string, path: string, anchor: string | undefined) => {
      const file = path.split('/').pop() ?? path;
      return (
        `<a href="#" data-doc-file="${escapeHtml(file)}"` +
        ` data-doc-anchor="${escapeHtml(anchor ?? '')}">${label}</a>`
      );
    },
  );
  output = output.replace(
    /\[([^\]]+)\]\((https?:[^)\s]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  output = output.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  output = output.replace(
    /&lt;(https?:\/\/[^\s]+?)&gt;/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  return output.replace(
    /\u0000(\d+)\u0000/g,
    (_, index: string) => `<code>${codes[Number(index)]}</code>`,
  );
}

export function renderMarkdown(markdown: string): string {
  const lines = String(markdown ?? '').split('\n');
  const html: string[] = [];
  let fence: string[] | null = null;
  let list: 'ul' | 'ol' | null = null;
  let listItem = -1;
  let paragraph: string[] = [];
  let table: string[] | null = null;

  const flushParagraph = (): void => {
    if (!paragraph.length) {
      return;
    }
    html.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
    paragraph = [];
  };
  const closeList = (): void => {
    if (list) {
      html.push(`</${list}>`);
    }
    list = null;
    listItem = -1;
  };
  const closeTable = (): void => {
    if (!table) {
      return;
    }
    const rows = table
      .filter((row) => !/^\|?[\s:|-]+\|?$/.test(row))
      .map((row) =>
        row
          .replace(/^\||\|$/g, '')
          .split('|')
          .map((cell) => cell.trim()),
      );
    if (rows.length) {
      const [head, ...body] = rows;
      html.push(
        `<table><thead><tr>${head.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join('')}</tr></thead><tbody>`,
      );
      for (const row of body) {
        html.push(`<tr>${row.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join('')}</tr>`);
      }
      html.push('</tbody></table>');
    }
    table = null;
  };
  const closeBlocks = (): void => {
    flushParagraph();
    closeList();
    closeTable();
  };

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (fence === null) {
        closeBlocks();
        fence = [];
      } else {
        html.push(`<pre><code>${escapeHtml(fence.join('\n'))}</code></pre>`);
        fence = null;
      }
      continue;
    }
    if (fence !== null) {
      fence.push(line);
      continue;
    }
    if (!line.trim()) {
      closeBlocks();
      continue;
    }
    if (line.trimStart().startsWith('|')) {
      flushParagraph();
      closeList();
      table = table ?? [];
      table.push(line.trim());
      continue;
    }
    closeTable();
    if (list && /^\s{2,}\S/.test(line)) {
      html[listItem] = html[listItem].replace(/<\/li>$/, ` ${inlineMarkdown(line.trim())}</li>`);
      continue;
    }
    const heading = /^#{1,6}\s+(.*)$/.exec(line);
    if (heading) {
      closeBlocks();
      html.push(`<h4>${inlineMarkdown(heading[1])}</h4>`);
      continue;
    }
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      flushParagraph();
      if (list !== 'ul') {
        closeList();
        html.push('<ul>');
        list = 'ul';
      }
      html.push(`<li>${inlineMarkdown(bullet[1])}</li>`);
      listItem = html.length - 1;
      continue;
    }
    const ordered = /^\s*\d+\.\s+(.*)$/.exec(line);
    if (ordered) {
      flushParagraph();
      if (list !== 'ol') {
        closeList();
        html.push('<ol>');
        list = 'ol';
      }
      html.push(`<li>${inlineMarkdown(ordered[1])}</li>`);
      listItem = html.length - 1;
      continue;
    }
    closeList();
    paragraph.push(line.trim());
  }
  if (fence !== null) {
    html.push(`<pre><code>${escapeHtml(fence.join('\n'))}</code></pre>`);
  }
  closeBlocks();
  return html.join('');
}
