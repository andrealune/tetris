/**
 * Web Audio API based sound effects engine for the Tetris game.
 *
 * Every effect is synthesized in the browser with `OscillatorNode`s (sine /
 * square waves) so no audio files need to be bundled or fetched. Effects are
 * kept short - every effect's total duration (from the first tone's start to
 * the last tone's end) is within 100-300ms, enforced by
 * `getEffectDuration()` below and asserted in the test suite - and
 * everything is routed through a single master `GainNode` so volume can be
 * controlled (and later muted, see the mute-toggle follow-up ticket) without
 * touching individual sounds.
 *
 * The engine is framework agnostic (no React dependency) so it can be
 * dropped into any part of the game (reducer, event handlers, etc). A tiny
 * React hook wrapper is provided in `useSound.ts` for convenience.
 */

export type SoundEffect =
  | 'move'
  | 'rotate'
  | 'softDrop'
  | 'hardDrop'
  | 'lock'
  | 'lineClear'
  | 'levelUp'
  | 'gameOver';

type OscType = OscillatorType;

interface Tone {
  /** Frequency in Hz at the start of the tone. */
  frequency: number;
  /** Offset from the moment the effect is triggered, in seconds. */
  start: number;
  /** How long the tone rings for, in seconds. */
  duration: number;
  /** Oscillator waveform - 'sine' and 'square' give the classic arcade feel. */
  type: OscType;
  /** Peak gain for this tone, 0-1 (further scaled by master volume). */
  gain?: number;
  /** Optional pitch the oscillator glides to by the end of the tone. */
  glideTo?: number;
}

const DEFAULT_VOLUME = 0.5;
const MIN_RAMP_FREQUENCY = 1; // exponentialRamp can't target 0.

/** Required effect-duration bounds, in milliseconds, per the task spec. */
export const MIN_EFFECT_DURATION_MS = 100;
export const MAX_EFFECT_DURATION_MS = 300;

/**
 * Declarative "recipes" for each effect: a short list of oscillator notes
 * scheduled relative to when the effect is triggered. Keeping these as data
 * makes it easy to see/tune every sound's duration and character at a
 * glance. Every effect's total span (see `getEffectDuration`) is kept within
 * 100-300ms.
 */
const EFFECTS: Record<SoundEffect, Tone[]> = {
  // Quick, subtle tick when a piece is nudged left/right. 110ms total.
  move: [{ frequency: 220, start: 0, duration: 0.11, type: 'square', gain: 0.25 }],

  // Short upward blip for rotation. 120ms total.
  rotate: [{ frequency: 440, start: 0, duration: 0.12, type: 'square', gain: 0.3, glideTo: 660 }],

  // Soft, low click for each soft-drop step. 110ms total.
  softDrop: [{ frequency: 150, start: 0, duration: 0.11, type: 'square', gain: 0.22 }],

  // Punchy descending thump for hard drop (two layered tones). 150ms total.
  hardDrop: [
    { frequency: 300, start: 0, duration: 0.15, type: 'sine', gain: 0.5, glideTo: 80 },
    { frequency: 90, start: 0, duration: 0.12, type: 'square', gain: 0.25 },
  ],

  // Piece placement / lock - a short mid tone "thud". 120ms total.
  lock: [{ frequency: 200, start: 0, duration: 0.12, type: 'square', gain: 0.35, glideTo: 140 }],

  // Line clear - quick ascending arpeggio (C5-E5-G5-C6). 280ms total.
  lineClear: [
    { frequency: 523.25, start: 0, duration: 0.07, type: 'sine', gain: 0.4 },
    { frequency: 659.25, start: 0.06, duration: 0.07, type: 'sine', gain: 0.4 },
    { frequency: 783.99, start: 0.12, duration: 0.07, type: 'sine', gain: 0.45 },
    { frequency: 1046.5, start: 0.18, duration: 0.1, type: 'square', gain: 0.35 },
  ],

  // Level up - triumphant rising fanfare (G4-C5-E5-G5). 290ms total.
  levelUp: [
    { frequency: 392.0, start: 0, duration: 0.07, type: 'sine', gain: 0.4 },
    { frequency: 523.25, start: 0.065, duration: 0.07, type: 'sine', gain: 0.42 },
    { frequency: 659.25, start: 0.13, duration: 0.075, type: 'sine', gain: 0.45 },
    { frequency: 783.99, start: 0.195, duration: 0.095, type: 'square', gain: 0.4 },
  ],

  // Game over - descending, ominous square-wave sequence. 290ms total.
  gameOver: [
    { frequency: 392.0, start: 0, duration: 0.07, type: 'square', gain: 0.4 },
    { frequency: 329.63, start: 0.065, duration: 0.07, type: 'square', gain: 0.4 },
    { frequency: 261.63, start: 0.13, duration: 0.075, type: 'square', gain: 0.42 },
    { frequency: 196.0, start: 0.195, duration: 0.095, type: 'square', gain: 0.45 },
  ],
};

