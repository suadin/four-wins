import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  convertDisc,
  createEmptyBoard,
  dropPiece,
  findBlock,
  findConversionTarget,
  findLine,
  findWin,
  getAiAction,
  getAvailableRow,
  getBestMove,
  getValidColumns,
  isBoardFull,
  opponent,
} from '../src/app/game/game-logic';
import { COLS, ROWS } from '../src/app/game/game.types';
import type { Board, Player } from '../src/app/game/game.types';

function boardWith(cells: ReadonlyArray<[number, number, Player]>): Board {
  const board = createEmptyBoard();
  for (const [row, col, player] of cells) {
    board[row][col] = player;
  }
  return board;
}

test('[GAME-01] an empty board has the agreed shape', () => {
  const board = createEmptyBoard();
  assert.equal(board.length, ROWS);
  assert.equal(board[0].length, COLS);
  assert.equal(
    board.flat().every((cell) => cell === 0),
    true,
  );
});

test('[GAME-02] the opponent swaps players', () => {
  assert.equal(opponent(1), 2);
  assert.equal(opponent(2), 1);
});

test('[GAME-03] a disc falls to the lowest free row and the old board stays', () => {
  const board = createEmptyBoard();
  const result = dropPiece(board, 3, 1);
  assert.ok(result);
  assert.equal(result.row, ROWS - 1);
  assert.equal(result.board[ROWS - 1][3], 1);
  assert.equal(board[ROWS - 1][3], 0);
});

test('[GAME-04] a full column refuses another disc', () => {
  let board = createEmptyBoard();
  for (let i = 0; i < ROWS; i++) {
    const result = dropPiece(board, 0, 1);
    assert.ok(result);
    board = result.board;
  }
  assert.equal(dropPiece(board, 0, 2), null);
  assert.equal(getAvailableRow(board, 0), -1);
  assert.equal(getValidColumns(board).includes(0), false);
});

test('[GAME-05] four discs in a row are a line win', () => {
  const board = boardWith([
    [5, 1, 1],
    [5, 2, 1],
    [5, 3, 1],
    [5, 4, 1],
  ]);
  const cells = findLine(board, 1);
  assert.equal(cells?.length, 4);
  assert.deepEqual(findWin(board, 1), { type: 'line', cells });
});

test('[GAME-05] four discs in a column are a line win', () => {
  const board = boardWith([
    [2, 0, 2],
    [3, 0, 2],
    [4, 0, 2],
    [5, 0, 2],
  ]);
  assert.equal(findLine(board, 2)?.length, 4);
});

test('[GAME-05] four discs on a diagonal are a line win', () => {
  const board = boardWith([
    [2, 0, 1],
    [3, 1, 1],
    [4, 2, 1],
    [5, 3, 1],
  ]);
  assert.equal(findLine(board, 1)?.length, 4);
});

test('[GAME-06] a filled 2x2 block wins as well', () => {
  const board = boardWith([
    [4, 2, 2],
    [4, 3, 2],
    [5, 2, 2],
    [5, 3, 2],
  ]);
  const cells = findBlock(board, 2);
  assert.equal(cells?.length, 4);
  assert.deepEqual(findWin(board, 2), { type: 'block', cells });
});

test('[GAME-07] a full board is a draw', () => {
  const board = createEmptyBoard();
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      board[row][col] = (row + col) % 2 === 0 ? 1 : 2;
    }
  }
  assert.equal(isBoardFull(board), true);
});

test('[GAME-08] a conversion turns one disc and leaves the rest alone', () => {
  const board = boardWith([
    [5, 1, 2],
    [5, 2, 1],
  ]);
  const converted = convertDisc(board, 5, 1, 1);
  assert.equal(converted[5][1], 1);
  assert.equal(converted[5][2], 1);
  assert.equal(board[5][1], 2);
});

test('[GAME-08] a conversion picks an opposing neighbour', () => {
  const board = boardWith([
    [5, 2, 2],
    [4, 2, 1],
  ]);
  assert.deepEqual(findConversionTarget(board, 4, 2, 1), [5, 2]);
  assert.equal(findConversionTarget(createEmptyBoard(), 4, 2, 1), null);
});

test('[GAME-10] the best move takes an immediate win', () => {
  const board = boardWith([
    [5, 0, 2],
    [5, 1, 2],
    [5, 2, 2],
    [4, 3, 1],
  ]);
  assert.equal(getBestMove(board, 2), 3);
});

test('[GAME-10] the AI action is a legal column for an empty board', () => {
  const action = getAiAction(createEmptyBoard(), 2, null, true);
  assert.ok(action);
  if (action.kind === 'activate') {
    assert.fail('no disc is armed on an empty board');
  }
  assert.equal(getValidColumns(createEmptyBoard()).includes(action.column), true);
});
