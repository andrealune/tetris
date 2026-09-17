import { describe, it, expect, vi } from 'vitest';
import { GameEngine } from '../gameEngine';
import { createEmptyBoard, BOARD_WIDTH } from '../board';
import type { SoundEffect } from '../../audio/soundEngine';

/**
 * These tests are the concrete proof that the sound effects built in
 * `src/audio` are wired into real gameplay events, not just a standalone,
 * unused library: every one of the 7 events named in the task (piece
 * placement, line clear, level up, rotation, soft drop, hard drop, game
 * over) is exercised end-to-end through `GameEngine`'s public API, and each
 * assertion checks the exact effect name passed to `play()`.
 */

function makeEngine(overrides: Partial<ConstructorParameters<typeof GameEngine>[0]> = {}) {
  const calls: SoundEffect[] = [];
  const play = vi.fn((effect: SoundEffect) => {
    calls.push(effect);
  });
  const engine = new GameEngine({
    play,
    rng: () => 0, // deterministic random piece selection (always picks PIECE_TYPES[0] === 'I')
    ...overrides,
  });
  return { engine, play, calls };
}

describe('GameEngine sound wiring', () => {
  it('plays "move" when the piece moves left or right', () => {
    const { engine, calls } = makeEngine({ initialPieces: ['T', 'T'] });
    expect(engine.moveLeft()).toBe(true);
    expect(engine.moveRight()).toBe(true);
    expect(calls.filter((c) => c === 'move')).toHaveLength(2);
  });

  it('does not play "move" when the move is blocked', () => {
    const { engine, calls } = makeEngine({ initialPieces: ['T', 'T'] });
    // Push the piece all the way to the left wall, then try to go further.
    while (engine.moveLeft()) {
      /* keep moving */
    }
    calls.length = 0;
    expect(engine.moveLeft()).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it('plays "rotate" when the piece successfully rotates', () => {
    const { engine, calls } = makeEngine({ initialPieces: ['T', 'T'] });
    expect(engine.rotate()).toBe(true);
    expect(calls).toContain('rotate');
  });

  it('plays "softDrop" for a player-initiated soft drop that actually moves', () => {
    const { engine, calls } = makeEngine({ initialPieces: ['T', 'T'] });
    expect(engine.softDrop()).toBe(true);
    expect(calls).toContain('softDrop');
  });

  it('plays "hardDrop" then "lock" when hard-dropping a piece', () => {
    const { engine, calls } = makeEngine({ initialPieces: ['T', 'T'] });
    engine.hardDrop();
    expect(calls).toContain('hardDrop');
    expect(calls).toContain('lock');
    // hardDrop must fire before the lock/placement sound it causes.
    expect(calls.indexOf('hardDrop')).toBeLessThan(calls.indexOf('lock'));
  });

  it('plays "lock" (piece placement) whenever a piece settles via softDrop', () => {
    const { engine, calls } = makeEngine({ initialPieces: ['O', 'O'] });
    // Drop until the piece can no longer move down; the final softDrop()
    // call locks it.
    let guard = 0;
    while (engine.softDrop() && guard < 40) {
      guard += 1;
    }
    expect(calls).toContain('lock');
  });

  it('plays "lineClear" when locking a piece completes a full row', () => {
    // Row 19 is filled except column 9. Dropping a vertical I piece into
    // column 9 completes it.
    const board = createEmptyBoard();
    for (let x = 0; x < BOARD_WIDTH - 1; x++) {
      board[19][x] = 'T';
    }

    const { engine, calls } = makeEngine({ initialBoard: board, initialPieces: ['I', 'I'] });

    // Rotate the I piece to vertical, then shift it into column 9.
    expect(engine.rotate()).toBe(true); // rotation 1: single column at piece.x + 2
    for (let i = 0; i < 4; i++) {
      expect(engine.moveRight()).toBe(true);
    }

    engine.hardDrop();

    expect(calls).toContain('lineClear');
    expect(engine.linesCleared).toBe(1);
  });

  it('plays "levelUp" when a line clear crosses a 10-line threshold', () => {
    const board = createEmptyBoard();
    for (let x = 0; x < BOARD_WIDTH - 1; x++) {
      board[19][x] = 'T';
    }

    const { engine, calls } = makeEngine({
      initialBoard: board,
      initialPieces: ['I', 'I'],
      initialLinesCleared: 9,
      initialLevel: 1,
    });

    engine.rotate();
    for (let i = 0; i < 4; i++) engine.moveRight();
    engine.hardDrop();

    expect(calls).toContain('levelUp');
    expect(engine.level).toBe(2);
    expect(engine.linesCleared).toBe(10);
  });

  it('does not play "levelUp" for a line clear that does not cross a 10-line multiple', () => {
    const board = createEmptyBoard();
    for (let x = 0; x < BOARD_WIDTH - 1; x++) {
      board[19][x] = 'T';
    }

    const { engine, calls } = makeEngine({
      initialBoard: board,
      initialPieces: ['I', 'I'],
      initialLinesCleared: 3,
      initialLevel: 1,
    });

    engine.rotate();
    for (let i = 0; i < 4; i++) engine.moveRight();
    engine.hardDrop();

    expect(calls).toContain('lineClear');
    expect(calls).not.toContain('levelUp');
    expect(engine.level).toBe(1);
  });

  it('plays "gameOver" when the next piece cannot spawn', () => {
    // Block the center columns across the rows every spawn box occupies,
    // without completing any row (so no premature line clear).
    const board = createEmptyBoard();
    for (let y = 0; y <= 3; y++) {
      for (let x = 3; x <= 6; x++) {
        board[y][x] = 'T';
      }
    }

    const { engine, calls } = makeEngine({ initialBoard: board, initialPieces: ['O', 'O'] });

    engine.hardDrop();

    expect(calls).toContain('gameOver');
    expect(engine.isGameOver).toBe(true);
  });

  it('stops playing any sound once the game is over', () => {
    const board = createEmptyBoard();
    for (let y = 0; y <= 3; y++) {
      for (let x = 3; x <= 6; x++) {
        board[y][x] = 'T';
      }
    }
    const { engine, calls } = makeEngine({ initialBoard: board, initialPieces: ['O', 'O'] });
    engine.hardDrop();
    expect(engine.isGameOver).toBe(true);

    calls.length = 0;
    expect(engine.moveLeft()).toBe(false);
    expect(engine.rotate()).toBe(false);
    expect(engine.softDrop()).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it('defaults to the shared Web Audio SoundEngine when no play() override is given', () => {
    // Constructing without a `play` override must not throw even though
    // there's no AudioContext in this test environment (SoundEngine.play is
    // a documented no-op without one).
    expect(() => {
      const engine = new GameEngine({ initialPieces: ['T', 'T'] });
      engine.moveLeft();
    }).not.toThrow();
  });
});
