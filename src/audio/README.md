# Sound effects (`src/audio`)

Arcade-style sound effects for the Tetris game, synthesized entirely with the
Web Audio API (`OscillatorNode` + `GainNode`) — no audio files to ship or
load.

## Files

- `soundEngine.ts` — framework-agnostic `SoundEngine` class (and a shared
  `getSoundEngine()` singleton). Owns the `AudioContext`, a master
  `GainNode` for volume, and the per-effect oscillator "recipes". Also
  exports `getEffectDurationMs()` / `getEffectDurationSeconds()` and the
  `MIN_EFFECT_DURATION_MS` (100) / `MAX_EFFECT_DURATION_MS` (300) constants
  used to keep — and test — every effect's duration in spec.
- `useSound.ts` — a small React hook wrapper around the shared engine, for
  components that need to trigger sounds or render volume/mute controls.
- `__tests__/soundEngine.test.ts` — unit tests with a fake `AudioContext`
  (no real audio hardware needed), run with `npm test`. Includes an explicit
  `it.each` assertion that every effect's `getEffectDurationMs()` falls
  within `[MIN_EFFECT_DURATION_MS, MAX_EFFECT_DURATION_MS]` (100-300ms), plus
  a check that every scheduled oscillator is stopped no later than that
  duration (+ the small release tail).

## Effects

Duration below is each effect's *total* span — from the start of its first
tone to the end of its last tone — as returned by `getEffectDurationMs()`.
All 8 effects are within the required 100-300ms range.

| Effect      | Trigger                          | Waveform(s)    | Duration |
|-------------|-----------------------------------|----------------|----------|
| `move`      | piece nudged left/right           | square         | 110ms    |
| `rotate`    | piece rotated                     | square (glide) | 120ms    |
| `softDrop`  | soft-drop step                    | square         | 110ms    |
| `hardDrop`  | hard drop                         | sine + square  | 150ms    |
| `lock`      | piece placement / lock            | square (glide) | 120ms    |
| `lineClear` | one or more lines cleared         | sine + square  | 280ms    |
| `levelUp`   | level increases                   | sine + square  | 290ms    |
| `gameOver`  | game over                         | square         | 290ms    |

Every effect is defined declaratively in `EFFECTS` inside `soundEngine.ts` as
a list of short oscillator "tones" (frequency, start offset, duration,
waveform, gain, optional pitch glide), so durations/pitches are easy to see
and retune in one place — and `getEffectDurationMs()` computes the real,
tested total from that same data, so there's no way for the table above (or
the implementation) to silently drift outside 100-300ms without the test
suite catching it.

## Usage

```ts
import { getSoundEngine } from '@/audio/soundEngine'; // adjust path/alias as needed

const sound = getSoundEngine();
sound.setVolume(0.7); // 0 (silent) - 1 (full)
sound.play('lineClear');
```

Or from a React component:

```tsx
import { useSound } from '@/audio/useSound';

function Board() {
  const { play } = useSound();

  const onLock = () => play('lock');
  // ...
}
```

## Wired into real gameplay

This module is no longer just a standalone library: `src/game/gameEngine.ts`
calls `play(effect)` at the exact moment each of these events happens during
a real game (piece move, rotate, soft drop, hard drop, lock/placement, line
clear, level up, game over). See `src/game/README.md` for the game engine
and `src/game/__tests__/gameEngine.test.ts` for tests that assert the right
effect name is played for every one of those events end-to-end (moving,
rotating, dropping, clearing lines, leveling up, and losing).

## Notes for integrators

- **User gesture requirement**: browsers block audio until the user has
  interacted with the page. The engine creates/resumes its `AudioContext`
  lazily on the first `play()` call, so simply calling `play()` from a
  keydown/click handler (e.g. the first move/rotate) is enough — no extra
  "unlock audio" step is required.
- **Volume control**: `setVolume(value)` (0-1, clamped) scales a single
  master `GainNode`, so it affects all effects uniformly and immediately.
- **Muting** (`setMuted` / `isMuted`) is included at the engine level so the
  follow-up "mute toggle and audio controls" ticket can wire it up to a UI
  control without touching this module.
- **SSR-safe**: `play()` is a no-op when there's no `window`/`AudioContext`
  (e.g. during Next.js server rendering), so it's safe to call unconditionally.
