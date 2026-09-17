import { describe, it, expect } from 'vitest';
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  createEmptyBoard,
  getPieceCells,
  isValidPosition,
  mergePiece,
  type ActivePiece,
} from '../board';

describe('createEmptyBoard', () => {
  it('creates a BOARD_WIDTH x BOARD_HEIGHT grid of empty cells', () => {
    const board = createEmptyBoard();
    expect(board.length).toBe(BOARD_HEIGHT);
    for (const row of board) {
      expect(row.length).toBe(BOARD_WIDTH);
      expect(row.every((cell) => cell === null)).toBe(true);
    }
  });
});

describe('getPieceCells', () => {
  it('returns the 4 absolute cells for an O piece at the origin', () => {
    const piece: ActivePiece = { type: 'O', rotation: 0, x: 0, y: 0 };
    const cells = getPieceCells(piece);
    expect(cells).toEqual(
      expect.arrayContaining([
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 1, y: 2 },
        { x: 2, y: 2 },
      ]),
    );
    expect(cells).toHaveLength(4);
  });

  it('shifts cells by the piece position', () => {
    const piece: ActivePiece = { type: 'O', rotation: 0, x: 3, y: 5 };
    const cells = getPieceCells(piece);
    expect(cells).toEqual(
      expect.arrayContaining([
        { x: 4, y: 6 },
        { x: 5, y: 6 },
        { x: 4, y: 7 },
        { x: 5, y: 7 },
      ]),
    );
  });
});

describe('isValidPosition', () => {
  it('accepts a piece fully inside an empty board', () => {
    const board = createEmptyBoard();
    const piece: ActivePiece = { type: 'T', rotation: 0, x: 3, y: 0 };
    expect(isValidPosition(board, piece)).toBe(true);
  });

  it('rejects a piece that goes past the left edge', () => {
    const board = createEmptyBoard();
    const piece: ActivePiece = { type: 'I', rotation: 0, x: -1, y: 0 };
    expect(isValidPosition(board, piece)).toBe(false);
  });

  it('rejects a piece that goes past the right edge', () => {
    const board = createEmptyBoard();
    const piece: ActivePiece = { type: 'O', rotation: 0, x: BOARD_WIDTH - 1, y: 0 };
    expect(isValidPosition(board, piece)).toBe(false);
  });

  it('rejects a piece that goes past the bottom edge', () => {
    const board = createEmptyBoard();
    const piece: ActivePiece = { type: 'O', rotation: 0, x: 0, y: BOARD_HEIGHT - 1 };
    expect(isValidPosition(board, piece)).toBe(false);
  });

  it('rejects a piece overlapping an already-occupied cell', () => {
    const board = createEmptyBoard();
    board[10][4] = 'T';
    const piece: ActivePiece = { type: 'O', rotation: 0, x: 3, y: 8 };
    expect(isValidPosition(board, piece)).toBe(false);
  });
});

describe('mergePiece', () => {
  it('stamps the piece cells onto a new board without mutating the original', () => {
    const board = createEmptyBoard();
    const piece: ActivePiece = { type: 'O', rotation: 0, x: 0, y: 0 };
    const merged = mergePiece(board, piece);

    expect(merged[1][1]).toBe('O');
    expect(merged[1][2]).toBe('O');
    expect(merged[2][1]).toBe('O');
    expect(merged[2][2]).toBe('O');

    // Original board is untouched.
    expect(board[1][1]).toBeNull();
  });
});
