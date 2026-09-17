/**
 * Piece spawning: placing a new tetromino at the top of the board in
 * its starting position.
 *
 * A spawned piece is represented as an `ActivePiece`: the tetromino
 * type plus the absolute board coordinates of every cell it currently
 * occupies. Callers (the game loop) are expected to write those cells
 * into the `Board` once the piece locks; this module only computes
 * *where* a freshly spawned piece sits, and whether that position is
 * actually free.
 */

import { Board, BOARD_WIDTH, isCellEmpty, isInBounds } from './board';
import {
  CellOffset,
  getTetrominoId,
  getTetrominoWidth,
  TETROMINO_SHAPES,
  TetrominoType,
} from './tetromino';

/** An absolute (row, col) position on the board. */
export interface BoardCell {
  row: number;
  col: number;
}

/** A tetromino that has been placed on (or above) the board, pre-lock. */
export interface ActivePiece {
  /** Which tetromino this is. */
  readonly type: TetrominoType;
  /** The board-cell id this piece writes into the board once locked. */
  readonly id: number;
  /** Row of the piece's bounding-box top-left corner. */
  readonly row: number;
  /** Column of the piece's bounding-box top-left corner. */
  readonly col: number;
  /** Absolute board coordinates of every cell the piece occupies. */
  readonly cells: readonly BoardCell[];
}

/**
 * Row at which every piece spawns: the very top of the board.
 * (There is no hidden "buffer zone" above row 0 in this board model.)
 */
export const SPAWN_ROW = 0;

/**
 * Computes the top-left `(row, col)` a piece of `type` should spawn
 * at, horizontally centered (favoring the left when the width doesn't
 * divide evenly, matching the classic Tetris Guideline spawn columns).
 */
export function getSpawnPosition(
  type: TetrominoType,
  boardWidth: number = BOARD_WIDTH,
): BoardCell {
  const width = getTetrominoWidth(type);
  const col = Math.floor((boardWidth - width) / 2);
  return { row: SPAWN_ROW, col };
}

/**
 * Builds the `ActivePiece` for `type`, positioned at its spawn
 * location for a board of `boardWidth` columns. Does not check
 * whether that location is actually free — use `canSpawn` for that.
 */
export function spawnPiece(type: TetrominoType, boardWidth: number = BOARD_WIDTH): ActivePiece {
  const { row, col } = getSpawnPosition(type, boardWidth);
  const shape: readonly CellOffset[] = TETROMINO_SHAPES[type];

  const cells: BoardCell[] = shape.map((offset) => ({
    row: row + offset.row,
    col: col + offset.col,
  }));

  return { type, id: getTetrominoId(type), row, col, cells };
}

/**
 * Returns `true` if every cell `piece` would occupy is in bounds and
 * currently empty on `board`. A spawn that fails this check means the
 * stack has reached the top of the board (classic "block out" / top-out
 * game-over condition) and the caller should end the game rather than
 * place the piece.
 */
export function canSpawn(board: Board, piece: ActivePiece): boolean {
  return piece.cells.every(
    (cell) => isInBounds(board, cell.row, cell.col) && isCellEmpty(board, cell.row, cell.col),
  );
}

/**
 * Convenience helper: builds the spawn-position `ActivePiece` for
 * `type` sized to `board`'s actual width, and reports whether the
 * spawn is blocked (i.e. the board has topped out).
 */
export function trySpawnPiece(
  board: Board,
  type: TetrominoType,
): { piece: ActivePiece; blocked: boolean } {
  const boardWidth = board[0]?.length ?? BOARD_WIDTH;
  const piece = spawnPiece(type, boardWidth);
  return { piece, blocked: !canSpawn(board, piece) };
}
