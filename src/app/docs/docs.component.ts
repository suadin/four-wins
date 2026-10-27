import { Component, computed, HostListener, inject, input, output, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  DOC_SOURCES,
  Doc,
  docSlugForFile,
  docsHash,
  iconsFor,
  renderMarkdown,
  composeSpecs,
  splitDocument,
} from './reader';
import { RequirementSet } from '../metrics';
import { TooltipDirective } from '../ui/tooltip.directive';

const ICONS: Record<string, string> = {
  play: '<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>',
  install:
    '<path d="M12 3v11m0 0 4-4m-4 4-4-4M5 20h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  gamepad:
    '<rect x="3" y="7" width="18" height="10" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 10v4M6 12h4M16 11.5h.01M18 13.5h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  layers:
    '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 17l9 5 9-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  terminal:
    '<rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="m7 9 3 3-3 3M13 15h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  plug: '<path d="M9 3v5M15 3v5M7 8h10v4a5 5 0 0 1-5 5 5 5 0 0 1-5-5V8ZM12 17v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  tree: '<path d="M6 4v10a2 2 0 0 0 2 2h10M6 9h5M18 12v4M18 19.5h.01" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  clipboard:
    '<rect x="5" y="4" width="14" height="17" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 4V3h6v1M8.5 13l2.5 2.5L15.5 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  browser:
    '<rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 9h18" fill="none" stroke="currentColor" stroke-width="2"/><path d="m10 12 5 3-5 3z" fill="currentColor" stroke="none"/>',
  shield:
    '<path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  sliders:
    '<path d="M4 7h10M18 7h2M4 17h4M12 17h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="16" cy="7" r="2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="10" cy="17" r="2" fill="none" stroke="currentColor" stroke-width="2"/>',
  server:
    '<rect x="3" y="4" width="18" height="6" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><rect x="3" y="14" width="18" height="6" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 7h.01M7 17h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  pages:
    '<rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 9h18M7 7h.01M10 7h.01" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  home: '<path d="m4 11 8-7 8 7v8a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  pen: '<path d="m4 20 4-1 10-10-3-3L5 16l-1 4ZM13 8l3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  scale:
    '<path d="M12 3v18M7 21h10M5 7h14M5 7l-2 5a3 3 0 0 0 6 0L7 7M19 7l-2 5a3 3 0 0 0 6 0l-2-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  sparkle:
    '<path d="M12 3l1.7 4.6L18 9l-4.3 1.4L12 15l-1.7-4.6L6 9l4.3-1.4L12 3ZM18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9L18 15Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
  bookmark:
    '<path d="M6 3h12v18l-6-4-6 4V3Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  sync: '<path d="M20 12a8 8 0 0 1-13.6 5.7M4 12a8 8 0 0 1 13.6-5.7M20 5v4h-4M4 19v-4h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  book: '<path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19v20H7.5A2.5 2.5 0 0 1 5 19.5v-15Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 7.5h6M9 11.5h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  dot: '<circle cx="12" cy="12" r="4" fill="currentColor"/>',
};

@Component({
  selector: 'app-docs',
  imports: [TooltipDirective],
  templateUrl: './docs.component.html',
  styleUrl: './docs.component.css',
})
export class DocsComponent {
  readonly docSlug = input('readme');
  readonly sectionSlug = input<string | null>(null);
  readonly requirements = input<Record<string, RequirementSet>>({});
  readonly navigate = output<string>();
  readonly closed = output<void>();

  private readonly sanitizer = inject(DomSanitizer);
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

  protected readonly icons = computed(() => iconsFor(this.currentDoc()?.pages ?? []));

  protected readonly html = computed(() => {
    const page = this.currentPage();
    return page ? renderMarkdown(page.markdown) : '';
  });

  /** The renderer escapes its input; the bypass keeps the reader link markers. */
  protected readonly safeHtml = computed(() => this.sanitizer.bypassSecurityTrustHtml(this.html()));

  protected readonly testNames = computed(() => {
    const doc = this.currentDoc();
    if (!doc) {
      return null;
    }
    const set = this.requirements()[doc.slug];
    if (!set || (!set.unit?.length && !set.e2e?.length)) {
      return null;
    }
    return { unit: set.unit ?? [], e2e: set.e2e ?? [] };
  });

  constructor() {
    this.load();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closed.emit();
  }

  protected icon(index: number): SafeHtml {
    const name = this.icons()[index] ?? 'dot';
    const body = ICONS[name] ?? ICONS['dot'];
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">${body}</svg>`,
    );
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
    const slug = file ? docSlugForFile(file) : (this.currentDoc()?.slug ?? null);
    if (!slug) {
      return;
    }
    event.preventDefault();
    this.navigate.emit(docsHash(slug, anchor || null));
  }

  private async load(): Promise<void> {
    const docs: Doc[] = [];
    for (const source of DOC_SOURCES) {
      try {
        const response = await fetch(source.file, { cache: 'no-store' });
        if (!response.ok) {
          continue;
        }
        const text = await response.text();
        let markdown = text;
        if (source.changelog) {
          const notes = await fetch(source.changelog, { cache: 'no-store' });
          if (notes.ok) {
            markdown = composeSpecs(text, await notes.text());
          }
        }
        if (source.raw) {
          markdown = `# ${source.title}\n\n## OpenAPI definition\n\n\`\`\`yaml\n${markdown}\n\`\`\``;
        }
        docs.push(splitDocument(source.slug, source.title, markdown, source.continuous));
      } catch {
        // A missing document is not fatal: the other tabs still work.
      }
    }
    this.loaded.set(docs);
    if (!docs.length) {
      this.failed.set('The documentation is not part of this build.');
    }
  }
}
