import {
  Point,
  RotationIndex,
  RotationState,
  RotationStates,
  TetrominoDefinition,
  TetrominoInstance,
  TetrominoType,
  TETROMINO_TYPES,
} from './types';

/**
 * Rotates a point 90 degrees clockwise around the origin, in a coordinate
 * system where +x is right and +y is down: (x, y) -> (-y, x).
 */
function rotatePointClockwise(point: Point): Point {
  return { x: -point.y, y: point.x };
}

/**
 * Builds all 4 rotation states for a piece whose pivot-relative "spawn"
 * shape is known, by repeatedly rotating it 90 degrees clockwise.
 *
 * Used for the five tetrominoes (T, S, Z, J, L) that have a genuine pivot
 * cell and 4 visually distinct orientations.
 */
function buildRotationStates(spawnState: RotationState): RotationStates {
  const state0 = spawnState;
  const state1 = mapState(state0, rotatePointClockwise);
  const state2 = mapState(state1, rotatePointClockwise);
  const state3 = mapState(state2, rotatePointClockwise);
  return [state0, state1, state2, state3];
}

function mapState(
  state: RotationState,
  fn: (point: Point) => Point
): RotationState {
  return [fn(state[0]), fn(state[1]), fn(state[2]), fn(state[3])];
}

function point(x: number, y: number): Point {
  return { x, y };
}

// ---------------------------------------------------------------------------
// Base ("spawn") shapes, defined as 4 offsets from the pivot point (0, 0).
// ---------------------------------------------------------------------------

/** T: flat side down, bump pointing up. Pivot is the centre cell. */
const T_SPAWN: RotationState = [
  point(-1, 0),
  point(0, 0),
  point(1, 0),
  point(0, -1),
];

/** S: classic "S" shape. Pivot is the lower-left cell of the shape. */
const S_SPAWN: RotationState = [
  point(-1, -1),
  point(0, -1),
  point(0, 0),
  point(1, 0),
];

/** Z: classic "Z" shape (mirror of S). Pivot is the lower-right-ish cell. */
const Z_SPAWN: RotationState = [
  point(0, -1),
  point(1, -1),
  point(-1, 0),
  point(0, 0),
];

/** J: corner up-left, foot along the bottom row. */
const J_SPAWN: RotationState = [
  point(-1, -1),
  point(-1, 0),
  point(0, 0),
  point(1, 0),
];

/** L: corner up-right, foot along the bottom row. */
const L_SPAWN: RotationState = [
  point(1, -1),
  point(-1, 0),
  point(0, 0),
  point(1, 0),
];

/**
 * I: the 4-long bar. The classic ("original") rotation system alternates
 * between exactly two distinct positions (horizontal / vertical), so states
 * 0 & 2 and 1 & 3 are identical -- there are still 4 well-defined rotation
 * indices, matching the other pieces' API.
 */
const I_HORIZONTAL: RotationState = [
  point(-1, 0),
  point(0, 0),
  point(1, 0),
  point(2, 0),
];
const I_VERTICAL: RotationState = [
  point(0, -1),
  point(0, 0),
  point(0, 1),
  point(0, 2),
];
const I_ROTATIONS: RotationStates = [
  I_HORIZONTAL,
  I_VERTICAL,
  I_HORIZONTAL,
  I_VERTICAL,
];

/**
 * O: the 2x2 square. It looks identical in all 4 orientations, so every
 * rotation state is the same set of offsets.
 */
const O_SHAPE: RotationState = [
  point(0, 0),
  point(1, 0),
  point(0, 1),
  point(1, 1),
];
const O_ROTATIONS: RotationStates = [O_SHAPE, O_SHAPE, O_SHAPE, O_SHAPE];

// ---------------------------------------------------------------------------
// Colors (standard Tetris Guideline palette).
// ---------------------------------------------------------------------------

const COLORS: Record<TetrominoType, string> = {
  I: '#00FFFF', // cyan
  O: '#FFFF00', // yellow
  T: '#800080', // purple
  S: '#00FF00', // green
  Z: '#FF0000', // red
  J: '#0000FF', // blue
  L: '#FFA500', // orange
};

