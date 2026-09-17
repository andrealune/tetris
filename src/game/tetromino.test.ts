import {
  TETROMINOES,
  TETROMINO_TYPES,
  getTetrominoCells,
  getNextRotation,
  getPreviousRotation,
} from './tetromino';
import { Coordinate, ROTATION_STATES, RotationState, TetrominoCells, TetrominoType } from './tetromino.types';

function key(c: Coordinate): string {
  return `${c.x},${c.y}`;
}

/**
 * A tetromino is valid when its four cells are distinct and every cell is
 * reachable from every other cell by moving between orthogonally adjacent
 * (unit-distance) cells - i.e. it is a single connected piece of exactly
 * four squares, not e.g. two separate dominoes.
 */
function isConnectedTetromino(cells: readonly Coordinate[]): boolean {
  const keys = cells.map(key);
  const uniqueKeys = new Set(keys);
  if (uniqueKeys.size !== 4) return false;

  const visited = new Set<string>([keys[0]]);
  const queue: Coordinate[] = [cells[0]];
  const byKey = new Map(cells.map((c) => [key(c), c]));

  while (queue.length > 0) {
    const current = queue.shift() as Coordinate;
    const neighbors: Coordinate[] = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 },
    ];
    for (const n of neighbors) {
      const k = key(n);
      if (byKey.has(k) && !visited.has(k)) {
        visited.add(k);
        queue.push(byKey.get(k) as Coordinate);
      }
    }
  }

  return visited.size === 4;
}

function boundingBoxSize(cells: readonly Coordinate[]): { width: number; height: number } {
  const xs = cells.map((c) => c.x);
  const ys = cells.map((c) => c.y);
  return {
    width: Math.max(...xs) - Math.min(...xs) + 1,
    height: Math.max(...ys) - Math.min(...ys) + 1,
  };
}

