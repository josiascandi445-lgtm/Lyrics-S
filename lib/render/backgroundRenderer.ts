import type { BackgroundSettings } from '@/types';

export interface BackgroundRenderInput {
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  settings: BackgroundSettings;
  width: number;
  height: number;
  time: number;
  coverImage: ImageBitmap | HTMLImageElement | null;
  autoColors: { primary: string; secondary: string } | null;
}

/**
 * Desenha o background para o instante `time`. Puramente função dos
 * argumentos recebidos (nenhum setInterval/requestAnimationFrame aqui),
 * para se manter consistente entre preview e exportação (secção 20/25).
 */
export function renderBackground({
  ctx,
  settings,
  width,
  height,
  time,
  coverImage,
  autoColors,
}: BackgroundRenderInput): void {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  const motion = settings.motion;
  // zoom/pan muito subtis, baseados numa onda lenta — sem picos, sem "salto"
  const zoomWave = motion.enabled ? 1 + Math.sin(time * motion.zoomSpeed) * 0.02 : 1;
  const panX = motion.enabled ? Math.sin(time * motion.zoomSpeed * 0.7) * motion.panAmountPx : 0;
  const panY = motion.enabled ? Math.cos(time * motion.zoomSpeed * 0.6) * motion.panAmountPx * 0.6 : 0;

  if (settings.mode === 'solid') {
    ctx.fillStyle = settings.solidColor;
    ctx.fillRect(0, 0, width, height);
  } else if (settings.mode === 'gradient' || (settings.mode === 'auto' && !coverImage)) {
    drawGradient(
      ctx,
      width,
      height,
      settings.mode === 'auto' && autoColors ? autoColors.primary : settings.gradientFrom,
      settings.mode === 'auto' && autoColors ? autoColors.secondary : settings.gradientTo,
      settings.gradientAngleDeg
    );
  } else if ((settings.mode === 'cover' || settings.mode === 'auto') && coverImage) {
    drawCoverImage(ctx, coverImage, width, height, zoomWave, panX, panY, settings.blurPx);
    if (settings.mode === 'auto' && autoColors) {
      // leve wash de cor por cima da capa para coerência com o modo Auto
      ctx.save();
      ctx.globalAlpha = 0.25;
      drawGradient(ctx, width, height, autoColors.primary, autoColors.secondary, settings.gradientAngleDeg);
      ctx.restore();
    }
  } else {
    // fallback: sem capa disponível ainda
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(0, 0, width, height);
  }

  if (settings.overlayDarkness > 0) {
    ctx.fillStyle = `rgba(0,0,0,${settings.overlayDarkness})`;
    ctx.fillRect(0, 0, width, height);
  }

  if (settings.overlayGradient) {
    const g = ctx.createLinearGradient(0, height * 0.4, 0, height);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.65)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.restore();
}

function drawGradient(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  from: string,
  to: string,
  angleDeg: number
) {
  const rad = (angleDeg * Math.PI) / 180;
  const x1 = width / 2 - (Math.cos(rad) * width) / 2;
  const y1 = height / 2 - (Math.sin(rad) * height) / 2;
  const x2 = width / 2 + (Math.cos(rad) * width) / 2;
  const y2 = height / 2 + (Math.sin(rad) * height) / 2;
  const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
  gradient.addColorStop(0, from);
  gradient.addColorStop(1, to);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  image: ImageBitmap | HTMLImageElement,
  width: number,
  height: number,
  zoom: number,
  panX: number,
  panY: number,
  blurPx: number
) {
  const imgW = 'width' in image ? image.width : 0;
  const imgH = 'height' in image ? image.height : 0;
  if (!imgW || !imgH) return;

  const scale = Math.max(width / imgW, height / imgH) * 1.15 * zoom;
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const dx = (width - drawW) / 2 + panX;
  const dy = (height - drawH) / 2 + panY;

  ctx.save();
  ctx.filter = blurPx > 0.1 ? `blur(${blurPx}px)` : 'none';
  ctx.drawImage(image as CanvasImageSource, dx, dy, drawW, drawH);
  ctx.restore();
}
