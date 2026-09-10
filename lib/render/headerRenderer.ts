import { roundRectPath, drawImageCover } from './canvasHelpers';
import type { HeaderSettings, Song } from '@/types';

type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/**
 * Desenha a capa + título + artista fixos no topo do vídeo, tal como no
 * vídeo de referência da Fase 2. É desenhado depois do efeito de letras
 * (por cima), para ficar sempre nítido mesmo quando há linhas com blur por
 * baixo dele.
 */
export function renderHeader(
  ctx: Ctx2D,
  width: number,
  song: Song,
  coverImage: ImageBitmap | HTMLImageElement | null,
  settings: HeaderSettings
): void {
  if (!settings.enabled) return;
  if (!song.title && !song.artist) return;

  const padding = width * 0.055;
  const artSize = width * 0.11;
  const artX = padding;
  const artY = padding;
  const artRadius = artSize * 0.24;

  ctx.save();

  // capa (com cantos arredondados)
  roundRectPath(ctx, artX, artY, artSize, artSize, artRadius);
  ctx.save();
  ctx.clip();
  if (coverImage) {
    drawImageCover(ctx, coverImage, artX, artY, artSize, artSize);
  } else {
    ctx.fillStyle = '#2a2a31';
    ctx.fillRect(artX, artY, artSize, artSize);
  }
  ctx.restore();

  // título + artista
  const textX = artX + artSize + width * 0.032;
  const maxTextWidth = width - textX - padding;
  const titleSize = Math.max(14, width * 0.036);
  const artistSize = Math.max(11, width * 0.028);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = titleSize * 0.25;

  if (song.title) {
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${titleSize.toFixed(1)}px "Inter", sans-serif`;
    drawEllipsized(ctx, song.title, textX, artY + artSize * 0.34, maxTextWidth);
  }
  if (song.artist) {
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = `600 ${artistSize.toFixed(1)}px "Inter", sans-serif`;
    drawEllipsized(ctx, song.artist, textX, artY + artSize * 0.72, maxTextWidth);
  }

  ctx.restore();
}

function drawEllipsized(ctx: Ctx2D, text: string, x: number, y: number, maxWidth: number): void {
  let displayText = text;
  if (ctx.measureText(displayText).width > maxWidth) {
    while (displayText.length > 1 && ctx.measureText(`${displayText}…`).width > maxWidth) {
      displayText = displayText.slice(0, -1);
    }
    displayText = `${displayText}…`;
  }
  ctx.fillText(displayText, x, y);
}
