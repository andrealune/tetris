/**
 * Tetromino piece shapes and rotation data.
 *
 * NOTE: This module was expected to already exist as the deliverable of
 * a separate ticket ("Design and implement tetromino data structures"),
 * which this ticket (collision detection) depends on. That module was
 * not present in the checked-out codebase, so a minimal, self-contained
 * version is included here so collision detection has real shapes and
 * rotation/kick data to operate on. If the "tetromino data structures"
 * ticket lands separately with a different shape representation, the
 * two should be reconciled (see the PR description / issue comment for
 * a heads-up to the architect).
 *
 * Shapes follow the standard "Super Rotation System" (SRS) conventions
 * used by the Tetris Guideline:
 *  - Each piece has 4 rotation states: `0` (spawn), `R` (clockwise),
 *    `2` (180 degrees), and `L` (counter-clockwise).
 *  - Shapes are defined on a small square grid (`4x4` for I and O,
 *    `3x3` for J, L, S, T, Z) with `row` 0 at the top and `col` 0 at
 *    the left, matching the board's own coordinate convention.
 *  - Wall-kick offset tables are provided for rotation collision
 *    handling (see `collision.ts`).
 */

/** The seven standard tetromino types. */
export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

/** All tetromino types, in a stable order (also a reasonable 7-bag order). */
export const TETROMINO_TYPES: readonly TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

/**
 * SRS rotation states. `0` is spawn, `R` is one clockwise turn from
 * spawn, `2` is a 180-degree turn, `L` is one counter-clockwise turn.
 */
export type RotationState = 0 | 1 | 2 | 3;

export const ROTATION_STATES: readonly RotationState[] = [0, 1, 2, 3];

/** A relative (row, col) offset of an occupied cell within a piece's shape grid. */
export interface CellOffset {
  row: number;
  col: number;
}

/** A falling piece: its type, current rotation state, and anchor position on the board. */
export interface Piece {
  type: TetrominoType;
  rotation: RotationState;
  /** Row of the shape grid's top-left corner on the board. */
  row: number;
  /** Column of the shape grid's top-left corner on the board. */
  col: number;
}

/** Turns a compact string grid (rows of `.`/`X`) into a list of occupied cell offsets. */
function parseShape(rows: string[]): CellOffset[] {
  const cells: CellOffset[] = [];
  for (let row = 0; row < rows.length; row++) {
    const line = rows[row];
    for (let col = 0; col < line.length; col++) {
      if (line[col] === 'X') {
        cells.push({ row, col });
      }
    }
  }
  return cells;
}

/** Per-type, per-rotation-state occupied cell offsets, in the piece's own shape grid. */
const SHAPES: Record<TetrominoType, Record<RotationState, CellOffset[]>> = {
  I: {
    0: parseShape(['....', 'XXXX', '....', '....']),
    1: parseShape(['..X.', '..X.', '..X.', '..X.']),
    2: parseShape(['....', '....', 'XXXX', '....']),
    3: parseShape(['.X..', '.X..', '.X..', '.X..']),
  },
  O: {
    0: parseShape(['XX', 'XX']),
    1: parseShape(['XX', 'XX']),
    2: parseShape(['XX', 'XX']),
    3: parseShape(['XX', 'XX']),
  },
  T: {
    0: parseShape(['.X.', 'XXX', '...']),
    1: parseShape(['.X.', '.XX', '.X.']),
    2: parseShape(['...', 'XXX', '.X.']),
    3: parseShape(['.X.', 'XX.', '.X.']),
  },
  S: {
    0: parseShape(['.XX', 'XX.', '...']),
    1: parseShape(['.X.', '.XX', '..X']),
    2: parseShape(['...', '.XX', 'XX.']),
    3: parseShape(['X..', 'XX.', '.X.']),
  },
  Z: {
    0: parseShape(['XX.', '.XX', '...']),
    1: parseShape(['..X', '.XX', '.X.']),
    2: parseShape(['...', 'XX.', '.XX']),
    3: parseShape(['.X.', 'XX.', 'X..']),
  },
  J: {
    0: parseShape(['X..', 'XXX', '...']),
    1: parseShape(['.XX', '.X.', '.X.']),
    2: parseShape(['...', 'XXX', '..X']),
    3: parseShape(['.X.', '.X.', 'XX.']),
  },
  L: {
    0: parseShape(['..X', 'XXX', '...']),
    1: parseShape(['.X.', '.X.', '.XX']),
    2: parseShape(['...', 'XXX', 'X..']),
    3: parseShape(['XX.', '.X.', '.X.']),
  },
};

/** The size (in cells) of the square shape grid used for a given piece type. */
export function getShapeGridSize(type: TetrominoType): number {
  return type === 'I' || type === 'O' ? 4 : 3;
}

/**
 * Returns the occupied cell offsets (relative to the piece's shape grid
 * top-left corner) for `type` at `rotation`.
 */
export function getShapeCells(type: TetrominoType, rotation: RotationState): CellOffset[] {
  return SHAPES[type][rotation].map((cell) => ({ ...cell }));
}

/**
 * Returns the absolute board cells (row, col) currently occupied by `piece`,
 * i.e. its shape offsets translated by its anchor position.
 */
