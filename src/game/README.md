# Headless game core (`src/game`)

A framework-agnostic Tetris game engine: board grid, all 7 tetrominoes,
movement/rotation/gravity, line clearing, scoring/leveling and game-over
detection — with no rendering or input-binding of its own. This is the
integration point that calls the sound effects built in `src/audio` at real
game events, closing the gap flagged in review ("a sound engine nothing
calls does not satisfy 'create sound effects'").

## Files

- `tetrominoes.ts` — the 7 piece types and their 4 rotation states as cell
  offsets in a bounding box, plus `randomPieceType()`.
- `board.ts` — the 10x20 grid (`BOARD_WIDTH`/`BOARD_HEIGHT`), `ActivePiece`,
  collision checking (`isValidPosition`) and locking (`mergePiece`).
- `lines.ts` — `findFullLines()` / `clearLines()`.
- `gameEngine.ts` — `GameEngine`, the class that ties it all together and
  triggers sound effects. Its public API (`moveLeft`, `moveRight`, `rotate`,
  `softDrop`, `hardDrop`, `tick`) is what a future keyboard/touch input layer
  and render loop will call; `GameEngine` itself has no DOM/React dependency.

## Sound wiring

Every event named in the sound-effects task fires from a specific place in
`GameEngine`:

| Event                    | Where                                             | Effect       |
|---------------------------|----------------------------------------------------|--------------|
| Piece nudged left/right  | `moveLeft()` / `moveRight()` on a successful move  | `move`       |
| Rotation                 | `rotate()` on a successful rotation                | `rotate`     |
| Soft drop                | `softDrop()` when the piece actually moves down    | `softDrop`   |
| Hard drop                | `hardDrop()`, before locking                       | `hardDrop`   |
| Piece placement (lock)   | the private `lock()` step, right after merging     | `lock`       |
| Line clear                | `lock()`, when `findFullLines()` finds any          | `lineClear`  |
| Level up                  | `lock()`, when clearing crosses a 10-line threshold | `levelUp`    |
| Game over                 | `lock()`, when the next piece can't spawn          | `gameOver`   |

`GameEngine` takes an optional `play` callback (`(effect: SoundEffect) =>
void`); by default it calls the shared `getSoundEngine().play(effect)` from
`src/audio`, so wiring a real UI on top of this only means constructing
`new GameEngine()` (or `createGameEngine()`) with no extra setup, and audio
"just works" the same way it's tested here. Tests inject a spy in place of
`play` so the exact effect name can be asserted per event without needing a
real `AudioContext`.

## Usage

```ts
import { createGameEngine } from '@/game/gameEngine';

const game = createGameEngine();

// wired to input:
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') game.moveLeft();
  if (e.key === 'ArrowRight') game.moveRight();
  if (e.key === 'ArrowUp') game.rotate();
  if (e.key === 'ArrowDown') game.softDrop();
  if (e.key === ' ') game.hardDrop();
});

// wired to a gravity timer:
setInterval(() => game.tick(), 800);
```

`game.board`, `game.current`, `game.next`, `game.score`, `game.level`,
`game.linesCleared` and `game.isGameOver` are plain public fields a renderer
can read every frame — this module intentionally does no drawing so a
canvas/DOM/React renderer, keyboard/touch controls, next-piece preview, and
high-score persistence (all separate concerns per the project brief) can be
built independently on top of it.

## Tests

- `__tests__/board.test.ts` — empty board shape, piece-cell math, bounds and
  overlap collision checks, immutable merge.
- `__tests__/lines.test.ts` — full-row detection, single/multi-row clearing,
  row-shifting correctness, board height invariant.
- `__tests__/gameEngine.test.ts` — the sound-wiring proof: constructs a
  `GameEngine` with a spy `play` function and asserts the exact effect name
  fired for `move`, blocked moves (no sound), `rotate`, `softDrop`,
  `hardDrop` → `lock` ordering, `lock` via natural soft-drop settling,
  `lineClear` (by engineering a near-full row and dropping a piece into the
  gap), `levelUp` (crossing a 10-line threshold), *not* firing `levelUp`
  when the threshold isn't crossed, `gameOver` (by blocking the spawn area),
  silence after game over, and that the default (no `play` override)
  constructor path doesn't throw.
