/**
 * Line-clear detection and removal.
 */

import { BOARD_HEIGHT, BOARD_WIDTH, type Board } from './board';

/** Row indices (top-to-bottom) that are completely filled. */
export function findFullLines(board: Board): number[] {
  const fullRows: number[] = [];
  for (let y = 0; y < board.length; y++) {
    if (board[y].every((cell) => cell !== null)) {
      fullRows.push(y);
    }
  }
  return fullRows;
}

/**
 * Removes the given rows from the board and shifts everything above them
 * down, inserting new empty rows at the top so the board stays
 * `BOARD_HEIGHT` tall. Does not mutate the input board.
 */
export function clearLines(board: Board, rows: number[]): Board {
  if (rows.length === 0) return board.map((row) => row.slice());

  const rowsToClear = new Set(rows);
  const remaining = board.filter((_, index) => !rowsToClear.has(index)).map((row) => row.slice());
  const emptyRows = Array.from({ length: rows.length }, () => Array(BOARD_WIDTH).fill(null));

  return [...emptyRows, ...remaining].slice(0, BOARD_HEIGHT) as Board;
}

/** Whether the board (still 20 rows tall) is unchanged in row count. */
export function assertBoardHeight(board: Board): boolean {
  return board.length === BOARD_HEIGHT;
}
