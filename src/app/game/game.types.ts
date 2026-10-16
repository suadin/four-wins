export const ROWS = 6;
export const COLS = 7;

export type Player = 1 | 2;
export type Cell = 0 | Player;
/** Board indexed as board[row][column]; row 0 is the top row. */
export type Board = Cell[][];
export type GameMode = 'pvp' | 'ai';
export type GameStatus = 'playing' | 'won' | 'draw';
export type CellPosition = readonly [row: number, col: number];
/** `line` = four in a row, `block` = a filled 2x2 square. */
export type WinType = 'line' | 'block';

/** Both players, in turn order. */
export const ALL_PLAYERS: readonly Player[] = [1, 2];

export interface Win {
  type: WinType;
  cells: CellPosition[];
}

/** State of a player's one-time dark power disc. */
export interface PowerState {
  /** The dark disc sitting on the board, still waiting to be used. */
  armed: CellPosition | null;
  /** True once the disc has been dropped dark or already converted with. */
  spent: boolean;
}
