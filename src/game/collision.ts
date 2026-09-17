/**
 * Collision detection for falling pieces.
 *
 * This module answers one core question for any *proposed* piece
 * position or rotation: "would this piece overlap a wall, the floor,
 * or a cell already occupied on the board?" It never mutates the
 * board or the piece — callers (movement/rotation logic, ghost-piece
 * preview, etc.) decide what to do with the collision result.
 *
 * Three kinds of collision are distinguished, mirroring the issue:
 *  - wall: the piece would extend past the left/right edge of the board.
 *  - floor: the piece would extend below the bottom of the board.
 *    (Going above the top, e.g. during spawn, is reported as `ceiling`.)
 *  - piece: the piece would overlap a cell already filled by a
 *    previously-placed piece.
 *
 * Rotation is handled by `resolveRotation`, which tries a piece's SRS
 * wall-kick offsets (see `pieces.ts`) in order and returns the first
 * kicked position that doesn't collide, or `null` if every kick fails
 * (i.e. the rotation is blocked).
 */

import { Board, isInBounds } from './board';
import {
  CellOffset,
  KickOffset,
  Piece,
  RotationState,
  getPieceCells,
  getWallKickOffsets,
} from './pieces';

/** The distinct reasons a proposed piece position can be invalid. */
export type CollisionReason = 'left-wall' | 'right-wall' | 'floor' | 'ceiling' | 'piece';

/**
 * The full collision state for a proposed piece position: whether it
 * collides at all, every reason it collides (a piece can simultaneously
 * hang off two edges, for example), and which of its cells (if any)
 * overlap already-filled board cells.
 */
export interface CollisionState {
  collides: boolean;
  reasons: CollisionReason[];
  /** Absolute board cells of the piece that overlap an existing, filled cell. */
  overlappingCells: CellOffset[];
}

function boardWidth(board: Board): number {
  return board[0]?.length ?? 0;
}

function boardHeight(board: Board): number {
  return board.length;
}

/**
 * Computes the full collision state for `piece` against `board`, at the
 * piece's own current rotation and position. Pure/read-only: does not
 * mutate `board` or `piece`.
 */
export function getCollisionState(board: Board, piece: Piece): CollisionState {
  const reasons = new Set<CollisionReason>();
  const overlappingCells: CellOffset[] = [];
  const width = boardWidth(board);
  const height = boardHeight(board);

  for (const cell of getPieceCells(piece)) {
    if (cell.col < 0) {
      reasons.add('left-wall');
    }
    if (cell.col >= width) {
      reasons.add('right-wall');
    }
    if (cell.row >= height) {
      reasons.add('floor');
    }
    if (cell.row < 0) {
      reasons.add('ceiling');
    }

    if (isInBounds(board, cell.row, cell.col) && board[cell.row][cell.col] !== 0) {
      reasons.add('piece');
      overlappingCells.push(cell);
    }
  }

  return {
    collides: reasons.size > 0,
    reasons: Array.from(reasons),
    overlappingCells,
  };
}

/** Returns true if `piece` collides with a wall, the floor/ceiling, or an existing piece on `board`. */
export function hasCollision(board: Board, piece: Piece): boolean {
  return getCollisionState(board, piece).collides;
}

/** Returns true if `piece` can legally occupy its current position on `board` (the exact inverse of `hasCollision`). */
export function isValidPosition(board: Board, piece: Piece): boolean {
  return !hasCollision(board, piece);
}

/**
 * Returns a copy of `piece` translated by (`deltaRow`, `deltaCol`), without
 * checking collision. Useful for building a candidate to test with
 * `getCollisionState`/`isValidPosition` before committing to a move.
 */
export function translatePiece(piece: Piece, deltaRow: number, deltaCol: number): Piece {
  return { ...piece, row: piece.row + deltaRow, col: piece.col + deltaCol };
}

/**
 * Returns a copy of `piece` moved by (`deltaRow`, `deltaCol`) *only if* the
 * resulting position is valid on `board`; otherwise returns `null`.
 *
 * This directly answers "would moving here collide?" for translation
 * (left/right/soft-drop/hard-drop) moves.
 */
export function tryMove(board: Board, piece: Piece, deltaRow: number, deltaCol: number): Piece | null {
  const candidate = translatePiece(piece, deltaRow, deltaCol);
  return isValidPosition(board, candidate) ? candidate : null;
}

/**
 * Returns a copy of `piece` with its rotation set to `rotation` (position
 * unchanged), without checking collision or applying any wall kick.
 */
export function rotatePiece(piece: Piece, rotation: RotationState): Piece {
  return { ...piece, rotation };
}

/** The outcome of attempting a rotation, including which (if any) wall kick resolved it. */
export interface RotationResult {
  /** The resolved piece (only present when the rotation succeeded). */
  piece: Piece | null;
  /** Whether the rotation succeeded (with or without a kick). */
  success: boolean;
  /** The wall-kick offset that resolved the rotation ((0,0) if none was needed). */
  kick: KickOffset | null;
}

/**
 * Attempts to rotate `piece` to `toRotation`, trying each of its SRS
 * wall-kick offsets (starting with the no-kick `(0, 0)` test) in order
 * against `board`, and returning the first one that lands in a valid,
 * non-colliding position.
 *
 * Returns a `RotationResult` describing the outcome: `success: false`
 * (and `piece: null`) means every kick was blocked, so the rotation
 * should be rejected outright by the caller.
 */
export function resolveRotation(board: Board, piece: Piece, toRotation: RotationState): RotationResult {
  const offsets = getWallKickOffsets(piece.type, piece.rotation, toRotation);

  for (const offset of offsets) {
    const candidate: Piece = {
      ...piece,
      rotation: toRotation,
      row: piece.row + offset.row,
      col: piece.col + offset.col,
    };

    if (isValidPosition(board, candidate)) {
      return { piece: candidate, success: true, kick: offset };
    }
  }

  return { piece: null, success: false, kick: null };
}
