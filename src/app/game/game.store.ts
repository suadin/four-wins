import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import {
  BLOCK_SIZE,
  convertNeighbours,
  createEmptyBoard,
  dropPiece,
  findEnemyNeighbours,
  findWin,
  getAiAction,
  getBestMove,
  isBoardFull,
  opponent,
} from './game-logic';
import {
  ALL_PLAYERS,
  Board,
  CellPosition,
  GameMode,
  GameStatus,
  Player,
  PowerState,
  WinType,
} from './game.types';

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
  /** One-time dark power disc per player. */
  powers: Record<Player, PowerState>;
}

function createPowers(): Record<Player, PowerState> {
  return {
    1: { armed: null, spent: false },
    2: { armed: null, spent: false },
  };
}

function createPosition(row: number, col: number): CellPosition {
  return [row, col];
}

const AI_MOVE_DELAY_MS = 500;
const AI_PLAYER: Player = 2;

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
  powers: createPowers(),
};

/**
 * Clears armed discs that no longer sit on a disc of their owner. Used after a conversion,
 * because an armed disc belongs to the opponent as soon as it has been flipped.
 */
function pruneArmedDiscs(
  board: Board,
  powers: Record<Player, PowerState>,
  owner: Player,
): Record<Player, PowerState> {
  const next: Record<Player, PowerState> = { ...powers };
  for (const player of ALL_PLAYERS) {
    const armed = next[player].armed;
    if (armed === null) {
      continue;
    }
    if (player === owner || board[armed[0]][armed[1]] !== player) {
      next[player] = { armed: null, spent: true };
    }
  }
  return next;
}

export const GameStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ status, winner, currentPlayer, mode, aiThinking, winType, powers }) => ({
    canPlay: computed(
      () => status() === 'playing' && !aiThinking() && !(mode() === 'ai' && currentPlayer() === AI_PLAYER),
    ),
    /** True while the player to move still holds their unused dark power disc. */
    hasDarkDisc: computed(() => {
      const power = powers()[currentPlayer()];
      return !power.spent && power.armed === null;
    }),
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
    /** Writes the resulting board and hands the turn on, unless the game is over. */
    const commitBoard = (board: Board, player: Player): void => {
      const win = findWin(board, player);
      const draw = !win && isBoardFull(board);
      patchState(store, {
        board,
        moveCount: store.moveCount() + 1,
        status: win ? 'won' : draw ? 'draw' : 'playing',
        winner: win ? player : null,
        winningCells: win ? win.cells : [],
        winType: win ? win.type : null,
        currentPlayer: win || draw ? player : opponent(player),
      });
    };

    const dropColumn = (player: Player, col: number, dark: boolean): void => {
      const result = dropPiece(store.board(), col, player);
      if (!result) {
        return;
      }
      if (dark) {
        const powers: Record<Player, PowerState> = { ...store.powers() };
        powers[player] = { armed: createPosition(result.row, col), spent: true };
        patchState(store, { powers });
      }
      commitBoard(result.board, player);
    };

    /**
     * Turns every enemy disc around the armed dark disc into a disc of `player`, which counts
     * as a normal disc from then on. Refused when there is no enemy disc to convert, so a
     * misclick cannot burn the power without doing anything.
     */
    const activateDarkDisc = (player: Player, row: number, col: number): void => {
      const board = store.board();
      if (findEnemyNeighbours(board, row, col, player).length === 0) {
        return;
      }
      const converted = convertNeighbours(board, row, col, player);
      patchState(store, { powers: pruneArmedDiscs(converted, store.powers(), player) });
      commitBoard(converted, player);
    };

    /** Plays the AI turn after a human move, including its own dark power disc. */
    const runAiTurn = (): void => {
      if (store.status() !== 'playing' || store.mode() !== 'ai' || store.currentPlayer() !== AI_PLAYER) {
        return;
      }
      patchState(store, { aiThinking: true });
      setTimeout(() => {
        const power = store.powers()[AI_PLAYER];
        const action = getAiAction(store.board(), AI_PLAYER, power.armed, !power.spent && power.armed === null);
        if (action?.kind === 'activate' && action.cell) {
          activateDarkDisc(AI_PLAYER, action.cell[0], action.cell[1]);
        } else if (action) {
          dropColumn(AI_PLAYER, action.column, action.kind === 'dark');
        }
        patchState(store, { aiThinking: false });
      }, AI_MOVE_DELAY_MS);
    };

    return {
      selectMode(mode: GameMode): void {
        patchState(store, { ...initialState, board: createEmptyBoard(), powers: createPowers(), mode });
      },
      reset(): void {
        patchState(store, {
          ...initialState,
          board: createEmptyBoard(),
          powers: createPowers(),
          mode: store.mode(),
        });
      },
      playColumn(col: number): void {
        if (!store.canPlay()) {
          return;
        }
        dropColumn(store.currentPlayer(), col, false);
        runAiTurn();
      },
      /** Drops the one-time dark power disc of the player to move into the given column. */
      playDarkColumn(col: number): void {
        if (!store.canPlay() || !store.hasDarkDisc()) {
          return;
        }
        dropColumn(store.currentPlayer(), col, true);
        runAiTurn();
      },
      /** Uses the armed dark disc at the given cell to convert the discs around it. */
      useDarkDisc(row: number, col: number): void {
        if (!store.canPlay()) {
          return;
        }
        const player = store.currentPlayer();
        const armed = store.powers()[player].armed;
        if (!armed || armed[0] !== row || armed[1] !== col) {
          return;
        }
        activateDarkDisc(player, row, col);
        runAiTurn();
      },
    };
  }),
);