// ---------------------------------------------------------------------------
// Spawn positions.
//
// Board coordinates assume a 10-column board (x: 0-9) and place each piece's
// pivot so the piece is horizontally centred, spawning at the top of the
// board (y: 0).
// ---------------------------------------------------------------------------

const SPAWN_POSITIONS: Record<TetrominoType, Point> = {
  I: point(3, 0),
  O: point(4, 0),
  T: point(4, 0),
  S: point(4, 0),
  Z: point(4, 0),
  J: point(4, 0),
  L: point(4, 0),
};

/** Full definitions for all seven standard tetrominoes, keyed by type. */
export const TETROMINOES: Record<TetrominoType, TetrominoDefinition> = {
  I: {
    type: 'I',
    color: COLORS.I,
    spawn: SPAWN_POSITIONS.I,
    rotations: I_ROTATIONS,
  },
  O: {
    type: 'O',
    color: COLORS.O,
    spawn: SPAWN_POSITIONS.O,
    rotations: O_ROTATIONS,
  },
  T: {
    type: 'T',
    color: COLORS.T,
    spawn: SPAWN_POSITIONS.T,
    rotations: buildRotationStates(T_SPAWN),
  },
  S: {
    type: 'S',
    color: COLORS.S,
    spawn: SPAWN_POSITIONS.S,
    rotations: buildRotationStates(S_SPAWN),
  },
  Z: {
    type: 'Z',
    color: COLORS.Z,
    spawn: SPAWN_POSITIONS.Z,
    rotations: buildRotationStates(Z_SPAWN),
  },
  J: {
    type: 'J',
    color: COLORS.J,
    spawn: SPAWN_POSITIONS.J,
    rotations: buildRotationStates(J_SPAWN),
  },
  L: {
    type: 'L',
    color: COLORS.L,
    spawn: SPAWN_POSITIONS.L,
    rotations: buildRotationStates(L_SPAWN),
  },
};

/** Returns the static definition for a tetromino type. */
export function getDefinition(type: TetrominoType): TetrominoDefinition {
  return TETROMINOES[type];
}

/** Creates a new tetromino instance at its spawn position and orientation. */
export function createTetromino(type: TetrominoType): TetrominoInstance {
  const def = getDefinition(type);
  return {
    type,
    position: def.spawn,
    rotationIndex: 0,
  };
}

/**
 * Returns the absolute board cells occupied by a tetromino instance, i.e.
 * its pivot-relative rotation offsets translated by its board position.
 */
export function getCells(instance: TetrominoInstance): readonly Point[] {
  const def = getDefinition(instance.type);
  const offsets = def.rotations[instance.rotationIndex];
  return offsets.map((offset) => ({
    x: instance.position.x + offset.x,
    y: instance.position.y + offset.y,
  }));
}

/** Returns the next rotation index, wrapping clockwise (0 -> 1 -> 2 -> 3 -> 0). */
export function nextRotationIndex(index: RotationIndex): RotationIndex {
  return ((index + 1) % 4) as RotationIndex;
}

/** Returns the previous rotation index, wrapping counter-clockwise. */
export function previousRotationIndex(index: RotationIndex): RotationIndex {
  return ((index + 3) % 4) as RotationIndex;
}

/** Returns a copy of the instance rotated one step clockwise. */
export function rotateClockwise(
  instance: TetrominoInstance
): TetrominoInstance {
  return {
    ...instance,
    rotationIndex: nextRotationIndex(instance.rotationIndex),
  };
}

/** Returns a copy of the instance rotated one step counter-clockwise. */
export function rotateCounterClockwise(
  instance: TetrominoInstance
): TetrominoInstance {
  return {
    ...instance,
    rotationIndex: previousRotationIndex(instance.rotationIndex),
  };
}

export { TETROMINO_TYPES };
export type {
  Point,
  RotationIndex,
  RotationState,
  RotationStates,
  TetrominoDefinition,
  TetrominoInstance,
  TetrominoType,
};
