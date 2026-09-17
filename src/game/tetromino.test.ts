import {
  getTetrominoHeight,
  getTetrominoId,
  getTetrominoWidth,
  TETROMINO_IDS,
  TETROMINO_SHAPES,
  TETROMINO_TYPES,
  TetrominoType,
} from './tetromino';

describe('TETROMINO_TYPES', () => {
  it('contains exactly the seven canonical tetromino types', () => {
    expect(TETROMINO_TYPES).toHaveLength(7);
    expect(new Set(TETROMINO_TYPES)).toEqual(
      new Set([
        TetrominoType.I,
        TetrominoType.O,
        TetrominoType.T,
        TetrominoType.S,
        TetrominoType.Z,
        TetrominoType.J,
        TetrominoType.L,
      ]),
    );
  });
});

describe('TETROMINO_IDS', () => {
  it('assigns a unique, positive integer id to every type', () => {
    const ids = TETROMINO_TYPES.map((type) => TETROMINO_IDS[type]);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(Number.isInteger(id)).toBe(true);
      expect(id).toBeGreaterThan(0);
    }
  });

  it('never assigns EMPTY_CELL (0) as a piece id', () => {
    for (const type of TETROMINO_TYPES) {
      expect(TETROMINO_IDS[type]).not.toBe(0);
    }
  });
});

describe('getTetrominoId', () => {
  it('returns the id registered in TETROMINO_IDS', () => {
    for (const type of TETROMINO_TYPES) {
      expect(getTetrominoId(type)).toBe(TETROMINO_IDS[type]);
    }
  });
});

describe('TETROMINO_SHAPES', () => {
  it('gives every tetromino exactly four cells', () => {
    for (const type of TETROMINO_TYPES) {
      expect(TETROMINO_SHAPES[type]).toHaveLength(4);
    }
  });

  it('never places a cell at a negative row or column', () => {
    for (const type of TETROMINO_TYPES) {
      for (const offset of TETROMINO_SHAPES[type]) {
        expect(offset.row).toBeGreaterThanOrEqual(0);
        expect(offset.col).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('has no duplicate cells within a single shape', () => {
    for (const type of TETROMINO_TYPES) {
      const seen = new Set(TETROMINO_SHAPES[type].map((o) => `${o.row},${o.col}`));
      expect(seen.size).toBe(4);
    }
  });
});

describe('getTetrominoWidth / getTetrominoHeight', () => {
  it('reports a 4x1 bounding box for I', () => {
    expect(getTetrominoWidth(TetrominoType.I)).toBe(4);
    expect(getTetrominoHeight(TetrominoType.I)).toBe(1);
  });

  it('reports a 2x2 bounding box for O', () => {
    expect(getTetrominoWidth(TetrominoType.O)).toBe(2);
    expect(getTetrominoHeight(TetrominoType.O)).toBe(2);
  });

  it('reports a 3x2 bounding box for T, S, Z, J and L', () => {
    for (const type of [
      TetrominoType.T,
      TetrominoType.S,
      TetrominoType.Z,
      TetrominoType.J,
      TetrominoType.L,
    ]) {
      expect(getTetrominoWidth(type)).toBe(3);
      expect(getTetrominoHeight(type)).toBe(2);
    }
  });
});
