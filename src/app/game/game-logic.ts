import { COLS, ROWS } from './game.types';
import type { Board, Cell, CellPosition, Player, Win } from './game.types';

/** Search depth for the minimax AI. 6 gives a strong opponent with <150 ms response time. */
export const AI_DEPTH = 6;

/** Edge length of the square that also wins, next to four in a row. */
export const BLOCK_SIZE = 2;

/** Number of discs a block needs, i.e. BLOCK_SIZE squared. */
const BLOCK_CELLS = BLOCK_SIZE * BLOCK_SIZE;

/** Center-first move ordering improves alpha-beta pruning and prefers strong center play. */
const MOVE_ORDER = [3, 2, 4, 1, 5, 0, 6];

const CENTER_COL = Math.floor(COLS / 2);

const DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], // horizontal
  [1, 0], // vertical
  [1, 1], // diagonal down-right
  [1, -1], // diagonal down-left
];

/** Offsets of the eight cells around a disc, one of which the dark power disc can convert. */
const NEIGHBOURS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

export function createEmptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(0));
}

export function opponent(player: Player): Player {
  return player === 1 ? 2 : 1;
}

export function getValidColumns(board: Board): number[] {
  const columns: number[] = [];
  for (let col = 0; col < COLS; col++) {
    if (board[0][col] === 0) {
      columns.push(col);
    }
  }
  return columns;
}

/** Returns the row index a piece would land on in the given column, or -1 if the column is full. */
export function getAvailableRow(board: Board, col: number): number {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === 0) {
      return row;
    }
  }
  return -1;
}

/** Returns a new board with the piece dropped, or null if the column is full. */
export function dropPiece(board: Board, col: number, player: Player): { board: Board; row: number } | null {
  const row = getAvailableRow(board, col);
  if (row < 0) {
    return null;
  }
  const next: Board = board.map((cells, rowIndex) =>
    rowIndex === row ? cells.map((cell, colIndex) => (colIndex === col ? player : cell)) : cells.slice(),
  );
  return { board: next, row };
}

/** Returns the enemy discs in the eight cells around (row, col). Empty cells are ignored. */
export function findEnemyNeighbours(board: Board, row: number, col: number, player: Player): CellPosition[] {
  const other = opponent(player);
  const cells: CellPosition[] = [];
  for (const [dr, dc] of NEIGHBOURS) {
    const neighbourRow = row + dr;
    const neighbourCol = col + dc;
    if (neighbourRow < 0 || neighbourRow >= ROWS || neighbourCol < 0 || neighbourCol >= COLS) {
      continue;
    }
    if (board[neighbourRow][neighbourCol] === other) {
      cells.push([neighbourRow, neighbourCol]);
    }
  }
  return cells;
}

/** Returns a new board in which the single disc at (row, col) now belongs to `player`. */
export function convertDisc(board: Board, row: number, col: number, player: Player): Board {
  return board.map((cells, rowIndex) =>
    rowIndex === row ? cells.map((cell, colIndex) => (colIndex === col ? player : cell)) : cells.slice(),
  );
}

/**
 * Returns the enemy disc around (row, col) that is worth the most to convert, measured by the
 * board evaluation, or null when no enemy disc surrounds it.
 */
export function findConversionTarget(board: Board, row: number, col: number, player: Player): CellPosition | null {
  let best: CellPosition | null = null;
  let bestValue = -Infinity;
  for (const target of findEnemyNeighbours(board, row, col, player)) {
    const value = scorePosition(convertDisc(board, target[0], target[1], player), player);
    if (value > bestValue) {
      bestValue = value;
      best = target;
    }
  }
  return best;
}

/** Returns the four winning cell positions for the player, or null if there is no line. */
export function findLine(board: Board, player: Player): CellPosition[] | null {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (board[row][col] !== player) {
        continue;
      }
      for (const [dr, dc] of DIRECTIONS) {
        const cells: CellPosition[] = [[row, col]];
        for (let step = 1; step < 4; step++) {
          const nextRow = row + dr * step;
          const nextCol = col + dc * step;
          if (
            nextRow < 0 ||
            nextRow >= ROWS ||
            nextCol < 0 ||
            nextCol >= COLS ||
            board[nextRow][nextCol] !== player
          ) {
            break;
          }
          cells.push([nextRow, nextCol]);
        }
        if (cells.length === 4) {
          return cells;
        }
      }
    }
  }
  return null;
}

/**
 * Returns the cell positions of a filled BLOCK_SIZE square for the player,
 * or null if there is none.
 */
