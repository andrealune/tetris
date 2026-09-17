/**
 * Tetromino shape definitions.
 *
 * A tetromino is described by:
 *  - a `type` (one of the seven canonical piece letters), and
 *  - a `shape`: the set of cell offsets, relative to the top-left of a
 *    minimal bounding box, that the piece occupies in its spawn
 *    orientation.
 *
 * These definitions are intentionally limited to the *spawn*
 * orientation only — rotation states / wall-kicks are a separate
 * concern and out of scope here (see the piece-spawning issue this
 * module was built for).
 */

/** The seven canonical tetromino types, in the classic "id" order. */
export enum TetrominoType {
  I = 'I',
  O = 'O',
  T = 'T',
  S = 'S',
  Z = 'Z',
  J = 'J',
  L = 'L',
}

/** All tetromino types, in a stable, deterministic order. */
export const TETROMINO_TYPES: readonly TetrominoType[] = [
  TetrominoType.I,
  TetrominoType.O,
  TetrominoType.T,
  TetrominoType.S,
  TetrominoType.Z,
  TetrominoType.J,
  TetrominoType.L,
];

/**
 * Numeric board-cell id for each tetromino type. These are the values
 * written into `Board` cells (see `src/game/board.ts`) to record which
 * piece type occupies a given cell. `0` is reserved for `EMPTY_CELL`,
 * so ids start at 1.
 */
export const TETROMINO_IDS: Readonly<Record<TetrominoType, number>> = {
  [TetrominoType.I]: 1,
  [TetrominoType.O]: 2,
  [TetrominoType.T]: 3,
  [TetrominoType.S]: 4,
  [TetrominoType.Z]: 5,
  [TetrominoType.J]: 6,
  [TetrominoType.L]: 7,
};

/** A single cell offset, relative to a piece's bounding box. */
export interface CellOffset {
  row: number;
  col: number;
}

/**
 * Spawn-orientation shapes for each tetromino, expressed as offsets
 * within a minimal bounding box (top-left = `{ row: 0, col: 0 }`).
 *
 * Bounding boxes:
 *  - I: 1 row  x 4 cols
 *  - O: 2 rows x 2 cols
 *  - T, S, Z, J, L: 2 rows x 3 cols
 */
export const TETROMINO_SHAPES: Readonly<Record<TetrominoType, readonly CellOffset[]>> = {
  [TetrominoType.I]: [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 0, col: 2 },
    { row: 0, col: 3 },
  ],
  [TetrominoType.O]: [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 1, col: 0 },
    { row: 1, col: 1 },
  ],
  [TetrominoType.T]: [
    { row: 0, col: 1 },
    { row: 1, col: 0 },
    { row: 1, col: 1 },
    { row: 1, col: 2 },
  ],
  [TetrominoType.S]: [
    { row: 0, col: 1 },
    { row: 0, col: 2 },
    { row: 1, col: 0 },
    { row: 1, col: 1 },
  ],
  [TetrominoType.Z]: [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 1, col: 1 },
    { row: 1, col: 2 },
  ],
  [TetrominoType.J]: [
    { row: 0, col: 0 },
    { row: 1, col: 0 },
    { row: 1, col: 1 },
    { row: 1, col: 2 },
  ],
  [TetrominoType.L]: [
    { row: 0, col: 2 },
    { row: 1, col: 0 },
    { row: 1, col: 1 },
    { row: 1, col: 2 },
  ],
};

/** Returns the width (in columns) of a tetromino's bounding box. */
export function getTetrominoWidth(type: TetrominoType): number {
  const shape = TETROMINO_SHAPES[type];
  return Math.max(...shape.map((offset) => offset.col)) + 1;
}

/** Returns the height (in rows) of a tetromino's bounding box. */
export function getTetrominoHeight(type: TetrominoType): number {
  const shape = TETROMINO_SHAPES[type];
  return Math.max(...shape.map((offset) => offset.row)) + 1;
}

/** Returns the board-cell id used to represent `type` on the board. */
export function getTetrominoId(type: TetrominoType): number {
  return TETROMINO_IDS[type];
}
