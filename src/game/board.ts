/**
 * Game board / grid system for Tetris.
 *
 * The board is a 10-column by 20-row grid, represented as a 2D array
 * indexed as `board[row][col]`, with `row` 0 at the top of the board
 * and `col` 0 at the left edge.
 *
 * Each cell holds either:
 *  - `EMPTY_CELL` (0) when the cell is unoccupied, or
 *  - a positive integer "tetromino ID" identifying which piece type
 *    occupies that cell (e.g. 1 = I, 2 = O, 3 = T, ...).
 */

/** Number of columns in the board. */
export const BOARD_WIDTH = 10;

/** Number of rows in the board. */
export const BOARD_HEIGHT = 20;

/** Value used to represent an empty cell. */
export const EMPTY_CELL = 0;

/** A single row of the board. */
export type BoardRow = number[];

/** The full board grid: `BOARD_HEIGHT` rows of `BOARD_WIDTH` columns. */
export type Board = BoardRow[];

/**
 * Creates a brand new board of `BOARD_WIDTH` x `BOARD_HEIGHT` cells,
 * with every cell initialized to `EMPTY_CELL`.
 */
export function createEmptyBoard(
  width: number = BOARD_WIDTH,
  height: number = BOARD_HEIGHT,
): Board {
  if (!Number.isInteger(width) || width <= 0) {
    throw new RangeError(`Board width must be a positive integer, got ${width}`);
  }
  if (!Number.isInteger(height) || height <= 0) {
    throw new RangeError(`Board height must be a positive integer, got ${height}`);
  }

  return Array.from({ length: height }, () => new Array<number>(width).fill(EMPTY_CELL));
}

/**
 * Clears every cell of the given board in place, setting each one back
 * to `EMPTY_CELL`. The board's dimensions are preserved.
 *
 * Returns the same board instance for convenience/chaining.
 */
export function clearBoard(board: Board): Board {
  for (const row of board) {
    row.fill(EMPTY_CELL);
  }
  return board;
}

/**
 * Resets the board to a fresh, empty state.
 *
 * This is functionally equivalent to `clearBoard`, but the intent is
 * distinct: `reset` represents "start a new game", while `clear` is a
 * lower-level utility to blank out existing cells. Kept as a separate
 * exported function so callers can express intent and so behavior can
 * diverge later (e.g. resetting score/state alongside the grid) without
 * changing the `clearBoard` contract.
 */
export function resetBoard(board: Board): Board {
  return clearBoard(board);
}

/**
 * Returns true if the given row/col is within the bounds of the board.
 */
export function isInBounds(board: Board, row: number, col: number): boolean {
  return row >= 0 && row < board.length && col >= 0 && col < (board[0]?.length ?? 0);
}

/**
 * Gets the value stored at `(row, col)`.
 * Throws a `RangeError` if the coordinates are out of bounds.
 */
export function getCell(board: Board, row: number, col: number): number {
  if (!isInBounds(board, row, col)) {
    throw new RangeError(`Cell (${row}, ${col}) is out of bounds`);
  }
  return board[row][col];
}

/**
 * Sets the value stored at `(row, col)` to `value` (an empty marker or a
 * tetromino ID). Throws a `RangeError` if the coordinates are out of bounds.
 */
export function setCell(board: Board, row: number, col: number, value: number): void {
  if (!isInBounds(board, row, col)) {
    throw new RangeError(`Cell (${row}, ${col}) is out of bounds`);
  }
  board[row][col] = value;
}

/** Returns true if the cell at `(row, col)` is empty. */
export function isCellEmpty(board: Board, row: number, col: number): boolean {
  return getCell(board, row, col) === EMPTY_CELL;
}

/**
 * Returns a deep copy of the board, suitable for exporting/serializing
 * state (e.g. sending to a UI layer, storing a snapshot for undo/replay,
 * or persisting) without exposing an internal, mutable reference.
 */
export function exportBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

/**
 * Serializes the board into a plain JSON-friendly string. Useful for
 * persistence, logging, or transmitting board state.
 */
export function serializeBoard(board: Board): string {
  return JSON.stringify(board);
}

/**
 * Rebuilds a board from a previously serialized string (see
 * `serializeBoard`). Performs basic shape validation.
 */
export function deserializeBoard(serialized: string): Board {
  const parsed = JSON.parse(serialized);

  if (!Array.isArray(parsed) || parsed.some((row) => !Array.isArray(row))) {
    throw new TypeError('Invalid serialized board: expected a 2D array');
  }

  return parsed.map((row: unknown[]) =>
    row.map((cell) => {
      if (typeof cell !== 'number' || !Number.isInteger(cell)) {
        throw new TypeError('Invalid serialized board: cells must be integers');
      }
      return cell;
    }),
  );
}
