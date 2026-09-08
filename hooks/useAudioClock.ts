import { useEffect, useRef, useSyncExternalStore } from 'react';
import { audioClock } from '@/lib/audio/audioClock';

/**
 * Devolve { time, isPlaying } atualizado a cada frame (via requestAnimationFrame
 * dentro de AudioClock). Usar apenas em componentes que realmente precisam de
 * re-renderizar a cada frame (Preview, Timeline) — outros componentes devem
 * ler `audioClock.currentTime` sob demanda (ex: ao clicar em "marcar início").
 */
export function useAudioClockState() {
  const timeRef = useRef(0);
  const playingRef = useRef(false);

  const subscribe = (callback: () => void) => {
    return audioClock.subscribe((time, isPlaying) => {
      timeRef.current = time;
      playingRef.current = isPlaying;
      callback();
    });
  };

  const time = useSyncExternalStore(
    subscribe,
    () => timeRef.current,
    () => 0
  );
  const isPlaying = useSyncExternalStore(
    subscribe,
    () => playingRef.current,
    () => false
  );

  return { time, isPlaying };
}

/** Liga o elemento <audio> ao AudioClock global assim que estiver montado. */
export function useAttachAudioElement(ref: React.RefObject<HTMLAudioElement>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    audioClock.attach(el);
    return () => audioClock.detach();
  }, [ref]);
}
