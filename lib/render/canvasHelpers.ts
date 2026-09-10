type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export function roundRectPath(ctx: Ctx2D, x: number, y: number, w: number, h: number, radius: number): void {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Desenha uma imagem dentro de um retângulo com comportamento "object-fit: cover" (crop central). */
export function drawImageCover(
  ctx: Ctx2D,
  image: ImageBitmap | HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  const imgW = image.width;
  const imgH = image.height;
  if (!imgW || !imgH) return;

  const scale = Math.max(w / imgW, h / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const dx = x + (w - drawW) / 2;
  const dy = y + (h - drawH) / 2;
  ctx.drawImage(image as CanvasImageSource, dx, dy, drawW, drawH);
}
