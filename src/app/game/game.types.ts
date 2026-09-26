export const ROWS = 6;
export const COLS = 7;

export type Player = 1 | 2;
export type Cell = 0 | Player;
/** Board indexed as board[row][column]; row 0 is the top row. */
export type Board = Cell[][];
export type GameMode = 'pvp' | 'ai';
export type GameStatus = 'playing' | 'won' | 'draw';
export type CellPosition = readonly [row: number, col: number];
