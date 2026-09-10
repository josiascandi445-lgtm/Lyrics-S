import { findActiveLineIndexAt, computeWordState } from '@/lib/lyrics/utils';
import { getEasing } from '@/lib/utils/easing';
import { clamp } from '@/lib/utils/time';
import type { Lyrics, LyricLine, RenderFrame, RenderedLineState, VisualSettings } from '@/types';

/**
 * LyricsRenderer — camada independente de UI.
 *
 * computeRenderFrame(t, lyrics, visualSettings) é uma função PURA e
 * DETERMINÍSTICA: para o mesmo `t` e os mesmos dados, produz sempre o mesmo
 * resultado. Isto é fundamental (secção 20/22) porque o mesmo código é usado:
 *   - no preview, chamado a cada requestAnimationFrame com o currentTime real
 *     do elemento <audio>;
 *   - no exportador, chamado uma vez por cada frame do vídeo final
 *     (t = frameIndex / fps), fora de tempo real, dentro de um Web Worker.
 *
 * Não deve depender de setTimeout/setInterval, de Date.now(), nem de estado
 * externo — apenas dos três argumentos recebidos.
 */
/**
 * Calcula o progresso (0-1) do preenchimento tipo karaoke de uma linha no
 * instante `t`. Usa os timings das palavras quando existem (mais preciso,
 * baseado no comprimento de texto já cantado); caso contrário usa o tempo
 * da própria linha como aproximação (funciona mesmo sem sincronização por
 * palavra, só menos preciso).
 */
function computeLineFillProgress(line: LyricLine, t: number): number {
  if (t <= line.startTime) return 0;
  if (t >= line.endTime) return 1;

  if (line.words.length > 0) {
    const totalChars = line.words.reduce((sum, w) => sum + w.text.length, 0) || 1;
    let sungChars = 0;
    for (const w of line.words) {
      if (t >= w.endTime) {
        sungChars += w.text.length;
      } else if (t > w.startTime) {
        const span = Math.max(w.endTime - w.startTime, 0.0001);
        sungChars += w.text.length * clamp((t - w.startTime) / span, 0, 1);
        break;
      } else {
        break;
      }
    }
    return clamp(sungChars / totalChars, 0, 1);
  }

  const span = Math.max(line.endTime - line.startTime, 0.0001);
  return clamp((t - line.startTime) / span, 0, 1);
}

export function computeRenderFrame(
  t: number,
  lyrics: Lyrics,
  visual: VisualSettings
): RenderFrame {
  const lines = lyrics.lines;
  const activeLineIndex = findActiveLineIndexAt(lines, t);

  if (activeLineIndex === -1 || lines.length === 0) {
    return { time: t, activeLineIndex, lines: [] };
  }

  const activeLine = lines[activeLineIndex]!;
  const easing = getEasing(visual.easing);

  // floatIndex: posição contínua da "câmara" de letras. Durante os primeiros
  // `transitionDurationMs` depois do início da linha ativa, desliza suavemente
  // do índice anterior para o novo. É puramente função de `t`, nunca de
  // relógio de parede — garante determinismo entre preview e exportação.
  const transitionDurationS = Math.max(visual.transitionDurationMs, 1) / 1000;
  const timeSinceLineStart = t - activeLine.startTime;
  const rawProgress = clamp(timeSinceLineStart / transitionDurationS, 0, 1);
  const easedProgress = easing(rawProgress);
  const floatIndex =
    activeLineIndex - 1 >= -1 ? activeLineIndex - 1 + easedProgress : activeLineIndex;

  const visibleRange = visual.visibleLinesEachSide;
  const start = Math.max(0, activeLineIndex - visibleRange - 1);
  const end = Math.min(lines.length - 1, activeLineIndex + visibleRange + 1);

  const renderedLines: RenderedLineState[] = [];
  for (let i = start; i <= end; i++) {
    const line = lines[i]!;
    const relativeIndex = i - floatIndex;
    const distance = Math.abs(relativeIndex);

    if (distance > visibleRange + 1.05) continue;

    const opacity = clamp(visual.activeOpacity - visual.inactiveOpacityStep * distance, 0, 1);
    const scale = clamp(
      visual.activeScale - visual.inactiveScaleStep * distance,
      0.05,
      visual.activeScale
    );
    const blurPx = clamp(
      (distance / Math.max(visibleRange, 1)) * visual.maxBlurPx,
      0,
      visual.maxBlurPx
    );
    const positionY = relativeIndex * visual.lineSpacingPx;

    const words = line.words.length > 0 ? line.words.map((w) => computeWordState(w, t)) : [];
    const fillProgress = computeLineFillProgress(line, t);

    renderedLines.push({
      line,
      relativeIndex,
      positionY,
      opacity,
      scale,
      blurPx,
      fillProgress,
      words,
    });
  }

  return { time: t, activeLineIndex, lines: renderedLines };
}
