import { describe, expect, it } from 'vitest';
import { validateLyrics } from '@/lib/lyrics/validation';
import type { LyricLine } from '@/types';

function line(partial: Partial<LyricLine> & { id: string }): LyricLine {
  return { text: 'texto', startTime: 0, endTime: 1, words: [], ...partial };
}

describe('validateLyrics', () => {
  it('não reporta problemas para linhas válidas e sequenciais', () => {
    const lines = [line({ id: 'a', startTime: 0, endTime: 2 }), line({ id: 'b', startTime: 2, endTime: 4 })];
    expect(validateLyrics(lines)).toHaveLength(0);
  });

  it('deteta tempo de início negativo', () => {
    const lines = [line({ id: 'a', startTime: -1, endTime: 2 })];
    const issues = validateLyrics(lines);
    expect(issues.some((i) => i.severity === 'error')).toBe(true);
  });

  it('deteta endTime <= startTime', () => {
    const lines = [line({ id: 'a', startTime: 5, endTime: 5 })];
    const issues = validateLyrics(lines);
    expect(issues.some((i) => i.message.includes('termina antes'))).toBe(true);
  });

  it('deteta sobreposição entre linhas consecutivas', () => {
    const lines = [line({ id: 'a', startTime: 0, endTime: 5 }), line({ id: 'b', startTime: 3, endTime: 8 })];
    const issues = validateLyrics(lines);
    expect(issues.some((i) => i.message.includes('sobrepõe'))).toBe(true);
  });

  it('deteta palavra fora do intervalo da linha', () => {
    const lines = [
      line({
        id: 'a',
        startTime: 0,
        endTime: 2,
        words: [{ id: 'w1', text: 'oi', startTime: 3, endTime: 4 }],
      }),
    ];
    const issues = validateLyrics(lines);
    expect(issues.some((i) => i.message.includes('fora do intervalo'))).toBe(true);
  });
});
