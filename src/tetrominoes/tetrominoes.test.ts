import {
  createTetromino,
  getCells,
  getDefinition,
  rotateClockwise,
  rotateCounterClockwise,
  TETROMINO_TYPES,
  TETROMINOES,
} from './tetrominoes';
import { Point, TetrominoType } from './types';

function normalize(cells: readonly Point[]): string[] {
  return cells.map((c) => `${c.x},${c.y}`).sort();
}

function expectSameShape(a: readonly Point[], b: readonly Point[]): void {
  expect(normalize(a)).toEqual(normalize(b));
}

describe('TETROMINOES data', () => {
  it('defines exactly the seven standard tetromino types', () => {
    expect([...TETROMINO_TYPES].sort()).toEqual(
      ['I', 'J', 'L', 'O', 'S', 'T', 'Z'].sort()
    );
    expect(Object.keys(TETROMINOES).sort()).toEqual(
      ['I', 'J', 'L', 'O', 'S', 'T', 'Z'].sort()
    );
  });

  it('gives every tetromino exactly 4 rotation states of 4 cells each', () => {
    for (const type of TETROMINO_TYPES) {
      const def = getDefinition(type);
      expect(def.rotations).toHaveLength(4);
      for (const state of def.rotations) {
        expect(state).toHaveLength(4);
        for (const cell of state) {
          expect(typeof cell.x).toBe('number');
          expect(typeof cell.y).toBe('number');
        }
      }
    }
  });

  it('assigns a unique, non-empty color to each tetromino', () => {
    const colors = TETROMINO_TYPES.map((t) => getDefinition(t).color);
    expect(colors.every((c) => typeof c === 'string' && c.length > 0)).toBe(
      true
    );
    expect(new Set(colors).size).toBe(colors.length);
  });

  it('gives each tetromino a spawn position', () => {
    for (const type of TETROMINO_TYPES) {
      const spawn = getDefinition(type).spawn;
      expect(typeof spawn.x).toBe('number');
      expect(typeof spawn.y).toBe('number');
    }
  });

  it('includes the pivot cell (0,0) in every rotation state of pieces with a real pivot', () => {
    const piecesWithPivot: TetrominoType[] = ['T', 'S', 'Z', 'J', 'L'];
    for (const type of piecesWithPivot) {
      const def = getDefinition(type);
      for (const state of def.rotations) {
        expect(state.some((c) => c.x === 0 && c.y === 0)).toBe(true);
      }
    }
  });
});

describe('rotation shapes', () => {
  it('rotates the O piece into an identical shape in all 4 states', () => {
    const def = getDefinition('O');
    expectSameShape(def.rotations[0], def.rotations[1]);
    expectSameShape(def.rotations[1], def.rotations[2]);
    expectSameShape(def.rotations[2], def.rotations[3]);
  });

  it('rotates the I piece between horizontal and vertical orientations', () => {
    const def = getDefinition('I');
    const horizontal = def.rotations[0];
    const vertical = def.rotations[1];

    expect(new Set(horizontal.map((c) => c.y)).size).toBe(1); // all same row
    expect(new Set(vertical.map((c) => c.x)).size).toBe(1); // all same column

    expectSameShape(def.rotations[0], def.rotations[2]);
    expectSameShape(def.rotations[1], def.rotations[3]);
  });

  it('rotates the T piece through 4 distinct orientations and back to start', () => {
    const def = getDefinition('T');
    const shapes = def.rotations.map(normalize);
    const distinct = new Set(shapes.map((s) => s.join('|')));
    expect(distinct.size).toBe(4);

    // Rotating state 3 one more step clockwise should reproduce state 0.
    function rotateCW(state: readonly Point[]): Point[] {
      return state.map((p) => ({ x: -p.y, y: p.x }));
    }
    expectSameShape(rotateCW(def.rotations[3]), def.rotations[0]);
  });

  it('produces mirrored S and Z spawn shapes', () => {
    const s = getDefinition('S').rotations[0];
    const z = getDefinition('Z').rotations[0];
    const mirroredS = s.map((p) => ({ x: -p.x, y: p.y }));
    expectSameShape(mirroredS, z);
  });

  for (const type of ['J', 'L'] as TetrominoType[]) {
    it(`gives ${type} four distinct rotation orientations`, () => {
      const def = getDefinition(type);
      const shapes = def.rotations.map(normalize).map((s) => s.join('|'));
      expect(new Set(shapes).size).toBe(4);
    });
  }

  it('produces mirrored J and L spawn shapes', () => {
    const j = getDefinition('J').rotations[0];
    const l = getDefinition('L').rotations[0];
    const mirroredJ = j.map((p) => ({ x: -p.x, y: p.y }));
    expectSameShape(mirroredJ, l);
  });
});

describe('createTetromino / getCells', () => {
  it('spawns a piece at its defined spawn position and rotation 0', () => {
    for (const type of TETROMINO_TYPES) {
      const instance = createTetromino(type);
      expect(instance.type).toBe(type);
      expect(instance.rotationIndex).toBe(0);
      expect(instance.position).toEqual(getDefinition(type).spawn);
    }
  });

  it('computes absolute board cells as spawn position + offsets', () => {
    const instance = createTetromino('T');
    const cells = getCells(instance);
    const def = getDefinition('T');
    const expected = def.rotations[0].map((o) => ({
      x: def.spawn.x + o.x,
      y: def.spawn.y + o.y,
    }));
    expectSameShape(cells, expected);
  });

  it('always returns exactly 4 cells', () => {
    for (const type of TETROMINO_TYPES) {
      expect(getCells(createTetromino(type))).toHaveLength(4);
    }
  });
});

describe('rotateClockwise / rotateCounterClockwise', () => {
  it('cycles rotation index forward 0->1->2->3->0', () => {
    let instance = createTetromino('T');
    expect(instance.rotationIndex).toBe(0);
    instance = rotateClockwise(instance);
    expect(instance.rotationIndex).toBe(1);
    instance = rotateClockwise(instance);
    expect(instance.rotationIndex).toBe(2);
    instance = rotateClockwise(instance);
    expect(instance.rotationIndex).toBe(3);
    instance = rotateClockwise(instance);
    expect(instance.rotationIndex).toBe(0);
  });

  it('cycles rotation index backward 0->3->2->1->0', () => {
    let instance = createTetromino('T');
    instance = rotateCounterClockwise(instance);
    expect(instance.rotationIndex).toBe(3);
    instance = rotateCounterClockwise(instance);
    expect(instance.rotationIndex).toBe(2);
  });

  it('does not mutate the original instance', () => {
    const instance = createTetromino('L');
    const rotated = rotateClockwise(instance);
    expect(instance.rotationIndex).toBe(0);
    expect(rotated.rotationIndex).toBe(1);
    expect(rotated).not.toBe(instance);
  });

  it('preserves position while rotating', () => {
    const instance = createTetromino('J');
    const rotated = rotateClockwise(instance);
    expect(rotated.position).toEqual(instance.position);
  });
});
