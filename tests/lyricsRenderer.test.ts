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
});
