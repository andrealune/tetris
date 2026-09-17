import {
  Coordinate,
  RotationState,
  TetrominoCells,
  TetrominoDefinitions,
  TetrominoType,
  ROTATION_STATES,
} from './tetromino.types';

function coord(x: number, y: number): Coordinate {
  return { x, y };
}

/**
 * Coordinate arrays for all seven tetromino shapes, in all four rotation
 * states, relative to each piece's pivot point. See tetromino.types.ts for
 * details on the coordinate system and pivot conventions.
 */
export const TETROMINOES: TetrominoDefinitions = {
  I: {
    0: [coord(-1.5, -0.5), coord(-0.5, -0.5), coord(0.5, -0.5), coord(1.5, -0.5)],
    90: [coord(0.5, -1.5), coord(0.5, -0.5), coord(0.5, 0.5), coord(0.5, 1.5)],
    180: [coord(-1.5, 0.5), coord(-0.5, 0.5), coord(0.5, 0.5), coord(1.5, 0.5)],
    270: [coord(-0.5, -1.5), coord(-0.5, -0.5), coord(-0.5, 0.5), coord(-0.5, 1.5)],
  },
  O: {
    0: [coord(-0.5, -0.5), coord(0.5, -0.5), coord(-0.5, 0.5), coord(0.5, 0.5)],
    90: [coord(-0.5, -0.5), coord(0.5, -0.5), coord(-0.5, 0.5), coord(0.5, 0.5)],
    180: [coord(-0.5, -0.5), coord(0.5, -0.5), coord(-0.5, 0.5), coord(0.5, 0.5)],
    270: [coord(-0.5, -0.5), coord(0.5, -0.5), coord(-0.5, 0.5), coord(0.5, 0.5)],
  },
  T: {
    0: [coord(0, -1), coord(-1, 0), coord(0, 0), coord(1, 0)],
    90: [coord(0, -1), coord(0, 0), coord(1, 0), coord(0, 1)],
    180: [coord(-1, 0), coord(0, 0), coord(1, 0), coord(0, 1)],
    270: [coord(0, -1), coord(-1, 0), coord(0, 0), coord(0, 1)],
  },
  S: {
    0: [coord(0, -1), coord(1, -1), coord(-1, 0), coord(0, 0)],
    90: [coord(0, -1), coord(0, 0), coord(1, 0), coord(1, 1)],
    180: [coord(0, 0), coord(1, 0), coord(-1, 1), coord(0, 1)],
    270: [coord(-1, -1), coord(-1, 0), coord(0, 0), coord(0, 1)],
  },
  Z: {
    0: [coord(-1, -1), coord(0, -1), coord(0, 0), coord(1, 0)],
    90: [coord(1, -1), coord(0, 0), coord(1, 0), coord(0, 1)],
    180: [coord(-1, 0), coord(0, 0), coord(0, 1), coord(1, 1)],
    270: [coord(0, -1), coord(-1, 0), coord(0, 0), coord(-1, 1)],
  },
  J: {
    0: [coord(-1, -1), coord(-1, 0), coord(0, 0), coord(1, 0)],
    90: [coord(0, -1), coord(1, -1), coord(0, 0), coord(0, 1)],
    180: [coord(-1, 0), coord(0, 0), coord(1, 0), coord(1, 1)],
    270: [coord(0, -1), coord(0, 0), coord(-1, 1), coord(0, 1)],
  },
  L: {
    0: [coord(1, -1), coord(-1, 0), coord(0, 0), coord(1, 0)],
    90: [coord(0, -1), coord(0, 0), coord(0, 1), coord(1, 1)],
    180: [coord(-1, 0), coord(0, 0), coord(1, 0), coord(-1, 1)],
    270: [coord(-1, -1), coord(0, -1), coord(0, 0), coord(0, 1)],
  },
};

/** All seven tetromino shape identifiers, in a stable, conventional order. */
export const TETROMINO_TYPES: readonly TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

/**
 * Returns the four occupied-cell offsets (relative to the pivot) for a
 * given tetromino shape and rotation state.
 */
export function getTetrominoCells(type: TetrominoType, rotation: RotationState): TetrominoCells {
  return TETROMINOES[type][rotation];
}

/**
 * Returns the next rotation state when rotating clockwise (the order used
 * by ROTATION_STATES: 0 -> 90 -> 180 -> 270 -> 0).
 */
export function getNextRotation(rotation: RotationState): RotationState {
  const index = ROTATION_STATES.indexOf(rotation);
  return ROTATION_STATES[(index + 1) % ROTATION_STATES.length];
}

/**
 * Returns the previous rotation state when rotating counter-clockwise
 * (0 -> 270 -> 180 -> 90 -> 0).
 */
export function getPreviousRotation(rotation: RotationState): RotationState {
  const index = ROTATION_STATES.indexOf(rotation);
  return ROTATION_STATES[(index - 1 + ROTATION_STATES.length) % ROTATION_STATES.length];
}

export * from './tetromino.types';
