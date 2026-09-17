/**
 * `GameEngine` — the headless Tetris game loop: piece spawning, movement,
 * rotation, locking, line clearing, scoring/leveling and game-over
 * detection.
 *
 * This is where the sound effects built in `src/audio` are actually wired
 * into gameplay: every player action / game event that the task asks for
 * audio on (piece placement, line clear, level up, rotation, soft drop,
 * hard drop, game over) calls `play(effect)` at the exact moment that event
 * happens. A future rendering/controls layer drives this engine's public
 * methods (`moveLeft`, `rotate`, `hardDrop`, `tick`, ...) from
 * keyboard/touch input and a render loop; it does not need to know
 * anything about sound.
 */

import { getSoundEngine, type SoundEffect } from '../audio/soundEngine';
import {
  BOARD_WIDTH,
  createEmptyBoard,
  isValidPosition,
  mergePiece,
  type ActivePiece,
  type Board,
} from './board';
import { clearLines, findFullLines } from './lines';
import { getRotationOffsets, randomPieceType, type PieceType } from './tetrominoes';

export type SoundPlayer = (effect: SoundEffect) => void;

export interface GameEngineOptions {
  /** Called for every effect this engine triggers. Defaults to the shared Web Audio `SoundEngine`. */
  play?: SoundPlayer;
  /** Source of randomness for piece selection. Overridable for deterministic tests. */
  rng?: () => number;
  /** Starting board, mainly for tests that want to set up a near-full board. */
  initialBoard?: Board;
  /** Forces the first two pieces instead of picking randomly. Mainly for tests. */
  initialPieces?: PieceType[];
  /** Starting total lines cleared (e.g. to test crossing a level-up threshold without replaying 9 clears). */
  initialLinesCleared?: number;
  /** Starting level. */
  initialLevel?: number;
  /** Starting score. */
  initialScore?: number;
}

const LINES_PER_LEVEL = 10;

/** Classic guideline-style line-clear scoring, scaled by the current level. */
function scoreForLines(linesCleared: number, level: number): number {
  const base = [0, 100, 300, 500, 800][Math.min(linesCleared, 4)] ?? 0;
  return base * level;
}

function spawnPosition(type: PieceType): { x: number; y: number } {
  // Centered horizontally; y=0 puts the bounding box's top row at the top
  // of the board (some cells within it may still be empty depending on
  // the shape, which is fine).
  const boxSize = type === 'I' || type === 'O' ? 4 : 3;
  return { x: Math.floor((BOARD_WIDTH - boxSize) / 2), y: 0 };
}

export class GameEngine {
  board: Board;
  current: ActivePiece;
  next: PieceType;
  score = 0;
  level = 1;
  linesCleared = 0;
  isGameOver = false;

  private readonly play: SoundPlayer;
  private readonly rng: () => number;
  private readonly pieceQueue: PieceType[];

  constructor(options: GameEngineOptions = {}) {
    this.play = options.play ?? ((effect) => getSoundEngine().play(effect));
    this.rng = options.rng ?? Math.random;
    this.board = options.initialBoard ?? createEmptyBoard();
    this.pieceQueue = options.initialPieces ? [...options.initialPieces] : [];
    this.linesCleared = options.initialLinesCleared ?? 0;
    this.level = options.initialLevel ?? 1;
    this.score = options.initialScore ?? 0;

    const firstType = this.nextPieceType();
    this.next = this.nextPieceType();
    this.current = this.spawnActivePiece(firstType);
  }

  private nextPieceType(): PieceType {
    return this.pieceQueue.shift() ?? randomPieceType(this.rng);
  }

  private spawnActivePiece(type: PieceType): ActivePiece {
    const { x, y } = spawnPosition(type);
    return { type, rotation: 0, x, y };
  }

  /** Moves the active piece one column left, if the destination is free. Plays `move` on success. */
  moveLeft(): boolean {
    return this.tryMove(-1, 0, 'move');
  }

