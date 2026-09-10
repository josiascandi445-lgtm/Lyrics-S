import type { EffectRenderContext, LyricsEffect } from './types';

/**
 * Efeito principal (secções 15-21, e o efeito "Fase 2" da secção 44).
 *
 * Desenha o bloco de linhas centrado verticalmente em `anchorY`, cada linha
 * deslocada por `line.positionY`, com opacidade/escala/blur já calculados
 * pelo LyricsRenderer (lib/render/lyricsRenderer.ts) — este módulo só
 * desenha, não decide timing.
 *
 * A linha ativa usa um preenchimento progressivo esquerda→direita tipo
 * karaoke (`karaokeFillEnabled`): a parte já cantada aparece em
 * `sungColor` (sólida) e a parte ainda não cantada em `unsungColor`
 * (translúcida), com uma transição suave entre as duas — replicando o
 * efeito visto no vídeo de referência da Fase 2. É feito com um único
 * `fillText` usando um `CanvasGradient` horizontal como `fillStyle`, cuja
 * posição é `rendered.fillProgress` (calculado de forma determinística a
 * partir de `t`, ver lyricsRenderer.ts) — por isso funciona tanto no
 * preview como na exportação, sempre com o mesmo resultado.
 */
export const SpotifyInspiredLyrics: LyricsEffect = {
  id: 'spotify-inspired',
  name: 'Spotify Inspired',

  render({ ctx, frame, visual, width, anchorX, anchorY }: EffectRenderContext) {
    if (frame.lines.length === 0) return;

    ctx.save();
    const align = visual.textAlign === 'left' ? 'left' : visual.textAlign === 'right' ? 'right' : 'center';
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';

    const maxTextWidth = width * 0.86;

    for (const rendered of frame.lines) {
      const { line, positionY, opacity, scale, blurPx, fillProgress } = rendered;
      if (opacity <= 0.01) continue;

      const y = anchorY + positionY;
      const baseFontSize = visual.fontSizePx * scale;

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.filter = blurPx > 0.05 ? `blur(${blurPx.toFixed(2)}px)` : 'none';
      ctx.letterSpacing = `${visual.letterSpacing}px` as unknown as string;

      if (visual.textShadow) {
        ctx.shadowColor = 'rgba(0,0,0,0.55)';
        ctx.shadowBlur = baseFontSize * 0.12;
        ctx.shadowOffsetY = baseFontSize * 0.03;
      }

      const fontSize = fitFontSize(ctx, line.text, baseFontSize, visual.fontWeight, visual.fontFamily, maxTextWidth);
      ctx.font = `${visual.fontWeight} ${fontSize.toFixed(1)}px ${visual.fontFamily}`;
      const textWidth = ctx.measureText(line.text).width;

      const x = align === 'left' ? anchorX - maxTextWidth / 2 : align === 'right' ? anchorX + maxTextWidth / 2 : anchorX;
      const textLeft = align === 'left' ? x : align === 'right' ? x - textWidth : x - textWidth / 2;
      const textRight = textLeft + textWidth;

      const isActive = rendered.relativeIndex > -0.5 && rendered.relativeIndex < 0.5;

      if (isActive && visual.karaokeFillEnabled) {
        ctx.fillStyle = buildKaraokeGradient(
          ctx,
          textLeft,
          textRight,
          fillProgress,
          visual.sungColor,
          visual.unsungColor,
          visual.karaokeSoftnessFraction
        );
      } else {
        ctx.fillStyle = isActive ? visual.color : visual.inactiveColor;
      }

      ctx.fillText(line.text, x, y);
      ctx.restore();
    }

    ctx.restore();
  },
};

/** Reduz o tamanho de fonte até o texto caber em `maxWidth`; devolve o tamanho final. */
function fitFontSize(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  text: string,
  fontSize: number,
  fontWeight: number,
  fontFamily: string,
  maxWidth: number
): number {
  let size = fontSize;
  ctx.font = `${fontWeight} ${size.toFixed(1)}px ${fontFamily}`;
  let measured = ctx.measureText(text).width;
  const minSize = fontSize * 0.45;
  while (measured > maxWidth && size > minSize) {
    size -= 1;
    ctx.font = `${fontWeight} ${size.toFixed(1)}px ${fontFamily}`;
    measured = ctx.measureText(text).width;
  }
  return size;
}

function buildKaraokeGradient(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  left: number,
  right: number,
  progress: number,
  sungColor: string,
  unsungColor: string,
  softnessFraction: number
): CanvasGradient {
  const gradient = ctx.createLinearGradient(left, 0, Math.max(right, left + 1), 0);
  const p = clamp01(progress);
  const softness = clamp01(softnessFraction);
  const before = clamp01(p - softness);
  const after = clamp01(p + softness);

  gradient.addColorStop(0, sungColor);
  gradient.addColorStop(before, sungColor);
  gradient.addColorStop(after, unsungColor);
  gradient.addColorStop(1, unsungColor);
  return gradient;
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

export const effectRegistry: Record<string, LyricsEffect> = {
  [SpotifyInspiredLyrics.id]: SpotifyInspiredLyrics,
};

export function getEffect(id: string): LyricsEffect {
  return effectRegistry[id] ?? SpotifyInspiredLyrics;
}
