import { useCallback, useMemo, useState } from 'react';
import { getSoundEngine, type SoundEffect } from './soundEngine';

export interface UseSoundResult {
  /** Plays one of the game's short sound effects. */
  play: (effect: SoundEffect) => void;
  /** Current master volume, 0-1. */
  volume: number;
  /** Updates master volume (clamped to 0-1). */
  setVolume: (value: number) => void;
  /** Whether all effects are currently muted. */
  muted: boolean;
  /** Mutes/unmutes all effects. */
  setMuted: (muted: boolean) => void;
}

/**
 * React hook exposing the shared Web Audio sound engine plus the current
 * volume/mute state, so components such as a settings panel can render
 * controls (a volume slider, a mute button) and stay in sync.
 */
export function useSound(): UseSoundResult {
  const engine = useMemo(() => getSoundEngine(), []);
  const [volume, setVolumeState] = useState(() => engine.getVolume());
  const [muted, setMutedState] = useState(() => engine.isMuted());

  const play = useCallback((effect: SoundEffect) => engine.play(effect), [engine]);

  const setVolume = useCallback(
    (value: number) => {
      engine.setVolume(value);
      setVolumeState(engine.getVolume());
    },
    [engine],
  );

  const setMuted = useCallback(
    (value: boolean) => {
      engine.setMuted(value);
      setMutedState(engine.isMuted());
    },
    [engine],
  );

  return { play, volume, setVolume, muted, setMuted };
}