export function getPieceCells(piece: Piece): CellOffset[] {
  return getShapeCells(piece.type, piece.rotation).map((cell) => ({
    row: piece.row + cell.row,
    col: piece.col + cell.col,
  }));
}

/**
 * Creates a new piece of `type` in its spawn rotation, positioned so its
 * shape grid's top-left corner sits at `row`/`col` (defaults to the
 * standard spawn location: centered horizontally, at the top of the board).
 */
export function createPiece(
  type: TetrominoType,
  row = 0,
  col = type === 'I' || type === 'O' ? 3 : 3,
): Piece {
  return { type, rotation: 0, row, col };
}

/** Returns the rotation state one clockwise turn from `rotation`. */
export function rotateClockwise(rotation: RotationState): RotationState {
  return ((rotation + 1) % 4) as RotationState;
}

/** Returns the rotation state one counter-clockwise turn from `rotation`. */
export function rotateCounterclockwise(rotation: RotationState): RotationState {
  return ((rotation + 3) % 4) as RotationState;
}

/** A single (colOffset, rowOffset) wall-kick test, in board coordinates (row grows downward). */
export interface KickOffset {
  col: number;
  row: number;
}

type KickKey = '0>1' | '1>0' | '1>2' | '2>1' | '2>3' | '3>2' | '3>0' | '0>3';

function kickKey(from: RotationState, to: RotationState): KickKey {
  return `${from}>${to}` as KickKey;
}

/**
 * SRS wall-kick offset tables for the J/L/S/T/Z pieces, keyed by rotation
 * transition. Each transition lists the offsets to try, in order,
 * *including* the initial `(0, 0)` "no kick" attempt.
 */
const JLSTZ_KICKS: Record<KickKey, KickOffset[]> = {
  '0>1': [{ col: 0, row: 0 }, { col: -1, row: 0 }, { col: -1, row: -1 }, { col: 0, row: 2 }, { col: -1, row: 2 }],
  '1>0': [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 1, row: 1 }, { col: 0, row: -2 }, { col: 1, row: -2 }],
  '1>2': [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 1, row: 1 }, { col: 0, row: -2 }, { col: 1, row: -2 }],
  '2>1': [{ col: 0, row: 0 }, { col: -1, row: 0 }, { col: -1, row: -1 }, { col: 0, row: 2 }, { col: -1, row: 2 }],
  '2>3': [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 1, row: -1 }, { col: 0, row: 2 }, { col: 1, row: 2 }],
  '3>2': [{ col: 0, row: 0 }, { col: -1, row: 0 }, { col: -1, row: 1 }, { col: 0, row: -2 }, { col: -1, row: -2 }],
  '3>0': [{ col: 0, row: 0 }, { col: -1, row: 0 }, { col: -1, row: 1 }, { col: 0, row: -2 }, { col: -1, row: -2 }],
  '0>3': [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 1, row: -1 }, { col: 0, row: 2 }, { col: 1, row: 2 }],
};

/** SRS wall-kick offset tables for the I piece (its kicks differ from J/L/S/T/Z). */
const I_KICKS: Record<KickKey, KickOffset[]> = {
  '0>1': [{ col: 0, row: 0 }, { col: -2, row: 0 }, { col: 1, row: 0 }, { col: -2, row: 1 }, { col: 1, row: -2 }],
  '1>0': [{ col: 0, row: 0 }, { col: 2, row: 0 }, { col: -1, row: 0 }, { col: 2, row: -1 }, { col: -1, row: 2 }],
  '1>2': [{ col: 0, row: 0 }, { col: -1, row: 0 }, { col: 2, row: 0 }, { col: -1, row: -2 }, { col: 2, row: 1 }],
  '2>1': [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: -2, row: 0 }, { col: 1, row: 2 }, { col: -2, row: -1 }],
  '2>3': [{ col: 0, row: 0 }, { col: 2, row: 0 }, { col: -1, row: 0 }, { col: 2, row: -1 }, { col: -1, row: 2 }],
  '3>2': [{ col: 0, row: 0 }, { col: -2, row: 0 }, { col: 1, row: 0 }, { col: -2, row: 1 }, { col: 1, row: -2 }],
  '3>0': [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: -2, row: 0 }, { col: 1, row: 2 }, { col: -2, row: -1 }],
  '0>3': [{ col: 0, row: 0 }, { col: -1, row: 0 }, { col: 2, row: 0 }, { col: -1, row: -2 }, { col: 2, row: 1 }],
};

/** The O piece never needs a kick: every rotation occupies the same footprint. */
const NO_KICK: KickOffset[] = [{ col: 0, row: 0 }];

/**
 * Returns the ordered list of wall-kick offsets to try when rotating
 * `type` from `from` to `to`. The first offset is always `(0, 0)` (a
 * plain rotation with no kick).
 */
export function getWallKickOffsets(
  type: TetrominoType,
  from: RotationState,
  to: RotationState,
): KickOffset[] {
  if (type === 'O') {
    return NO_KICK.map((offset) => ({ ...offset }));
  }
  const table = type === 'I' ? I_KICKS : JLSTZ_KICKS;
  const key = kickKey(from, to);
  const offsets = table[key];
  if (!offsets) {
    throw new RangeError(`No wall-kick data for rotating ${type} from ${from} to ${to}`);
  }
  return offsets.map((offset) => ({ ...offset }));
}