/**
 * Total duration of an effect, in seconds, measured from the start of its
 * first tone to the end of its last tone. Used to enforce (and test) the
 * 100-300ms requirement for every effect.
 */
export function getEffectDurationSeconds(effect: SoundEffect): number {
  const tones = EFFECTS[effect];
  return tones.reduce((max, tone) => Math.max(max, tone.start + tone.duration), 0);
}

/** Same as `getEffectDurationSeconds`, expressed in milliseconds. */
export function getEffectDurationMs(effect: SoundEffect): number {
  return getEffectDurationSeconds(effect) * 1000;
}

/**
 * Synthesizes short arcade-style sound effects with the Web Audio API and
 * exposes a single master-volume control.
 *
 * Usage:
 * ```ts
 * const sound = getSoundEngine();
 * sound.setVolume(0.7);
 * sound.play('lineClear');
 * ```
 */
export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volume: number = DEFAULT_VOLUME;
  private muted = false;

  /**
   * @param contextFactory Optional factory used to create the underlying
   * `AudioContext`. Overridable so tests can inject a fake implementation
   * without a real audio backend.
   */
  constructor(private readonly contextFactory?: () => AudioContext) {}

  /**
   * Lazily creates the `AudioContext` on first use (most browsers require a
   * user gesture, e.g. a keypress, before audio can start) and resumes it if
   * a previous interaction suspended it.
   */
  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined' && !this.contextFactory) {
      // Server-side render / no browser environment: no-op.
      return null;
    }

    if (!this.ctx) {
      if (this.contextFactory) {
        this.ctx = this.contextFactory();
      } else {
        const Ctor =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        this.ctx = Ctor ? new Ctor() : null;
      }

      if (this.ctx) {
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.muted ? 0 : this.volume;
        this.masterGain.connect(this.ctx.destination);
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }

    return this.ctx;
  }

  /** Sets master volume. Values are clamped to the 0 (silent) - 1 (full) range. */
  setVolume(value: number): void {
    this.volume = Math.min(1, Math.max(0, value));
    if (this.masterGain && !this.muted) {
      this.masterGain.gain.value = this.volume;
    }
  }

  /** Current master volume, 0-1. */
  getVolume(): number {
    return this.volume;
  }

  /** Mutes/unmutes without losing the configured volume level. */
  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : this.volume;
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  /**
   * Plays one of the predefined short sound effects. Silently does nothing
   * if Web Audio isn't available (SSR, unsupported browser) or the engine is
   * muted / volume is 0, so callers never need to guard calls themselves.
   */
  play(effect: SoundEffect): void {
    if (this.muted || this.volume <= 0) return;

    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const tones = EFFECTS[effect];
    if (!tones || tones.length === 0) return;

    const now = ctx.currentTime;
    for (const tone of tones) {
      this.scheduleTone(ctx, this.masterGain, tone, now);
    }
  }

  private scheduleTone(ctx: AudioContext, destination: GainNode, tone: Tone, now: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = tone.type;

    const startTime = now + tone.start;
    const endTime = startTime + tone.duration;

    osc.frequency.setValueAtTime(tone.frequency, startTime);
    if (tone.glideTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(MIN_RAMP_FREQUENCY, tone.glideTo),
        endTime,
      );
    }

    const peak = tone.gain ?? 0.4;
    // Fast attack, exponential decay - a simple percussive envelope that
    // avoids clicks at the start/end of each tone.
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(peak, startTime + Math.min(0.015, tone.duration / 4));
    gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(startTime);
    osc.stop(endTime + 0.02);

    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  /** Closes the underlying `AudioContext`. Useful for tests and hot-reload cleanup. */
  dispose(): void {
    if (this.ctx) {
      void this.ctx.close();
    }
    this.ctx = null;
    this.masterGain = null;
  }
}

let sharedEngine: SoundEngine | null = null;

/** Returns a shared, lazily-created `SoundEngine` instance for the whole app. */
export function getSoundEngine(): SoundEngine {
  if (!sharedEngine) {
    sharedEngine = new SoundEngine();
  }
  return sharedEngine;
}
