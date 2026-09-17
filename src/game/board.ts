/**
 * Board grid model: a 10x20 Tetris playfield plus collision/merge helpers
 * for the active falling piece.
 */

import { getRotationOffsets, type PieceType } from './tetrominoes';

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

/** A single board cell: empty, or the piece type that occupies it. */
export type Cell = PieceType | null;

/** `board[y][x]`, `y` = 0 at the top. */
export type Board = Cell[][];

export interface ActivePiece {
  type: PieceType;
  /** Rotation state, 0-3. */
  rotation: number;
  /** Top-left of the piece's bounding box, in board coordinates. */
  x: number;
  y: number;
}

/** Creates a new, empty `BOARD_WIDTH x BOARD_HEIGHT` board. */
export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT }, () => Array<Cell>(BOARD_WIDTH).fill(null));
}

/** Absolute board coordinates occupied by a piece in its current position/rotation. */
export function getPieceCells(piece: ActivePiece): Array<{ x: number; y: number }> {
  return getRotationOffsets(piece.type, piece.rotation).map((offset) => ({
    x: piece.x + offset.x,
    y: piece.y + offset.y,
  }));
}

/**
 * Whether a piece's cells are all within bounds and don't overlap any
 * already-occupied cell on the board.
 */
export function isValidPosition(board: Board, piece: ActivePiece): boolean {
  for (const cell of getPieceCells(piece)) {
    if (cell.x < 0 || cell.x >= BOARD_WIDTH || cell.y < 0 || cell.y >= BOARD_HEIGHT) {
      return false;
    }
    if (board[cell.y][cell.x] !== null) {
      return false;
    }
  }
  return true;
}

/**
 * Returns a new board with the piece's cells stamped onto it. Does not
 * mutate the input board. Caller is responsible for calling this only when
 * the position is valid (e.g. right before locking a piece).
 */
export function mergePiece(board: Board, piece: ActivePiece): Board {
  const next = board.map((row) => row.slice());
  for (const cell of getPieceCells(piece)) {
    if (cell.y >= 0 && cell.y < BOARD_HEIGHT && cell.x >= 0 && cell.x < BOARD_WIDTH) {
      next[cell.y][cell.x] = piece.type;
    }
  }
  return next;
}
