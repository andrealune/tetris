/**
 * Tetromino shape tables.
 *
 * Each piece has 4 rotation states. A state is a list of 4 `{x, y}` cell
 * offsets inside a bounding box (4x4 for `I`/`O`, 3x3 for the rest). These
 * are intentionally simple (no SRS wall-kick table) — good enough for a
 * headless, fully-tested game core; a follow-up rendering/controls ticket
 * can refine kick behavior without touching the sound wiring built on top
 * of this module.
 */

export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export interface Offset {
  x: number;
  y: number;
}

export const PIECE_TYPES: PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

/** Bounding box size (both width and height) for each piece's rotation grid. */
export const BOUNDING_BOX: Record<PieceType, number> = {
  I: 4,
  O: 4,
  T: 3,
  S: 3,
  Z: 3,
  J: 3,
  L: 3,
};

type RotationStates = [Offset[], Offset[], Offset[], Offset[]];

const ROTATIONS: Record<PieceType, RotationStates> = {
  I: [
    [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }],
    [{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }],
    [{ x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }],
    [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 }],
  ],
  O: [
    [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
    [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
    [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
    [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
  ],
  T: [
    [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }],
    [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }],
    [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
  ],
  S: [
    [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }],
    [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
    [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
  ],
  Z: [
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 2, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }],
    [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
    [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 2 }],
  ],
  J: [
    [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
    [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }],
    [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
  ],
  L: [
    [{ x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
    [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 0, y: 2 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
  ],
};

/** Returns the 4 cell offsets for a piece type at a given rotation (0-3). */
export function getRotationOffsets(type: PieceType, rotation: number): Offset[] {
  const normalized = ((rotation % 4) + 4) % 4;
  return ROTATIONS[type][normalized];
}

/** Picks a uniformly random piece type. Injectable via `rng` for deterministic tests. */
export function randomPieceType(rng: () => number = Math.random): PieceType {
  const index = Math.floor(rng() * PIECE_TYPES.length) % PIECE_TYPES.length;
  return PIECE_TYPES[index];
}
