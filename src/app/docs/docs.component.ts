import { Component, computed, HostListener, input, output, signal } from '@angular/core';
import { Doc, docsHash, renderMarkdown, splitDocument } from './reader';

interface Source {
  slug: string;
  title: string;
  file: string;
  raw?: boolean;
}

const SOURCES: Source[] = [
  { slug: 'readme', title: 'README', file: 'README.md' },
  { slug: 'api', title: 'API', file: 'docs/openapi.yaml', raw: true },
];

@Component({
  selector: 'app-docs',
  imports: [],
  templateUrl: './docs.component.html',
  styleUrl: './docs.component.css',
})
export class DocsComponent {
  readonly docSlug = input('readme');
  readonly sectionSlug = input<string | null>(null);
  readonly navigate = output<string>();
  readonly closed = output<void>();

  private readonly loaded = signal<Doc[]>([]);
  private readonly failed = signal('');
  protected readonly docs = this.loaded.asReadonly();
  protected readonly error = this.failed.asReadonly();

  protected readonly currentDoc = computed(() => {
    const docs = this.loaded();
    return docs.find((item) => item.slug === this.docSlug()) ?? docs[0] ?? null;
  });

  protected readonly currentPage = computed(() => {
    const doc = this.currentDoc();
    if (!doc) {
      return null;
    }
    return doc.pages.find((item) => item.slug === this.sectionSlug()) ?? doc.pages[0] ?? null;
  });

  protected readonly html = computed(() => {
    const page = this.currentPage();
    return page ? renderMarkdown(page.markdown) : '';
  });

  constructor() {
    this.load();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closed.emit();
  }

  protected openDoc(slug: string): void {
    this.navigate.emit(docsHash(slug));
  }

  protected openSection(slug: string): void {
    const doc = this.currentDoc();
    if (doc) {
      this.navigate.emit(docsHash(doc.slug, slug));
    }
  }

  protected onBodyClick(event: MouseEvent): void {
    const link = (event.target as HTMLElement).closest('a[data-doc-file], a[data-doc-anchor]');
    if (!link) {
      return;
    }
    const file = link.getAttribute('data-doc-file');
    const anchor = (link.getAttribute('data-doc-anchor') ?? '').replace(/^#/, '');
    const slug = this.docSlugFor(file);
    if (!slug) {
      return;
    }
    event.preventDefault();
    this.navigate.emit(docsHash(slug, anchor || null));
  }

  private docSlugFor(file: string | null): string | null {
    if (!file) {
      return this.currentDoc()?.slug ?? null;
    }
    const name = file.toLowerCase();
    if (name === 'readme.md') {
      return 'readme';
    }
    if (name === 'openapi.yaml' || name === 'api') {
      return 'api';
    }
    return null;
  }

  private async load(): Promise<void> {
    const docs: Doc[] = [];
    for (const source of SOURCES) {
      try {
        const response = await fetch(source.file, { cache: 'no-store' });
        if (!response.ok) {
          continue;
        }
        const text = await response.text();
        docs.push(splitDocument(source.slug, source.title,
          source.raw ? `# ${source.title}\n\n## OpenAPI definition\n\n\`\`\`yaml\n${text}\n\`\`\`` : text));
      } catch {
        // A missing document is not fatal: the other tab still works.
      }
    }
    this.loaded.set(docs);
    if (!docs.length) {
      this.failed.set('The documentation is not part of this build.');
    }
  }
}
