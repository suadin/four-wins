import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import {
  BLOCK_SIZE,
  createEmptyBoard,
  dropPiece,
  findWin,
  getBestMove,
  isBoardFull,
  opponent,
} from './game-logic';
import { Board, CellPosition, GameMode, GameStatus, Player, WinType } from './game.types';

export interface GameState {
  board: Board;
  currentPlayer: Player;
  mode: GameMode;
  status: GameStatus;
  winner: Player | null;
  winningCells: CellPosition[];
  winType: WinType | null;
  aiThinking: boolean;
  moveCount: number;
}

const initialState: GameState = {
  board: createEmptyBoard(),
  currentPlayer: 1,
  mode: 'pvp',
  status: 'playing',
  winner: null,
  winningCells: [],
  winType: null,
  aiThinking: false,
  moveCount: 0,
};

const AI_MOVE_DELAY_MS = 500;

export const GameStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ status, winner, currentPlayer, mode, aiThinking, winType }) => ({
    canPlay: computed(
      () => status() === 'playing' && !aiThinking() && !(mode() === 'ai' && currentPlayer() === 2),
    ),
    statusMessage: computed(() => {
      if (status() === 'won') {
        const suffix = winType() === 'block' ? ` (${BLOCK_SIZE}x${BLOCK_SIZE} block)` : '';
        if (mode() === 'ai') {
          return winner() === 1
            ? `You win! Well played.${suffix}`
            : `The AI wins this round.${suffix}`;
        }
        return `Player ${winner()} (${winner() === 1 ? 'red' : 'yellow'}) wins!${suffix}`;
      }
      if (status() === 'draw') {
        return "It's a draw - the board is full.";
      }
      if (mode() === 'ai') {
        return currentPlayer() === 2 ? 'The AI is thinking...' : 'Your turn (red)';
      }
      return `Player ${currentPlayer()}'s turn (${currentPlayer() === 1 ? 'red' : 'yellow'})`;
    }),
  })),
  withMethods((store) => {
    const applyMove = (col: number): void => {
      const player = store.currentPlayer();
      const result = dropPiece(store.board(), col, player);
      if (!result) {
        return;
      }
      const win = findWin(result.board, player);
      const draw = !win && isBoardFull(result.board);
      patchState(store, {
        board: result.board,
        moveCount: store.moveCount() + 1,
        status: win ? 'won' : draw ? 'draw' : 'playing',
        winner: win ? player : null,
        winningCells: win ? win.cells : [],
        winType: win ? win.type : null,
        currentPlayer: win || draw ? player : opponent(player),
      });
    };

    return {
      selectMode(mode: GameMode): void {
        patchState(store, { ...initialState, board: createEmptyBoard(), mode });
      },
      reset(): void {
        patchState(store, { ...initialState, board: createEmptyBoard(), mode: store.mode() });
      },
      playColumn(col: number): void {
        if (!store.canPlay()) {
          return;
        }
        applyMove(col);
        if (store.status() === 'playing' && store.mode() === 'ai' && store.currentPlayer() === 2) {
          patchState(store, { aiThinking: true });
          setTimeout(() => {
            const aiColumn = getBestMove(store.board(), 2);
            if (aiColumn >= 0) {
              applyMove(aiColumn);
            }
            patchState(store, { aiThinking: false });
          }, AI_MOVE_DELAY_MS);
        }
      },
    };
  }),
);
