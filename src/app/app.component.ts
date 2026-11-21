import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { getAvailableRow } from './game/game-logic';
import { GameStore } from './game/game.store';
import { COLS, GameMode, Player, PowerState, ROWS } from './game/game.types';

type PowerView = 'available' | 'armed' | 'spent';

/** The game's routing: the play view carries its mode in the hash. */
function playHash(mode: GameMode): string {
  return `#/play/${mode}`;
}

@Component({
  selector: 'app-root',
  imports: [MatButtonModule, MatButtonToggleModule, MatCardModule, MatToolbarModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnDestroy {
  protected readonly store = inject(GameStore);
  protected readonly hoveredColumn = signal<number | null>(null);
  protected readonly darkDropMode = signal(false);
  protected readonly columnIndexes = Array.from({ length: COLS }, (_, index) => index);
  protected readonly rowIndexes = Array.from({ length: ROWS }, (_, index) => index);

  private readonly onHashChange = (): void => this.applyRoute();

  constructor() {
    window.addEventListener('hashchange', this.onHashChange);
    this.applyRoute();
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

  protected navigate(hash: string): void {
    if (location.hash === hash) {
      this.applyRoute();
      return;
    }
    location.hash = hash;
  }

  private applyRoute(): void {
    const mode: GameMode = /^#\/play\/ai$/.test(location.hash) ? 'ai' : 'pvp';
    if (this.store.mode() !== mode) {
      this.store.selectMode(mode);
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
