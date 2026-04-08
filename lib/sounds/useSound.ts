"use client";

import { useCallback, useSyncExternalStore } from "react";
import { soundManager } from "./SoundManager";

/**
 * Tiny external-store bridge so React re-renders when mute/volume changes.
 * The snapshot must be cached (same reference) unless values actually changed.
 */
let listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notify() {
  listeners.forEach((cb) => cb());
}

// Cached snapshot — only create a new object when values change
let cachedSnapshot = { muted: false, volume: 0.6 };

function getSnapshot() {
  const muted = soundManager.muted;
  const volume = soundManager.volume;
  if (cachedSnapshot.muted !== muted || cachedSnapshot.volume !== volume) {
    cachedSnapshot = { muted, volume };
  }
  return cachedSnapshot;
}

const SERVER_SNAPSHOT = { muted: false, volume: 0.6 };
function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

export function useSound() {
  const { muted, volume } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const play = useCallback(
    (sound: Parameters<typeof soundManager.play>[0]) => {
      soundManager.play(sound);
    },
    []
  );

  const toggleMute = useCallback(() => {
    soundManager.toggleMute();
    notify();
  }, []);

  const setVolume = useCallback((vol: number) => {
    soundManager.setVolume(vol);
    notify();
  }, []);

  const init = useCallback(() => {
    soundManager.init();
  }, []);

  return { play, muted, volume, toggleMute, setVolume, init };
}
