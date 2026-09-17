import { createEmptyBoard, setCell, BOARD_WIDTH, BOARD_HEIGHT } from './board';
import { createPiece, Piece } from './pieces';
import {
  getCollisionState,
  hasCollision,
  isValidPosition,
  tryMove,
  rotatePiece,
  resolveRotation,
  translatePiece,
} from './collision';

describe('getCollisionState', () => {
  it('reports no collision for a freshly spawned piece over an empty board', () => {
    const board = createEmptyBoard();
    const piece = createPiece('T');
    const state = getCollisionState(board, piece);
    expect(state.collides).toBe(false);
    expect(state.reasons).toEqual([]);
    expect(state.overlappingCells).toEqual([]);
  });

  it('detects a left-wall collision when the piece extends past column 0', () => {
    const board = createEmptyBoard();
    // I piece spawn occupies cols 0-3 of its 4-wide grid; anchor at col -1
    // pushes its leftmost occupied cell (col 0 of the shape) to col -1.
    const piece = createPiece('I', 0, -1);
    const state = getCollisionState(board, piece);
    expect(state.collides).toBe(true);
    expect(state.reasons).toContain('left-wall');
  });

  it('detects a right-wall collision when the piece extends past the last column', () => {
    const board = createEmptyBoard();
    const piece = createPiece('I', 0, BOARD_WIDTH - 2);
    const state = getCollisionState(board, piece);
    expect(state.collides).toBe(true);
    expect(state.reasons).toContain('right-wall');
  });

  it('detects a floor collision when the piece extends past the last row', () => {
    const board = createEmptyBoard();
    const piece = createPiece('O', BOARD_HEIGHT - 1, 4);
    const state = getCollisionState(board, piece);
    expect(state.collides).toBe(true);
    expect(state.reasons).toContain('floor');
  });

  it('detects a ceiling collision when the piece extends above row 0', () => {
    const board = createEmptyBoard();
    const piece = createPiece('T', -1, 3);
    const state = getCollisionState(board, piece);
    expect(state.collides).toBe(true);
    expect(state.reasons).toContain('ceiling');
  });

  it('detects a piece collision when overlapping an already-filled cell, and reports the overlapping cells', () => {
    const board = createEmptyBoard();
    setCell(board, 1, 4, 2); // occupy where the O piece would land
    const piece = createPiece('O', 0, 4);
    const state = getCollisionState(board, piece);
    expect(state.collides).toBe(true);
    expect(state.reasons).toContain('piece');
    expect(state.overlappingCells).toEqual(
      expect.arrayContaining([{ row: 1, col: 4 }]),
    );
  });

  it('does not flag a collision against an empty cell adjacent to a filled one', () => {
    const board = createEmptyBoard();
    setCell(board, 5, 5, 3);
    const piece = createPiece('O', 3, 0); // far away
    const state = getCollisionState(board, piece);
    expect(state.collides).toBe(false);
  });

  it('can report multiple simultaneous reasons (e.g. off the left wall and onto a filled cell)', () => {
    const board = createEmptyBoard();
    setCell(board, 1, 0, 1);
    const piece = createPiece('I', 0, -1);
    const state = getCollisionState(board, piece);
    expect(state.reasons).toContain('left-wall');
    expect(state.reasons).toContain('piece');
  });
});

describe('hasCollision / isValidPosition', () => {
  it('agree with each other (exact inverses) across a range of positions', () => {
    const board = createEmptyBoard();
    for (let col = -2; col <= BOARD_WIDTH; col++) {
      const piece = createPiece('O', 5, col);
      expect(isValidPosition(board, piece)).toBe(!hasCollision(board, piece));
    }
  });
});