export function findBlock(board: Board, player: Player): CellPosition[] | null {
  for (let row = 0; row <= ROWS - BLOCK_SIZE; row++) {
    for (let col = 0; col <= COLS - BLOCK_SIZE; col++) {
      const cells: CellPosition[] = [];
      let filled = true;
      for (let dr = 0; dr < BLOCK_SIZE && filled; dr++) {
        for (let dc = 0; dc < BLOCK_SIZE; dc++) {
          if (board[row + dr][col + dc] !== player) {
            filled = false;
            break;
          }
          cells.push([row + dr, col + dc]);
        }
      }
      if (filled) {
        return cells;
      }
    }
  }
  return null;
}

/**
 * Returns the winning cells for the player, or null if there is no win.
 * A line of four takes precedence over a block when a single move achieves both.
 */
export function findWin(board: Board, player: Player): Win | null {
  const line = findLine(board, player);
  if (line) {
    return { type: 'line', cells: line };
  }
  const block = findBlock(board, player);
  if (block) {
    return { type: 'block', cells: block };
  }
  return null;
}

export function isBoardFull(board: Board): boolean {
  return getValidColumns(board).length === 0;
}

function scoreWindow(window: Cell[], player: Player): number {
  const other = opponent(player);
  const mine = window.filter((cell) => cell === player).length;
  const theirs = window.filter((cell) => cell === other).length;
  const empty = window.filter((cell) => cell === 0).length;

  if (mine === 4) return 100_000;
  if (mine === 3 && empty === 1) return 50;
  if (mine === 2 && empty === 2) return 10;
  if (theirs === 3 && empty === 1) return -80;
  if (theirs === 2 && empty === 2) return -5;
  return 0;
}

/**
 * Scores a single BLOCK_SIZE square window. A completed block is worth as much as a line,
 * but a one-disc-short threat counts for less than a line threat because it is covered by
 * several overlapping windows at once.
 */
function scoreBlockWindow(window: Cell[], player: Player): number {
  const other = opponent(player);
  const mine = window.filter((cell) => cell === player).length;
  const theirs = window.filter((cell) => cell === other).length;

  if (mine === BLOCK_CELLS) return 100_000;
  if (theirs === BLOCK_CELLS) return -100_000;
  if (mine === BLOCK_CELLS - 1) return 40;
  if (theirs === BLOCK_CELLS - 1) return -70;
  return 0;
}

/** Heuristic evaluation of the board from the perspective of `player`. */
export function scorePosition(board: Board, player: Player): number {
  let score = 0;

  // Prefer the center column: it participates in the most winning lines.
  for (let row = 0; row < ROWS; row++) {
    if (board[row][CENTER_COL] === player) {
      score += 6;
    }
  }

  // Horizontal windows
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col <= COLS - 4; col++) {
      score += scoreWindow([board[row][col], board[row][col + 1], board[row][col + 2], board[row][col + 3]], player);
    }
  }

  // Vertical windows
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row <= ROWS - 4; row++) {
      score += scoreWindow([board[row][col], board[row + 1][col], board[row + 2][col], board[row + 3][col]], player);
    }
  }

  // Diagonal down-right windows
  for (let row = 0; row <= ROWS - 4; row++) {
    for (let col = 0; col <= COLS - 4; col++) {
      score += scoreWindow(
        [board[row][col], board[row + 1][col + 1], board[row + 2][col + 2], board[row + 3][col + 3]],
        player,
      );
    }
  }

  // Diagonal down-left windows
  for (let row = 0; row <= ROWS - 4; row++) {
    for (let col = 3; col < COLS; col++) {
      score += scoreWindow(
        [board[row][col], board[row + 1][col - 1], board[row + 2][col - 2], board[row + 3][col - 3]],
        player,
      );
    }
  }

  // Square windows
  for (let row = 0; row <= ROWS - BLOCK_SIZE; row++) {
    for (let col = 0; col <= COLS - BLOCK_SIZE; col++) {
      score += scoreBlockWindow(
        [
          board[row][col],
          board[row][col + 1],
          board[row + 1][col],
          board[row + 1][col + 1],
        ],
        player,
      );
    }
  }

  return score;
}

interface MinimaxResult {
  column: number;
  score: number;
}

function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  aiPlayer: Player,
): MinimaxResult {
  if (findWin(board, aiPlayer)) {
    return { column: -1, score: 1_000_000 + depth };
  }
  if (findWin(board, opponent(aiPlayer))) {
    return { column: -1, score: -1_000_000 - depth };
  }

  const validColumns = getValidColumns(board);
  if (depth === 0 || validColumns.length === 0) {
    return { column: -1, score: validColumns.length === 0 ? 0 : scorePosition(board, aiPlayer) };
  }

  const orderedColumns = MOVE_ORDER.filter((col) => validColumns.includes(col));
  let bestColumn = orderedColumns[0];

  if (maximizing) {
    let value = -Infinity;
    let currentAlpha = alpha;
    for (const col of orderedColumns) {
      const result = dropPiece(board, col, aiPlayer);
      if (!result) continue;
      const { score } = minimax(result.board, depth - 1, currentAlpha, beta, false, aiPlayer);
      if (score > value) {
        value = score;
        bestColumn = col;
      }
      currentAlpha = Math.max(currentAlpha, value);
      if (currentAlpha >= beta) break;
    }
    return { column: bestColumn, score: value };
  }

  let value = Infinity;
  let currentBeta = beta;
  for (const col of orderedColumns) {
    const result = dropPiece(board, col, opponent(aiPlayer));
    if (!result) continue;
    const { score } = minimax(result.board, depth - 1, alpha, currentBeta, true, aiPlayer);
    if (score < value) {
      value = score;
      bestColumn = col;
    }
    currentBeta = Math.min(currentBeta, value);
    if (currentBeta <= alpha) break;
  }
  return { column: bestColumn, score: value };
}

