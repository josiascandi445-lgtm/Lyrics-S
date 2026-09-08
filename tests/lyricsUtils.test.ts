import { describe, expect, it } from 'vitest';
import { findActiveLineIndexAt, computeWordState } from '@/lib/lyrics/utils';
import type { LyricLine } from '@/types';

function line(id: string, start: number, end: number): LyricLine {
  return { id, text: id, startTime: start, endTime: end, words: [] };
}

describe('findActiveLineIndexAt', () => {
  const lines = [line('a', 0, 3), line('b', 3, 6), line('c', 6, 9)];

  it('devolve -1 antes da primeira linha', () => {
    expect(findActiveLineIndexAt(lines, -1)).toBe(-1);
  });

  it('encontra a linha correta no meio do intervalo', () => {
    expect(findActiveLineIndexAt(lines, 4)).toBe(1);
  });

  it('a última linha cujo startTime <= t continua ativa mesmo depois do seu endTime (gap)', () => {
    const withGap = [line('a', 0, 2), line('b', 5, 7)];
    expect(findActiveLineIndexAt(withGap, 3)).toBe(0);
  });

  it('devolve a última linha quando t excede tudo', () => {
    expect(findActiveLineIndexAt(lines, 100)).toBe(2);
  });

  it('devolve -1 para lista vazia', () => {
    expect(findActiveLineIndexAt([], 5)).toBe(-1);
  });
});

describe('computeWordState', () => {
  const word = { id: 'w1', text: 'ola', startTime: 2, endTime: 4 };

  it('status 0 antes da palavra começar', () => {
    expect(computeWordState(word, 1).status).toBe(0);
  });

  it('status 1 e progresso 0.5 a meio da palavra', () => {
    const state = computeWordState(word, 3);
    expect(state.status).toBe(1);
    expect(state.progress).toBeCloseTo(0.5, 5);
  });

  it('status 2 depois da palavra terminar', () => {
    expect(computeWordState(word, 5).status).toBe(2);
  });
});