  /** Moves the active piece one column right, if the destination is free. Plays `move` on success. */
  moveRight(): boolean {
    return this.tryMove(1, 0, 'move');
  }

  /**
   * Player-initiated one-row soft drop. Plays `softDrop` when the piece
   * actually moves; if it's already resting on something, locks it instead
   * (which plays `lock` and any follow-on line-clear/level-up/game-over sounds).
   */
  softDrop(): boolean {
    if (this.isGameOver) return false;
    const moved = this.tryMove(0, 1, 'softDrop');
    if (!moved) {
      this.lock();
    }
    return moved;
  }

  /** Attempts to rotate the active piece to its next state. Plays `rotate` on success. */
  rotate(): boolean {
    if (this.isGameOver) return false;
    const nextRotation = (this.current.rotation + 1) % 4;
    const candidate: ActivePiece = { ...this.current, rotation: nextRotation };
    if (!isValidPosition(this.board, candidate)) return false;
    this.current = candidate;
    this.play('rotate');
    return true;
  }

  /**
   * Drops the active piece straight to the floor (or the stack) and locks
   * it immediately. Plays `hardDrop` once, then locking plays `lock` and
   * any follow-on sounds exactly like a normal lock.
   */
  hardDrop(): void {
    if (this.isGameOver) return;
    let candidate: ActivePiece = { ...this.current };
    while (isValidPosition(this.board, { ...candidate, y: candidate.y + 1 })) {
      candidate = { ...candidate, y: candidate.y + 1 };
    }
    this.current = candidate;
    this.play('hardDrop');
    this.lock();
  }

  /**
   * Gravity tick: moves the piece down one row like `softDrop`, but is
   * meant to be driven by the game's timer rather than direct player input,
   * so it stays silent on a plain move (no `softDrop`/`move` sound spam every
   * frame) while still triggering `lock`/`lineClear`/`levelUp`/`gameOver`
   * when the piece settles.
   */
  tick(): void {
    if (this.isGameOver) return;
    const candidate: ActivePiece = { ...this.current, y: this.current.y + 1 };
    if (isValidPosition(this.board, candidate)) {
      this.current = candidate;
    } else {
      this.lock();
    }
  }

  private tryMove(dx: number, dy: number, effect: SoundEffect): boolean {
    if (this.isGameOver) return false;
    const candidate: ActivePiece = { ...this.current, x: this.current.x + dx, y: this.current.y + dy };
    if (!isValidPosition(this.board, candidate)) return false;
    this.current = candidate;
    this.play(effect);
    return true;
  }

  /**
   * Merges the active piece into the board (piece placement), clears any
   * completed lines, updates score/level, and spawns the next piece —
   * triggering `lock`, `lineClear`, `levelUp` and `gameOver` exactly as
   * each of those events actually occurs.
   */
  private lock(): void {
    this.board = mergePiece(this.board, this.current);
    this.play('lock');

    const fullRows = findFullLines(this.board);
    if (fullRows.length > 0) {
      this.board = clearLines(this.board, fullRows);
      this.linesCleared += fullRows.length;
      this.score += scoreForLines(fullRows.length, this.level);
      this.play('lineClear');

      const newLevel = Math.floor(this.linesCleared / LINES_PER_LEVEL) + 1;
      if (newLevel > this.level) {
        this.level = newLevel;
        this.play('levelUp');
      }
    }

    const spawnedType = this.next;
    this.next = this.nextPieceType();
    const spawned = this.spawnActivePiece(spawnedType);

    if (!isValidPosition(this.board, spawned)) {
      this.isGameOver = true;
      this.play('gameOver');
      return;
    }

    this.current = spawned;
  }
}

/** Convenience factory using the shared Web Audio `SoundEngine`. */
export function createGameEngine(options: Omit<GameEngineOptions, 'play'> = {}): GameEngine {
  return new GameEngine(options);
}

export { getRotationOffsets };
