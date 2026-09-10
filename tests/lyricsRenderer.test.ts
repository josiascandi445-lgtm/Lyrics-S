import { describe, expect, it } from 'vitest';
import { computeRenderFrame } from '@/lib/render/lyricsRenderer';
import { createDefaultVisualSettings } from '@/lib/project/defaults';
import type { Lyrics } from '@/types';

const lyrics: Lyrics = {
  lines: [
    { id: 'a', text: 'A', startTime: 0, endTime: 3, words: [] },
    { id: 'b', text: 'B', startTime: 3, endTime: 6, words: [] },
    { id: 'c', text: 'C', startTime: 6, endTime: 9, words: [] },
  ],
};

describe('computeRenderFrame', () => {
  const visual = createDefaultVisualSettings();

  it('é determinístico: mesmo t produz sempre o mesmo resultado', () => {
    const frame1 = computeRenderFrame(4.2, lyrics, visual);
    const frame2 = computeRenderFrame(4.2, lyrics, visual);
    expect(frame1).toEqual(frame2);
  });

  it('devolve lista vazia antes da primeira linha começar', () => {
    const frame = computeRenderFrame(-1, lyrics, visual);
    expect(frame.activeLineIndex).toBe(-1);
    expect(frame.lines).toHaveLength(0);
  });

  it('a linha ativa tem relativeIndex ~0 depois da transição terminar', () => {
    const t = 3 + visual.transitionDurationMs / 1000 + 0.5; // bem depois da transição
    const frame = computeRenderFrame(t, lyrics, visual);
    const active = frame.lines.find((l) => l.line.id === 'b');
    expect(active).toBeDefined();
    expect(active!.relativeIndex).toBeCloseTo(0, 1);
    expect(active!.opacity).toBeCloseTo(visual.activeOpacity, 1);
  });

  it('linhas mais distantes têm menor opacidade e maior blur', () => {
    const t = 6.5; // linha 'c' ativa
    const frame = computeRenderFrame(t, lyrics, visual);
    const activeLine = frame.lines.find((l) => l.line.id === 'c')!;
    const prevLine = frame.lines.find((l) => l.line.id === 'b')!;
    expect(prevLine.opacity).toBeLessThan(activeLine.opacity);
    expect(prevLine.blurPx).toBeGreaterThanOrEqual(activeLine.blurPx);
  });

  it('fillProgress (karaokê) vai de 0 a 1 ao longo da linha ativa, sem palavras sincronizadas', () => {
    const start = computeRenderFrame(3.01, lyrics, visual).lines.find((l) => l.line.id === 'b')!;
    const middle = computeRenderFrame(4.5, lyrics, visual).lines.find((l) => l.line.id === 'b')!;
    const end = computeRenderFrame(5.99, lyrics, visual).lines.find((l) => l.line.id === 'b')!;
    expect(start.fillProgress).toBeLessThan(middle.fillProgress);
    expect(middle.fillProgress).toBeLessThan(end.fillProgress);
    expect(end.fillProgress).toBeLessThanOrEqual(1);
  });

  it('fillProgress usa os timings das palavras quando existem', () => {
    const lyricsWithWords: Lyrics = {
      lines: [
        {
          id: 'w',
          text: 'ab cd',
          startTime: 0,
          endTime: 2,
          words: [
            { id: 'w1', text: 'ab', startTime: 0, endTime: 1 },
            { id: 'w2', text: 'cd', startTime: 1, endTime: 2 },
          ],
        },
      ],
    };
    const midFirstWord = computeRenderFrame(0.5, lyricsWithWords, visual).lines[0]!;
    const startSecondWord = computeRenderFrame(1.0, lyricsWithWords, visual).lines[0]!;
    // "ab" e "cd" têm o mesmo nº de caracteres, por isso a meio da 1ª palavra
    // o progresso deve rondar 0.25 (metade de metade do texto total)
    expect(midFirstWord.fillProgress).toBeCloseTo(0.25, 1);
    expect(startSecondWord.fillProgress).toBeCloseTo(0.5, 1);
  });
});
