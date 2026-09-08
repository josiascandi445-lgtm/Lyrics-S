import type { EffectRenderContext, LyricsEffect } from './types';

/**
 * Efeito principal da Fase 1 (secções 15-21).
 *
 * Desenha o bloco de linhas centrado verticalmente em `anchorY`, cada linha
 * deslocada por `line.positionY`, com opacidade/escala/blur já calculados
 * pelo LyricsRenderer (lib/render/lyricsRenderer.ts) — este módulo só
 * desenha, não decide timing.
 *
 * Suporta destaque palavra-a-palavra opcional (Word Highlight).
 */
export const SpotifyInspiredLyrics: LyricsEffect = {
  id: 'spotify-inspired',
  name: 'Spotify Inspired',

  render({ ctx, frame, visual, width, anchorX, anchorY }: EffectRenderContext) {
    if (frame.lines.length === 0) return;

    ctx.save();
    ctx.textAlign = visual.textAlign === 'left' ? 'left' : visual.textAlign === 'right' ? 'right' : 'center';
    ctx.textBaseline = 'middle';

    const maxTextWidth = width * 0.86;

    for (const rendered of frame.lines) {
      const { line, positionY, opacity, scale, blurPx, words } = rendered;
      if (opacity <= 0.01) continue;

      const y = anchorY + positionY;
      const fontSize = visual.fontSizePx * scale;

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.filter = blurPx > 0.05 ? `blur(${blurPx.toFixed(2)}px)` : 'none';
      ctx.font = `${visual.fontWeight} ${fontSize.toFixed(1)}px ${visual.fontFamily}`;

      if (visual.textShadow) {
        ctx.shadowColor = 'rgba(0,0,0,0.55)';
        ctx.shadowBlur = fontSize * 0.12;
        ctx.shadowOffsetY = fontSize * 0.03;
      }

      const isActive = rendered.relativeIndex > -0.5 && rendered.relativeIndex < 0.5;
      const baseColor = isActive ? visual.color : visual.inactiveColor;

      if (visual.wordHighlightEnabled && words.length > 0 && isActive) {
        drawWordsWithHighlight(ctx, words, anchorX, y, fontSize, visual, baseColor, maxTextWidth);
      } else {
        ctx.fillStyle = baseColor;
        ctx.letterSpacing = `${visual.letterSpacing}px` as unknown as string;
        const x =
          visual.textAlign === 'left'
            ? anchorX - maxTextWidth / 2
            : visual.textAlign === 'right'
            ? anchorX + maxTextWidth / 2
            : anchorX;
        drawFittedText(ctx, line.text, x, y, maxTextWidth, fontSize, visual.fontWeight, visual.fontFamily);
      }

      ctx.restore();
    }

    ctx.restore();
  },
};

/** Desenha texto, reduzindo o tamanho de fonte se ultrapassar `maxWidth`. */
function drawFittedText(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  fontWeight: number,
  fontFamily: string
) {
  let size = fontSize;
  ctx.font = `${fontWeight} ${size.toFixed(1)}px ${fontFamily}`;
  let measured = ctx.measureText(text).width;
  const minSize = fontSize * 0.45;
  while (measured > maxWidth && size > minSize) {
    size -= 1;
    ctx.font = `${fontWeight} ${size.toFixed(1)}px ${fontFamily}`;
    measured = ctx.measureText(text).width;
  }
  ctx.fillText(text, x, y);
}

function drawWordsWithHighlight(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  words: EffectRenderContext['frame']['lines'][number]['words'],
  centerX: number,
  y: number,
  fontSize: number,
  visual: EffectRenderContext['visual'],
  baseColor: string,
  maxWidth: number
) {
  ctx.font = `${visual.fontWeight} ${fontSize.toFixed(1)}px ${visual.fontFamily}`;
  const gap = fontSize * 0.22;
  const widths = words.map((w) => ctx.measureText(w.word.text).width);
  const totalWidth = widths.reduce((a, b) => a + b, 0) + gap * Math.max(words.length - 1, 0);

  let scaleDown = 1;
  if (totalWidth > maxWidth) scaleDown = maxWidth / totalWidth;

  let cursor = centerX - (totalWidth * scaleDown) / 2;

  words.forEach((w, i) => {
    const wWidth = widths[i]! * scaleDown;
    const isSinging = w.status === 1;
    const wordScale = isSinging ? 1 + (visual.wordHighlightScale - 1) * Math.sin(Math.PI * w.progress) : 1;
    const color = w.status === 0 ? baseColor : w.status === 1 ? visual.wordHighlightColor : baseColor;

    ctx.save();
    ctx.globalAlpha *= w.status === 0 ? 0.55 : 1;
    ctx.fillStyle = color;
    ctx.translate(cursor + wWidth / 2, y);
    ctx.scale(wordScale, wordScale);
    ctx.textAlign = 'center';
    ctx.fillText(w.word.text, 0, 0);
    ctx.restore();

    cursor += wWidth + gap * scaleDown;
  });
}

export const effectRegistry: Record<string, LyricsEffect> = {
  [SpotifyInspiredLyrics.id]: SpotifyInspiredLyrics,
};

export function getEffect(id: string): LyricsEffect {
  return effectRegistry[id] ?? SpotifyInspiredLyrics;
}
