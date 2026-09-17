/**
 * Random tetromino generation.
 *
 * Uses the "7-bag" (a.k.a. "random generator") algorithm from the
 * Tetris Guideline: each of the seven tetromino types is placed into a
 * bag exactly once, the bag is shuffled, and pieces are dealt out one
 * at a time until the bag is empty, at which point a new full bag is
 * shuffled and refilled. This guarantees every piece type appears
 * exactly once every seven pieces, preventing long droughts (or
 * floods) of any single type, while still feeling random.
 *
 * `PieceQueue` wraps the bag generator with a lookahead buffer so
 * callers can support a "next piece" (or multi-piece) preview UI
 * without affecting what `next()` actually deals out.
 */

import { TETROMINO_TYPES, TetrominoType } from './tetromino';

/** A source of randomness in `[0, 1)`, matching `Math.random`'s contract. */
export type RandomSource = () => number;

/**
 * Shuffles a copy of `items` in place using the Fisher-Yates algorithm
 * and returns it. Does not mutate the input array.
 */
export function shuffle<T>(items: readonly T[], random: RandomSource = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generates tetrominoes using the seven-bag algorithm: every type
 * appears exactly once per "bag" of seven, in a random order, before
 * the next bag is drawn.
 */
export class SevenBagRandomizer {
  private readonly random: RandomSource;
  private bag: TetrominoType[] = [];

  constructor(random: RandomSource = Math.random) {
    this.random = random;
  }

  /** Draws the next tetromino type, refilling the bag when it's empty. */
  next(): TetrominoType {
    if (this.bag.length === 0) {
      this.bag = shuffle(TETROMINO_TYPES, this.random);
    }
    // `shift()` cannot return `undefined` here: the refill above
    // guarantees `this.bag` is non-empty before this line runs.
    return this.bag.shift() as TetrominoType;
  }
}

/** Default number of upcoming pieces exposed for a "next piece" preview. */
export const DEFAULT_PREVIEW_SIZE = 1;

export interface PieceQueueOptions {
  /** Source of randomness, injectable for deterministic tests. */
  random?: RandomSource;
  /** How many upcoming pieces `peek`/`peekAll` should keep available. */
  previewSize?: number;
}

/**
 * A queue of upcoming tetrominoes, backed by `SevenBagRandomizer`, that
 * keeps at least `previewSize` pieces buffered so a UI can preview
 * what's coming next without consuming it from the queue.
 */
export class PieceQueue {
  private readonly randomizer: SevenBagRandomizer;
  private readonly previewSize: number;
  private queue: TetrominoType[] = [];

  constructor(options: PieceQueueOptions = {}) {
    if (options.previewSize !== undefined) {
      if (!Number.isInteger(options.previewSize) || options.previewSize < 0) {
        throw new RangeError(
          `previewSize must be a non-negative integer, got ${options.previewSize}`,
        );
      }
    }

    this.randomizer = new SevenBagRandomizer(options.random);
    this.previewSize = options.previewSize ?? DEFAULT_PREVIEW_SIZE;
    this.ensureBuffered();
  }

  /** Tops up the internal queue until at least one piece beyond the preview is available. */
  private ensureBuffered(): void {
    while (this.queue.length <= this.previewSize) {
      this.queue.push(this.randomizer.next());
    }
  }

  /**
   * Removes and returns the next piece from the front of the queue,
   * refilling the buffer afterwards so the preview stays full.
   */
  next(): TetrominoType {
    this.ensureBuffered();
    // `shift()` cannot return `undefined`: `ensureBuffered` guarantees
    // at least `previewSize + 1 >= 1` pieces are queued.
    const piece = this.queue.shift() as TetrominoType;
    this.ensureBuffered();
    return piece;
  }

  /**
   * Returns the upcoming `count` pieces without removing them from the
   * queue (defaults to this queue's configured preview size).
   */
  peek(count: number = this.previewSize): TetrominoType[] {
    if (!Number.isInteger(count) || count < 0) {
      throw new RangeError(`count must be a non-negative integer, got ${count}`);
    }

    while (this.queue.length < count) {
      this.queue.push(this.randomizer.next());
    }

    return this.queue.slice(0, count);
  }
}
