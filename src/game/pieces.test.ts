import {
  createPiece,
  getPieceCells,
  getShapeCells,
  getShapeGridSize,
  getWallKickOffsets,
  rotateClockwise,
  rotateCounterclockwise,
  TETROMINO_TYPES,
} from './pieces';

describe('TETROMINO_TYPES', () => {
  it('contains exactly the seven standard tetrominoes', () => {
    expect(TETROMINO_TYPES).toHaveLength(7);
    expect(new Set(TETROMINO_TYPES)).toEqual(new Set(['I', 'O', 'T', 'S', 'Z', 'J', 'L']));
  });
});

describe('getShapeCells', () => {
  it('returns 4 occupied cells for every type and rotation', () => {
    for (const type of TETROMINO_TYPES) {
      for (const rotation of [0, 1, 2, 3] as const) {
        expect(getShapeCells(type, rotation)).toHaveLength(4);
      }
    }
  });

  it('keeps the O piece identical across all rotations', () => {
    const base = getShapeCells('O', 0);
    for (const rotation of [1, 2, 3] as const) {
      expect(getShapeCells('O', rotation)).toEqual(base);
    }
  });

  it('returns fresh arrays/objects so callers cannot mutate shared shape data', () => {
    const cells = getShapeCells('T', 0);
    cells[0].row = 99;
    expect(getShapeCells('T', 0)[0].row).not.toBe(99);
  });

  it('matches the expected spawn shape for the T piece (a T pointing up)', () => {
    expect(getShapeCells('T', 0)).toEqual(
      expect.arrayContaining([
        { row: 0, col: 1 },
        { row: 1, col: 0 },
        { row: 1, col: 1 },
        { row: 1, col: 2 },
      ]),
    );
  });

  it('matches the expected spawn shape for the I piece (a horizontal line)', () => {
    expect(getShapeCells('I', 0)).toEqual(
      expect.arrayContaining([
        { row: 1, col: 0 },
        { row: 1, col: 1 },
        { row: 1, col: 2 },
        { row: 1, col: 3 },
      ]),
    );
  });
});

describe('getShapeGridSize', () => {
  it('is 4 for I and O, and 3 for the rest', () => {
    expect(getShapeGridSize('I')).toBe(4);
    expect(getShapeGridSize('O')).toBe(4);
    for (const type of ['T', 'S', 'Z', 'J', 'L'] as const) {
      expect(getShapeGridSize(type)).toBe(3);
    }
  });
});

describe('createPiece', () => {
  it('spawns at rotation 0 and the given/default position', () => {
    const piece = createPiece('T');
    expect(piece.rotation).toBe(0);
    expect(piece.row).toBe(0);
  });

  it('honors an explicit spawn position', () => {
    const piece = createPiece('T', 5, 2);
    expect(piece.row).toBe(5);
    expect(piece.col).toBe(2);
  });
});

describe('getPieceCells', () => {
  it('translates shape cells by the piece anchor position', () => {
    const piece = createPiece('O', 0, 4);
    expect(getPieceCells(piece)).toEqual(
      expect.arrayContaining([
        { row: 0, col: 4 },
        { row: 0, col: 5 },
        { row: 1, col: 4 },
        { row: 1, col: 5 },
      ]),
    );
  });
});

describe('rotateClockwise / rotateCounterclockwise', () => {
  it('cycles through all four states and back', () => {
    let rotation = rotateClockwise(0);
    expect(rotation).toBe(1);
    rotation = rotateClockwise(rotation);
    expect(rotation).toBe(2);
    rotation = rotateClockwise(rotation);
    expect(rotation).toBe(3);
    rotation = rotateClockwise(rotation);
    expect(rotation).toBe(0);
  });

  it('is the inverse of rotateClockwise', () => {
    for (const rotation of [0, 1, 2, 3] as const) {
      expect(rotateCounterclockwise(rotateClockwise(rotation))).toBe(rotation);
    }
  });
});

describe('getWallKickOffsets', () => {
  it('always starts with the no-kick (0, 0) test', () => {
    expect(getWallKickOffsets('T', 0, 1)[0]).toEqual({ row: 0, col: 0 });
    expect(getWallKickOffsets('I', 2, 3)[0]).toEqual({ row: 0, col: 0 });
  });

  it('returns only the no-kick test for the O piece, regardless of transition', () => {
    expect(getWallKickOffsets('O', 0, 1)).toEqual([{ row: 0, col: 0 }]);
    expect(getWallKickOffsets('O', 2, 3)).toEqual([{ row: 0, col: 0 }]);
  });

  it('provides distinct kick data for I compared to the other pieces', () => {
    const iKicks = getWallKickOffsets('I', 0, 1);
    const tKicks = getWallKickOffsets('T', 0, 1);
    expect(iKicks).not.toEqual(tKicks);
  });

  it('throws for an unsupported rotation transition', () => {
    expect(() => getWallKickOffsets('T', 0, 2)).toThrow(RangeError);
  });
});
