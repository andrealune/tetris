import { DEFAULT_PREVIEW_SIZE, PieceQueue, SevenBagRandomizer, shuffle } from './pieceQueue';
import { TETROMINO_TYPES, TetrominoType } from './tetromino';

/** A deterministic "random" source that cycles through fixed values. */
function sequence(values: number[]): () => number {
  let i = 0;
  return () => {
    const value = values[i % values.length];
    i++;
    return value;
  };
}

describe('shuffle', () => {
  it('returns every input item exactly once', () => {
    const items = [1, 2, 3, 4, 5, 6, 7];
    const shuffled = shuffle(items, Math.random);
    expect(shuffled).toHaveLength(items.length);
    expect([...shuffled].sort()).toEqual([...items].sort());
  });

  it('does not mutate the input array', () => {
    const items = [1, 2, 3, 4];
    const copy = [...items];
    shuffle(items, Math.random);
    expect(items).toEqual(copy);
  });

  it('is deterministic for a fixed random source', () => {
    const random = sequence([0, 0, 0, 0]);
    const a = shuffle([1, 2, 3, 4], sequence([0, 0, 0, 0]));
    const b = shuffle([1, 2, 3, 4], random);
    expect(a).toEqual(b);
  });
});

describe('SevenBagRandomizer', () => {
  it('deals each of the seven piece types exactly once before repeating', () => {
    const randomizer = new SevenBagRandomizer(Math.random);
    const bag = Array.from({ length: 7 }, () => randomizer.next());
    expect(new Set(bag)).toEqual(new Set(TETROMINO_TYPES));
    expect(bag).toHaveLength(7);
  });

  it('never produces a drought longer than 12 pieces for any given type (two bags)', () => {
    const randomizer = new SevenBagRandomizer(Math.random);
    const drawn: TetrominoType[] = Array.from({ length: 7 * 20 }, () => randomizer.next());

    for (const type of TETROMINO_TYPES) {
      let sinceLast = 0;
      let maxGap = 0;
      for (const piece of drawn) {
        if (piece === type) {
          maxGap = Math.max(maxGap, sinceLast);
          sinceLast = 0;
        } else {
          sinceLast++;
        }
      }
      // Worst case: type is last in one bag and last in the next => 12 pieces between draws.
      expect(maxGap).toBeLessThanOrEqual(12);
    }
  });

  it('refills with a fresh, complete bag once the current one is exhausted', () => {
    const randomizer = new SevenBagRandomizer(Math.random);
    const firstBag = Array.from({ length: 7 }, () => randomizer.next());
    const secondBag = Array.from({ length: 7 }, () => randomizer.next());
    expect(new Set(firstBag)).toEqual(new Set(TETROMINO_TYPES));
    expect(new Set(secondBag)).toEqual(new Set(TETROMINO_TYPES));
  });

  it('is deterministic given a fixed random source', () => {
    const values = [0.1, 0.9, 0.3, 0.7, 0.5, 0.2, 0.6];
    const a = new SevenBagRandomizer(sequence(values));
    const b = new SevenBagRandomizer(sequence(values));
    const drawnA = Array.from({ length: 14 }, () => a.next());
    const drawnB = Array.from({ length: 14 }, () => b.next());
    expect(drawnA).toEqual(drawnB);
  });
});

describe('PieceQueue', () => {
  it('keeps at least previewSize pieces available without consuming next()', () => {
    const queue = new PieceQueue({ previewSize: 3, random: Math.random });
    const preview = queue.peek();
    expect(preview).toHaveLength(3);

    const previewAgain = queue.peek();
    expect(previewAgain).toEqual(preview); // peeking is side-effect free
  });

  it('defaults to a preview size of DEFAULT_PREVIEW_SIZE', () => {
    const queue = new PieceQueue({ random: Math.random });
    expect(queue.peek()).toHaveLength(DEFAULT_PREVIEW_SIZE);
  });

  it('next() returns the piece that peek() reported as coming up', () => {
    const queue = new PieceQueue({ previewSize: 2, random: Math.random });
    const [expectedNext] = queue.peek(1);
    expect(queue.next()).toBe(expectedNext);
  });

  it('advances the preview window as pieces are consumed', () => {
    const queue = new PieceQueue({ previewSize: 2, random: Math.random });
    const before = queue.peek(2);
    queue.next();
    const after = queue.peek(2);
    // The second upcoming piece before consuming becomes the first afterwards.
    expect(after[0]).toBe(before[1]);
  });

  it('supports peeking further ahead than the configured preview size', () => {
    const queue = new PieceQueue({ previewSize: 1, random: Math.random });
    const deepPreview = queue.peek(10);
    expect(deepPreview).toHaveLength(10);
  });

  it('still deals every piece via the seven-bag algorithm end-to-end', () => {
    const queue = new PieceQueue({ previewSize: 4, random: Math.random });
    const drawn = Array.from({ length: 7 }, () => queue.next());
    expect(new Set(drawn)).toEqual(new Set(TETROMINO_TYPES));
  });

  it('rejects a negative previewSize', () => {
    expect(() => new PieceQueue({ previewSize: -1 })).toThrow(RangeError);
  });

  it('rejects a negative count passed to peek', () => {
    const queue = new PieceQueue();
    expect(() => queue.peek(-1)).toThrow(RangeError);
  });

  it('is deterministic given a fixed random source', () => {
    const values = [0.1, 0.9, 0.3, 0.7, 0.5, 0.2, 0.6, 0.4, 0.8];
    const a = new PieceQueue({ previewSize: 3, random: sequence(values) });
    const b = new PieceQueue({ previewSize: 3, random: sequence(values) });
    const drawnA = Array.from({ length: 10 }, () => a.next());
    const drawnB = Array.from({ length: 10 }, () => b.next());
    expect(drawnA).toEqual(drawnB);
  });
});
