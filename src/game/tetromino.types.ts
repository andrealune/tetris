/**
 * Type definitions for tetromino pieces.
 *
 * Each tetromino is described as a set of four coordinates per rotation
 * state. Coordinates are stored relative to the piece's pivot point, so a
 * piece can be positioned on the board simply by translating every
 * coordinate by the board position of its pivot.
 *
 * Coordinate system:
 *  - `x` increases to the right (columns).
 *  - `y` increases downward (rows), matching how the board is rendered
 *    and iterated (row 0 is the top of the board).
 *
 * The I and O pieces rotate around the geometric center of their 4x4
 * bounding box, which is not itself an occupied cell, so their offsets
 * are half-integers (e.g. -1.5, -0.5, 0.5, 1.5). The J, L, S, T and Z
 * pieces rotate around the center cell of their 3x3 bounding box, which
 * is always one of the occupied cells, giving integer offsets that
 * include (0, 0).
 *
 * These shapes and rotation states follow the standard Tetris Guideline
 * (SRS) piece orientations.
 */

/** The seven standard tetromino shapes. */
export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

/** The four rotation states a tetromino can be in, expressed in degrees. */
export type RotationState = 0 | 90 | 180 | 270;

/** All rotation states, in the clockwise order they are cycled through. */
export const ROTATION_STATES: readonly RotationState[] = [0, 90, 180, 270];

/** A single occupied cell offset, relative to the tetromino's pivot. */
export interface Coordinate {
  readonly x: number;
  readonly y: number;
}

/** The four occupied-cell offsets that make up a tetromino in one rotation. */
export type TetrominoCells = readonly [Coordinate, Coordinate, Coordinate, Coordinate];

/** A tetromino's coordinate arrays for every rotation state. */
export type TetrominoRotations = Readonly<Record<RotationState, TetrominoCells>>;

/** All seven tetrominoes, each with their four rotation states. */
export type TetrominoDefinitions = Readonly<Record<TetrominoType, TetrominoRotations>>;
