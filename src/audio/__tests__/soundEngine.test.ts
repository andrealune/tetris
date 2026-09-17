import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SoundEngine, type SoundEffect } from '../soundEngine';

class FakeParam {
  value = 0;
  setValueAtTime = vi.fn((v: number) => {
    this.value = v;
    return this;
  });
  linearRampToValueAtTime = vi.fn((v: number) => {
    this.value = v;
    return this;
  });
  exponentialRampToValueAtTime = vi.fn((v: number) => {
    this.value = v;
    return this;
  });
}

class FakeOscillator {
  type: OscillatorType = 'sine';
  frequency = new FakeParam();
  onended: (() => void) | null = null;
  connect = vi.fn();
  disconnect = vi.fn();
  start = vi.fn();
  stop = vi.fn(() => {
    this.onended?.();
  });
}

class FakeGainNode {
  gain = new FakeParam();
  connect = vi.fn();
  disconnect = vi.fn();
}

class FakeAudioContext {
  state: 'running' | 'suspended' | 'closed' = 'running';
  currentTime = 0;
  destination = {};
  createOscillator = vi.fn(() => new FakeOscillator());
  createGain = vi.fn(() => new FakeGainNode());
  resume = vi.fn(async () => {
    this.state = 'running';
  });
  close = vi.fn(async () => {
    this.state = 'closed';
  });
}

const ALL_EFFECTS: SoundEffect[] = [
  'move',
  'rotate',
  'softDrop',
  'hardDrop',
  'lock',
  'lineClear',
  'levelUp',
  'gameOver',
];

describe('SoundEngine', () => {
  let ctx: FakeAudioContext;
  let engine: SoundEngine;

  beforeEach(() => {
    ctx = new FakeAudioContext();
    engine = new SoundEngine(() => ctx as unknown as AudioContext);
  });

  it('lazily creates a master gain node connected to the destination', () => {
    expect(ctx.createGain).not.toHaveBeenCalled();
    engine.play('move');
    expect(ctx.createGain).toHaveBeenCalled();
  });

  it.each(ALL_EFFECTS)('plays the "%s" effect by scheduling at least one oscillator', (effect) => {
    engine.play(effect);
    expect(ctx.createOscillator.mock.calls.length).toBeGreaterThan(0);
  });

  it('schedules one oscillator per tone for a multi-tone effect', () => {
    engine.play('lineClear');
    expect(ctx.createOscillator).toHaveBeenCalledTimes(4);
  });

  it('starts and stops each oscillator so effects are short-lived', () => {
    engine.play('rotate');
    const osc = ctx.createOscillator.mock.results[0]!.value as FakeOscillator;
    expect(osc.start).toHaveBeenCalledTimes(1);
    expect(osc.stop).toHaveBeenCalledTimes(1);
  });

  it('uses sine and/or square oscillators for an arcade feel', () => {
    engine.play('hardDrop');
    const types = ctx.createOscillator.mock.results.map(
      (r) => (r.value as FakeOscillator).type,
    );
    for (const type of types) {
      expect(['sine', 'square']).toContain(type);
    }
  });

  it('defaults to a non-zero volume', () => {
    expect(engine.getVolume()).toBeGreaterThan(0);
    expect(engine.getVolume()).toBeLessThanOrEqual(1);
  });

  it('clamps volume to the 0-1 range', () => {
    engine.setVolume(2);
    expect(engine.getVolume()).toBe(1);

    engine.setVolume(-1);
    expect(engine.getVolume()).toBe(0);

    engine.setVolume(0.42);
    expect(engine.getVolume()).toBeCloseTo(0.42);
  });

  it('applies volume changes to the master gain node', () => {
    engine.play('lock'); // forces context/gain creation
    engine.setVolume(0.3);
    expect(ctx.createGain.mock.results[0]!.value.gain.value).toBeCloseTo(0.3);
  });

  it('does not schedule any sound when muted', () => {
    engine.setMuted(true);
    engine.play('rotate');
    expect(ctx.createOscillator).not.toHaveBeenCalled();
    expect(engine.isMuted()).toBe(true);
  });

  it('does not schedule any sound when volume is 0', () => {
    engine.setVolume(0);
    engine.play('hardDrop');
    expect(ctx.createOscillator).not.toHaveBeenCalled();
  });

  it('restores the configured volume after unmuting', () => {
    engine.play('move'); // create the gain node
    engine.setVolume(0.6);
    engine.setMuted(true);
    engine.setMuted(false);
    expect(ctx.createGain.mock.results[0]!.value.gain.value).toBeCloseTo(0.6);
  });

  it('reuses a single AudioContext across multiple play() calls', () => {
    const factory = vi.fn(() => ctx as unknown as AudioContext);
    const localEngine = new SoundEngine(factory);
    localEngine.play('move');
    localEngine.play('rotate');
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('is a no-op when no AudioContext can be created (e.g. SSR)', () => {
    const ssrEngine = new SoundEngine(() => null as unknown as AudioContext);
    expect(() => ssrEngine.play('gameOver')).not.toThrow();
  });

  it('closes the underlying context on dispose', () => {
    engine.play('move');
    engine.dispose();
    expect(ctx.close).toHaveBeenCalled();
  });
});