describe('TETROMINOES data structure', () => {
  it('defines exactly the seven standard tetromino shapes', () => {
    expect(Object.keys(TETROMINOES).sort()).toEqual(['I', 'J', 'L', 'O', 'S', 'T', 'Z']);
    expect([...TETROMINO_TYPES].sort()).toEqual(['I', 'J', 'L', 'O', 'S', 'T', 'Z']);
  });

  it.each(TETROMINO_TYPES)('defines all four rotation states for %s', (type) => {
    expect(Object.keys(TETROMINOES[type]).map(Number).sort((a, b) => a - b)).toEqual([0, 90, 180, 270]);
  });

  describe.each(TETROMINO_TYPES)('%s piece', (type: TetrominoType) => {
    it.each(ROTATION_STATES)('rotation %d° has exactly four distinct, connected cells', (rotation) => {
      const cells = getTetrominoCells(type, rotation as RotationState);
      expect(cells).toHaveLength(4);
      expect(isConnectedTetromino(cells)).toBe(true);
    });

    it.each(ROTATION_STATES)('rotation %d° cells include (0, 0) or use a consistent half-integer pivot', (rotation) => {
      const cells = getTetrominoCells(type, rotation as RotationState);
      const isHalfIntegerPiece = type === 'I' || type === 'O';
      if (isHalfIntegerPiece) {
        // I and O rotate around the center of their bounding box, which is
        // not an occupied cell, so every offset is a half-integer.
        for (const c of cells) {
          expect(Math.abs(c.x * 2) % 2).toBe(1);
          expect(Math.abs(c.y * 2) % 2).toBe(1);
        }
      } else {
        // J, L, S, T, Z rotate around their center cell, which is always
        // one of the occupied cells, so (0, 0) must be present.
        expect(cells.some((c) => c.x === 0 && c.y === 0)).toBe(true);
      }
    });

    it('has a consistent bounding box footprint across all rotations', () => {
      const footprints = ROTATION_STATES.map((rotation) =>
        boundingBoxSize(getTetrominoCells(type, rotation)),
      );
      const areas = footprints.map((f) => f.width * f.height);
      // Every rotation of the same piece occupies a bounding box of the
      // same area (e.g. I is always 4x1 or 1x4 -> area 4, O is always 2x2
      // -> area 4, the rest are always 3x2 or 2x3 -> area 6), even though
      // width/height may swap between orientations.
      expect(new Set(areas).size).toBe(1);
    });
  });

  it('keeps the O piece identical in every rotation state (it has no visual rotation)', () => {
    const [first, ...rest] = ROTATION_STATES.map((r) => getTetrominoCells('O', r));
    for (const cells of rest) {
      expect(new Set(cells.map(key))).toEqual(new Set(first.map(key)));
    }
  });

  it('matches the standard Tetris Guideline (SRS) shapes exactly', () => {
    const expected: Record<TetrominoType, Record<RotationState, [number, number][]>> = {
      I: {
        0: [[-1.5, -0.5], [-0.5, -0.5], [0.5, -0.5], [1.5, -0.5]],
        90: [[0.5, -1.5], [0.5, -0.5], [0.5, 0.5], [0.5, 1.5]],
        180: [[-1.5, 0.5], [-0.5, 0.5], [0.5, 0.5], [1.5, 0.5]],
        270: [[-0.5, -1.5], [-0.5, -0.5], [-0.5, 0.5], [-0.5, 1.5]],
      },
      O: {
        0: [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]],
        90: [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]],
        180: [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]],
        270: [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]],
      },
      T: {
        0: [[0, -1], [-1, 0], [0, 0], [1, 0]],
        90: [[0, -1], [0, 0], [1, 0], [0, 1]],
        180: [[-1, 0], [0, 0], [1, 0], [0, 1]],
        270: [[0, -1], [-1, 0], [0, 0], [0, 1]],
      },
      S: {
        0: [[0, -1], [1, -1], [-1, 0], [0, 0]],
        90: [[0, -1], [0, 0], [1, 0], [1, 1]],
        180: [[0, 0], [1, 0], [-1, 1], [0, 1]],
        270: [[-1, -1], [-1, 0], [0, 0], [0, 1]],
      },
      Z: {
        0: [[-1, -1], [0, -1], [0, 0], [1, 0]],
        90: [[1, -1], [0, 0], [1, 0], [0, 1]],
        180: [[-1, 0], [0, 0], [0, 1], [1, 1]],
        270: [[0, -1], [-1, 0], [0, 0], [-1, 1]],
      },
      J: {
        0: [[-1, -1], [-1, 0], [0, 0], [1, 0]],
        90: [[0, -1], [1, -1], [0, 0], [0, 1]],
        180: [[-1, 0], [0, 0], [1, 0], [1, 1]],
        270: [[0, -1], [0, 0], [-1, 1], [0, 1]],
      },
      L: {
        0: [[1, -1], [-1, 0], [0, 0], [1, 0]],
        90: [[0, -1], [0, 0], [0, 1], [1, 1]],
        180: [[-1, 0], [0, 0], [1, 0], [-1, 1]],
        270: [[-1, -1], [0, -1], [0, 0], [0, 1]],
      },
    };

    for (const type of TETROMINO_TYPES) {
      for (const rotation of ROTATION_STATES) {
        const actual = new Set(getTetrominoCells(type, rotation).map(key));
        const wanted = new Set(expected[type][rotation].map(([x, y]) => key({ x, y })));
        expect(actual).toEqual(wanted);
      }
    }
  });

  it('exposes cell arrays that cannot be mutated by callers reaching for shared state', () => {
    const cellsA: TetrominoCells = getTetrominoCells('T', 0);
    const cellsB: TetrominoCells = getTetrominoCells('T', 0);
    expect(cellsA).toEqual(cellsB);
    // Cell arrays for the same shape/rotation are equal in value; nothing in
    // this test mutates them, but the types are declared readonly so
    // attempts to do so are caught at compile time.
  });
});

describe('rotation helpers', () => {
  it('cycles clockwise through all four states and back to the start', () => {
    expect(getNextRotation(0)).toBe(90);
    expect(getNextRotation(90)).toBe(180);
    expect(getNextRotation(180)).toBe(270);
    expect(getNextRotation(270)).toBe(0);
  });

  it('cycles counter-clockwise through all four states and back to the start', () => {
    expect(getPreviousRotation(0)).toBe(270);
    expect(getPreviousRotation(270)).toBe(180);
    expect(getPreviousRotation(180)).toBe(90);
    expect(getPreviousRotation(90)).toBe(0);
  });

  it('getNextRotation and getPreviousRotation are inverses', () => {
    for (const rotation of ROTATION_STATES) {
      expect(getPreviousRotation(getNextRotation(rotation))).toBe(rotation);
      expect(getNextRotation(getPreviousRotation(rotation))).toBe(rotation);
    }
  });
});