describe('tryMove', () => {
  it('returns the moved piece when the destination is valid', () => {
    const board = createEmptyBoard();
    const piece = createPiece('O', 5, 4);
    const moved = tryMove(board, piece, 1, 0);
    expect(moved).not.toBeNull();
    expect(moved).toEqual({ ...piece, row: 6 });
  });

  it('returns null when the destination would collide with the floor', () => {
    const board = createEmptyBoard();
    const piece = createPiece('O', BOARD_HEIGHT - 2, 4);
    expect(tryMove(board, piece, 1, 0)).toBeNull();
  });

  it('returns null when the destination would collide with a wall', () => {
    const board = createEmptyBoard();
    const piece = createPiece('O', 5, 0);
    expect(tryMove(board, piece, 0, -1)).toBeNull();
  });

  it('returns null when the destination would collide with an existing piece, and leaves the original piece untouched', () => {
    const board = createEmptyBoard();
    setCell(board, 6, 4, 1);
    const piece = createPiece('O', 5, 4);
    const result = tryMove(board, piece, 1, 0);
    expect(result).toBeNull();
    expect(piece).toEqual(createPiece('O', 5, 4));
  });

  it('supports hard-drop-style repeated downward moves until blocked', () => {
    const board = createEmptyBoard();
    let piece: Piece | null = createPiece('O', 0, 4);
    let steps = 0;
    while (true) {
      const next = tryMove(board, piece, 1, 0);
      if (!next) break;
      piece = next;
      steps++;
    }
    // O piece is 2 rows tall, board is 20 rows: it can fall 18 times from row 0.
    expect(steps).toBe(BOARD_HEIGHT - 2);
    expect(piece.row).toBe(BOARD_HEIGHT - 2);
  });
});

describe('rotatePiece', () => {
  it('changes only the rotation, leaving position untouched', () => {
    const piece = createPiece('T', 5, 4);
    const rotated = rotatePiece(piece, 1);
    expect(rotated).toEqual({ ...piece, rotation: 1 });
  });
});

describe('resolveRotation', () => {
  it('succeeds with no kick (0,0) when there is open space', () => {
    const board = createEmptyBoard();
    const piece = createPiece('T', 5, 4);
    const result = resolveRotation(board, piece, 1);
    expect(result.success).toBe(true);
    expect(result.kick).toEqual({ row: 0, col: 0 });
    expect(result.piece).toEqual({ ...piece, rotation: 1 });
  });

  it('kicks away from the left wall when a plain rotation would collide', () => {
    const board = createEmptyBoard();
    // T piece hard against the left wall: spawn shape occupies shape-cols {0,1,2}.
    const piece = createPiece('T', 5, 0);
    const spawnCollision = hasCollision(board, piece);
    expect(spawnCollision).toBe(false);

    const result = resolveRotation(board, piece, 3); // rotate to "L" state (pointing left)
    expect(result.success).toBe(true);
    expect(result.piece).not.toBeNull();
    expect(hasCollision(board, result.piece as Piece)).toBe(false);
  });

  it('fails (no valid kick) when the piece is completely walled in on all sides', () => {
    const board = createEmptyBoard();
    // Surround a T piece at the very top-left corner with filled cells so
    // every kick offset for every transition still collides.
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        setCell(board, row, col, 1);
      }
    }
    // Carve out just enough empty space for the piece's own spawn shape,
    // but leave every neighboring cell filled so no kick can land.
    setCell(board, 0, 1, 0);
    setCell(board, 1, 0, 0);
    setCell(board, 1, 1, 0);
    setCell(board, 1, 2, 0);

    const piece = createPiece('T', 0, 0);
    expect(hasCollision(board, piece)).toBe(false);

    const result = resolveRotation(board, piece, 1);
    expect(result.success).toBe(false);
    expect(result.piece).toBeNull();
    expect(result.kick).toBeNull();
  });

  it('never mutates the input piece', () => {
    const board = createEmptyBoard();
    const piece = createPiece('T', 5, 4);
    const snapshot = { ...piece };
    resolveRotation(board, piece, 1);
    expect(piece).toEqual(snapshot);
  });
});

describe('translatePiece', () => {
  it('returns a new object without mutating the original', () => {
    const piece = createPiece('S', 2, 3);
    const moved = translatePiece(piece, 1, -1);
    expect(moved).toEqual({ ...piece, row: 3, col: 2 });
    expect(piece).toEqual(createPiece('S', 2, 3));
  });
});
