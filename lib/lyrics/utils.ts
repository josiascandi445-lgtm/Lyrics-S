import type { LyricLine, LyricWord, RenderedWordState } from '@/types';

/**
 * Devolve o índice da linha "ativa" no instante `t`: a última linha cujo
 * startTime é <= t. Devolve -1 se `t` for anterior à primeira linha.
 * Assume `lines` ordenado por startTime (garantido pelos parsers e pelo editor).
 * Usa pesquisa binária — importante porque isto corre a cada frame
 * (requestAnimationFrame) e também por cada frame exportado.
 */
export function findActiveLineIndexAt(lines: LyricLine[], t: number): number {
  if (lines.length === 0) return -1;
  if (t < lines[0]!.startTime) return -1;

  let lo = 0;
  let hi = lines.length - 1;
  let result = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid]!.startTime <= t) {
      result = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return result;
}

export function computeWordState(word: LyricWord, t: number): RenderedWordState {
  let status: 0 | 1 | 2;
  let progress: number;
  if (t < word.startTime) {
    status = 0;
    progress = 0;
  } else if (t >= word.endTime) {
    status = 2;
    progress = 1;
  } else {
    status = 1;
    const span = Math.max(word.endTime - word.startTime, 0.0001);
    progress = (t - word.startTime) / span;
  }
  return { word, status, progress: clamp01(progress) };
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

/** Verifica se um array de linhas está ordenado por startTime (usado em testes e antes de exportar). */
export function isSortedByStartTime(lines: LyricLine[]): boolean {
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]!.startTime < lines[i - 1]!.startTime) return false;
  }
  return true;
}

export function sortLinesByStartTime(lines: LyricLine[]): LyricLine[] {
  return [...lines].sort((a, b) => a.startTime - b.startTime);
}