/** Picks the best column for the AI player using alpha-beta minimax. Returns -1 if no move exists. */
export function getBestMove(board: Board, aiPlayer: Player): number {
  const validColumns = getValidColumns(board);
  if (validColumns.length === 0) {
    return -1;
  }
  const other = opponent(aiPlayer);

  // Win immediately when possible.
  for (const col of validColumns) {
    const result = dropPiece(board, col, aiPlayer);
    if (result && findWin(result.board, aiPlayer)) {
      return col;
    }
  }

  // Block the opponent's immediate win.
  for (const col of validColumns) {
    const result = dropPiece(board, col, other);
    if (result && findWin(result.board, other)) {
      return col;
    }
  }

  const { column } = minimax(board, AI_DEPTH, -Infinity, Infinity, true, aiPlayer);
  if (column >= 0) {
    return column;
  }
  return validColumns[Math.floor(Math.random() * validColumns.length)];
}

/** What the AI decided to do on its turn. */
export interface AiAction {
  kind: 'drop' | 'dark' | 'activate';
  /** Target column for `drop` and `dark`, -1 for `activate`. */
  column: number;
  /** Position of the armed dark disc for `activate`, null otherwise. */
  cell: CellPosition | null;
}

/**
 * Heuristic value the AI attributes to the single enemy disc its dark disc can convert later.
 * Used to decide whether arming the dark disc next to enemy discs pays for a weaker move now.
 */
const DARK_CONVERSION_VALUE = 25;

/**
 * Decides what the AI does on its turn: a normal drop, arming its dark power disc, or
 * using the dark disc it has already armed.
 *
 * The dark disc only matters to the player who owns it, so it is kept out of the minimax
 * search. Instead the AI compares the plain heuristic value of the resulting positions and
 * treats the conversion potential of the armed disc as a bonus while deciding where to put it.
 *
 * @param armed Position of the AI's armed dark disc, or null when it has none on the board.
 * @param canArm True while the AI still has its dark disc unused and unarmed.
 */
export function getAiAction(
  board: Board,
  aiPlayer: Player,
  armed: CellPosition | null,
  canArm: boolean,
): AiAction | null {
  const validColumns = getValidColumns(board);

  for (const col of validColumns) {
    const result = dropPiece(board, col, aiPlayer);
    if (result && findWin(result.board, aiPlayer)) {
      return { kind: 'drop', column: col, cell: null };
    }
  }

  const normalColumn = getBestMove(board, aiPlayer);
  const normalDrop = normalColumn >= 0 ? dropPiece(board, normalColumn, aiPlayer) : null;
  const normalValue = normalDrop ? scorePosition(normalDrop.board, aiPlayer) : -Infinity;

  if (armed && findEnemyNeighbours(board, armed[0], armed[1], aiPlayer).length > 0) {
    const target = findConversionTarget(board, armed[0], armed[1], aiPlayer);
    const converted = target ? convertDisc(board, target[0], target[1], aiPlayer) : board;
    if (findWin(converted, aiPlayer) || scorePosition(converted, aiPlayer) > normalValue) {
      return { kind: 'activate', column: -1, cell: [armed[0], armed[1]] };
    }
  }

  if (canArm && normalDrop) {
    let bestDark: { column: number; value: number } | null = null;
    for (const col of MOVE_ORDER) {
      const row = getAvailableRow(board, col);
      const result = dropPiece(board, col, aiPlayer);
      if (!result) {
        continue;
      }
      const reach = findEnemyNeighbours(board, row, col, aiPlayer).length > 0 ? DARK_CONVERSION_VALUE : 0;
      const value = scorePosition(result.board, aiPlayer) + reach;
      if (!bestDark || value > bestDark.value) {
        bestDark = { column: col, value };
      }
    }
    if (bestDark && bestDark.value > normalValue) {
      return { kind: 'dark', column: bestDark.column, cell: null };
    }
  }

  return normalDrop ? { kind: 'drop', column: normalColumn, cell: null } : null;
}
