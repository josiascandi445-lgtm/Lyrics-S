/** Formata segundos como mm:ss.cc (centésimos) — usado no editor de sync/timeline. */
export function formatTime(totalSeconds: number, opts: { centis?: boolean } = {}): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) totalSeconds = 0;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const centis = Math.floor((totalSeconds - Math.floor(totalSeconds)) * 100);
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  if (opts.centis === false) return `${mm}:${ss}`;
  const cc = String(centis).padStart(2, '0');
  return `${mm}:${ss}.${cc}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Interpolação linear */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
