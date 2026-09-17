/**
 * Line-clear detection and removal for the Tetris board.
 *
 * A "line clear" happens when a row of the board becomes completely
 * filled with tetromino cells. This module provides three composable
 * pieces of behavior, kept separate so callers (e.g. the game loop /
 * renderer) can drive them independently:
 *
 *  1. Detection — `findFullLines` scans the board (read-only) and
 *     reports which rows are currently full.
 *  2. Visual feedback — `markLinesForClear` produces a *snapshot* board
 *     with the given rows replaced by a sentinel value, so a renderer
 *     can flash/animate those rows before they actually disappear.
 *  3. Removal — `clearLines` removes every full row from the real
 *     board, applies gravity (rows above shift down, empty rows are
 *     inserted at the top), and reports how many lines were cleared.
 *
 * A typical game-loop sequence is:
 *
 *   const fullLines = findFullLines(board);
 *   if (fullLines.length > 0) {
 *     render(markLinesForClear(board, fullLines)); // flash animation
 *     await animationDelay();
 *     const { linesCleared } = clearLines(board);   // mutate real board
 *     updateScore(linesCleared);
 *   }
 */

import { Board, BoardRow, BOARD_WIDTH, EMPTY_CELL } from './board';

/** Sentinel cell value used to mark a cell as pending a line-clear animation. */
export const MARKED_FOR_CLEAR = -1;

/** Returns true if every cell in `row` is filled (i.e. not `EMPTY_CELL`). */
export function isRowFull(row: BoardRow): boolean {
  return row.length > 0 && row.every((cell) => cell !== EMPTY_CELL);
}

/**
 * Returns the indices (ascending order) of every row in `board` that is
 * completely filled and therefore eligible to be cleared.
 *
 * This is a pure, read-only detection step — it never mutates `board`.
 * Handles multiple simultaneous full rows by simply returning all of
 * their indices.
 */
export function findFullLines(board: Board): number[] {
  const fullLines: number[] = [];
  for (let row = 0; row < board.length; row++) {
    if (isRowFull(board[row])) {
      fullLines.push(row);
    }
  }
  return fullLines;
}

/**
 * Returns a deep-copied snapshot of `board` with every cell in the rows
 * listed by `lines` replaced by `MARKED_FOR_CLEAR`.
 *
 * Intended purely as visual-feedback support: a renderer can display
 * this snapshot to flash/animate the about-to-be-cleared rows, while
 * the real board (and game state) is left untouched until `clearLines`
 * is actually invoked. Does not mutate the input board.
 *
 * Throws a `RangeError` if any index in `lines` is out of bounds.
 */
export function markLinesForClear(board: Board, lines: number[]): Board {
  const marked = board.map((row) => [...row]);

  for (const lineIndex of lines) {
    if (!Number.isInteger(lineIndex) || lineIndex < 0 || lineIndex >= marked.length) {
      throw new RangeError(`Line index ${lineIndex} is out of bounds`);
    }
    marked[lineIndex] = marked[lineIndex].map(() => MARKED_FOR_CLEAR);
  }

  return marked;
}

/** Result of a `clearLines` operation. */
export interface LineClearResult {
  /** Row indices, from the board *before* clearing, that were removed (ascending). */
  clearedLines: number[];
  /** Number of lines cleared. Always equal to `clearedLines.length`. */
  linesCleared: number;
}

/**
 * Detects every completely-filled row in `board`, removes them, and
 * applies gravity: every row that was above a cleared line shifts down
 * to fill the gap, and new empty rows are inserted at the top so the
 * board keeps its original dimensions.
 *
 * Handles multiple simultaneous line clears in a single pass (e.g.
 * clearing rows 5, 6 and 10 at once correctly shifts everything above
 * row 10 down by 3, not row-by-row).
 *
 * Mutates `board` in place and returns the indices of the rows that
 * were cleared along with the count. If no row is full, the board is
 * left untouched and `linesCleared` is `0`.
 */
export function clearLines(board: Board): LineClearResult {
  const width = board[0]?.length ?? BOARD_WIDTH;
  const clearedLines = findFullLines(board);

  if (clearedLines.length === 0) {
    return { clearedLines: [], linesCleared: 0 };
  }

  const clearedSet = new Set(clearedLines);
  const remainingRows = board.filter((_, index) => !clearedSet.has(index));

  const newRows: BoardRow[] = Array.from({ length: clearedLines.length }, () =>
    new Array<number>(width).fill(EMPTY_CELL),
  );

  const rebuilt = [...newRows, ...remainingRows];

  // Mutate the board in place (rather than reassigning `board`) so any
  // existing references to it stay valid, mirroring `clearBoard`.
  for (let i = 0; i < board.length; i++) {
    board[i] = rebuilt[i];
  }

  return { clearedLines, linesCleared: clearedLines.length };
}
