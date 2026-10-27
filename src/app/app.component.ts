import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { DocsComponent } from './docs/docs.component';
import { docsHash, parseRoute, playHash, resolveRoute, routeHash } from './docs/reader';
import { getAvailableRow } from './game/game-logic';
import { GameStore } from './game/game.store';
import { COLS, GameMode, Player, PowerState, ROWS } from './game/game.types';
import { metricView, MetricsFile } from './metrics';
import { TooltipDirective } from './ui/tooltip.directive';

type PowerView = 'available' | 'armed' | 'spent';

@Component({
  selector: 'app-root',
  imports: [DocsComponent, TooltipDirective],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnDestroy {
  protected readonly store = inject(GameStore);
  protected readonly route = signal(parseRoute(location.hash));
  protected readonly showDocs = computed(() => this.route().view === 'docs');
  protected readonly docsSlug = computed(() => {
    const route = this.route();
    return route.view === 'docs' ? route.doc : 'readme';
  });
  protected readonly docsSection = computed(() => {
    const route = this.route();
    return route.view === 'docs' ? route.section : null;
  });
  protected readonly metrics = signal<MetricsFile>({});
  protected readonly unitView = computed(() => metricView('Unit', this.metrics().unit));
  protected readonly e2eView = computed(() => metricView('E2E', this.metrics().e2e));
  protected readonly requirements = computed(() => this.metrics().requirements ?? {});
  protected readonly hoveredColumn = signal<number | null>(null);
  /** Turns a plain click into a dark drop, for players without a right mouse button. */
  protected readonly darkDropMode = signal(false);
  protected readonly columnIndexes = Array.from({ length: COLS }, (_, index) => index);
  protected readonly rowIndexes = Array.from({ length: ROWS }, (_, index) => index);

  private readonly onHashChange = (): void => this.applyRoute();

  constructor() {
    window.addEventListener('hashchange', this.onHashChange);
    this.applyRoute();
    this.loadMetrics();
  }

  ngOnDestroy(): void {
    window.removeEventListener('hashchange', this.onHashChange);
  }

  protected setMode(mode: GameMode): void {
    this.darkDropMode.set(false);
    this.store.selectMode(mode);
    this.navigate(playHash(mode));
  }

  protected newGame(): void {
    this.darkDropMode.set(false);
    this.store.reset();
  }

  protected openDocs(): void {
    this.navigate(docsHash('readme'));
  }

  protected closeDocs(): void {
    this.navigate(playHash(this.store.mode()));
  }

  protected navigate(hash: string): void {
    if (location.hash === hash) {
      this.applyRoute();
      return;
    }
    location.hash = hash;
  }

  private applyRoute(): void {
    const hash = location.hash;
    const route = resolveRoute(hash);
    const canonical = routeHash(route);
    if (hash !== '' && hash !== '#' && hash !== '#/' && hash !== canonical) {
      this.navigate(canonical);
      return;
    }
    this.route.set(route);
    if (route.view === 'play' && this.store.mode() !== route.mode) {
      this.store.selectMode(route.mode);
    }
  }

  private async loadMetrics(): Promise<void> {
    try {
      const response = await fetch('test-metrics.json', { cache: 'no-store' });
      if (!response.ok) {
        return;
      }
      this.metrics.set((await response.json()) as MetricsFile);
    } catch {
      // No metrics file: the footer keeps "not executed".
    }
  }

  /** Row where a disc would land in the currently hovered column (-1 = no preview). */
  protected readonly previewRow = computed(() => {
    const col = this.hoveredColumn();
    if (col === null || !this.store.canPlay()) {
      return -1;
    }
    return getAvailableRow(this.store.board(), col);
  });

  protected isWinningCell(row: number, col: number): boolean {
    return this.store.winningCells().some(([winRow, winCol]) => winRow === row && winCol === col);
  }

  /** True while a dark disc of `player` sits on this cell. */
  protected isDarkDisc(row: number, col: number): boolean {
    const powers = this.store.powers();
    return this.isArmedAt(powers[1], row, col, 1) || this.isArmedAt(powers[2], row, col, 2);
  }

  /** True for the dark disc of the player to move, which is the one that can be used. */
  protected isUsableDarkDisc(row: number, col: number): boolean {
    const player = this.store.currentPlayer();
    return this.isArmedAt(this.store.powers()[player], row, col, player);
  }

  protected powerView(player: Player): PowerView {
    const power = this.store.powers()[player];
    if (power.armed) {
      return 'armed';
    }
    return power.spent ? 'spent' : 'available';
  }

  protected powerLabel(player: Player): string {
    const view = this.powerView(player);
    if (view === 'armed') {
      return 'Dark disc on board';
    }
    if (view === 'spent') {
      return 'Used up';
    }
    return 'Dark disc ready';
  }

  protected onColumnClick(col: number): void {
    if (this.darkDropMode() && this.store.hasDarkDisc()) {
      this.store.playDarkColumn(col);
      this.darkDropMode.set(false);
      return;
    }
    this.store.playColumn(col);
  }

  protected toggleDarkDrop(): void {
    this.darkDropMode.set(!this.darkDropMode());
  }

  protected onContextMenu(event: MouseEvent, col: number): void {
    event.preventDefault();
    this.store.playDarkColumn(col);
  }

  protected onCellClick(event: MouseEvent, row: number, col: number): void {
    if (!this.isUsableDarkDisc(row, col)) {
      return;
    }
    event.stopPropagation();
    this.store.useDarkDisc(row, col);
  }

  private isArmedAt(power: PowerState, row: number, col: number, player: Player): boolean {
    const armed = power.armed;
    return (
      armed !== null &&
      armed[0] === row &&
      armed[1] === col &&
      this.store.board()[row][col] === player
    );
  }
}
