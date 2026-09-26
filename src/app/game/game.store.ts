import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { createEmptyBoard, dropPiece, findWin, getBestMove, isBoardFull, opponent } from './game-logic';
import { Board, CellPosition, GameMode, GameStatus, Player } from './game.types';

export interface GameState {
  board: Board;
  currentPlayer: Player;
  mode: GameMode;
  status: GameStatus;
  winner: Player | null;
  winningCells: CellPosition[];
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
  aiThinking: false,
  moveCount: 0,
};

const AI_MOVE_DELAY_MS = 500;

export const GameStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ status, winner, currentPlayer, mode, aiThinking }) => ({
    canPlay: computed(
      () => status() === 'playing' && !aiThinking() && !(mode() === 'ai' && currentPlayer() === 2),
    ),
    statusMessage: computed(() => {
      if (status() === 'won') {
        if (mode() === 'ai') {
          return winner() === 1 ? 'You win! Well played.' : 'The AI wins this round.';
        }
        return `Player ${winner()} (${winner() === 1 ? 'red' : 'yellow'}) wins!`;
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
      const winningCells = findWin(result.board, player);
      const draw = !winningCells && isBoardFull(result.board);
      patchState(store, {
        board: result.board,
        moveCount: store.moveCount() + 1,
        status: winningCells ? 'won' : draw ? 'draw' : 'playing',
        winner: winningCells ? player : null,
        winningCells: winningCells ?? [],
        currentPlayer: winningCells || draw ? player : opponent(player),
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
