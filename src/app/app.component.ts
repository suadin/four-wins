import { ChangeDetectionStrategy, Component, computed, inject, signal, VERSION } from '@angular/core';
import { getAvailableRow } from './game/game-logic';
import { GameStore } from './game/game.store';
import { COLS, ROWS } from './game/game.types';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  protected readonly store = inject(GameStore);
  protected readonly angularVersion = VERSION.full;
  protected readonly hoveredColumn = signal<number | null>(null);
  protected readonly columnIndexes = Array.from({ length: COLS }, (_, index) => index);
  protected readonly rowIndexes = Array.from({ length: ROWS }, (_, index) => index);

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
}
