/**
 * Core types describing tetromino shapes, rotations and spawn state.
 *
 * Coordinates use a "column right (+x), row down (+y)" convention, matching
 * a standard grid-based game board where (0,0) is the top-left cell.
 */

/** A single board coordinate expressed as an (x, y) offset from a pivot. */
export interface Point {
  readonly x: number;
  readonly y: number;
}

/** One rotation state of a tetromino: exactly 4 cell offsets from the pivot. */
export type RotationState = readonly [Point, Point, Point, Point];

/**
 * The four rotation states of a tetromino, indexed 0-3.
 *
 * Index 0 is the spawn ("north") orientation. Increasing the index rotates
 * the piece 90 degrees clockwise: 0 -> 1 -> 2 -> 3 -> 0.
 */
export type RotationStates = readonly [
  RotationState,
  RotationState,
  RotationState,
  RotationState
];

/** The seven standard tetromino types. */
export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

/** Every tetromino type, in a stable, iterable order. */
export const TETROMINO_TYPES: readonly TetrominoType[] = [
  'I',
  'O',
  'T',
  'S',
  'Z',
  'J',
  'L',
];

/** Valid rotation indices for a tetromino. */
export type RotationIndex = 0 | 1 | 2 | 3;

/** The full static definition of a tetromino. */
export interface TetrominoDefinition {
  /** The one-letter tetromino identifier. */
  readonly type: TetrominoType;
  /** Display/board color, expressed as a CSS-compatible hex string. */
  readonly color: string;
  /**
   * Where the pivot of a freshly spawned piece is placed on the board,
   * expressed in board (column, row) coordinates.
   */
  readonly spawn: Point;
  /** The 4 rotation states of this tetromino, as offsets from the pivot. */
  readonly rotations: RotationStates;
}

/** A live, in-play instance of a tetromino: its type, position and rotation. */
export interface TetrominoInstance {
  readonly type: TetrominoType;
  /** Current pivot position in board coordinates. */
  readonly position: Point;
  /** Current rotation state index (0-3). */
  readonly rotationIndex: RotationIndex;
}
