/**
 * Extrai 2 cores dominantes de uma imagem (capa) para o modo de background
 * "Auto" (secção 24). Implementação simples e rápida: reduz a imagem a uma
 * grelha pequena e agrupa pixels por "bucket" de matiz, evitando dependências
 * externas de quantização de cor.
 */
export function extractDominantColors(
  image: ImageBitmap | HTMLImageElement,
  sampleSize = 32
): { primary: string; secondary: string } {
  const canvas = document.createElement('canvas');
  canvas.width = sampleSize;
  canvas.height = sampleSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { primary: '#111114', secondary: '#2a2a31' };

  ctx.drawImage(image as CanvasImageSource, 0, 0, sampleSize, sampleSize);
  const { data } = ctx.getImageData(0, 0, sampleSize, sampleSize);

  const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const a = data[i + 3]!;
    if (a < 100) continue;
    // ignora quase-preto/quase-branco puro para evitar dominar com bordas neutras
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    if (luma < 12 || luma > 246) continue;
    const key = `${Math.round(r / 24)}-${Math.round(g / 24)}-${Math.round(b / 24)}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.count += 1;
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
    } else {
      buckets.set(key, { count: 1, r, g, b });
    }
  }

  const sorted = Array.from(buckets.values()).sort((a, b) => b.count - a.count);

  if (sorted.length === 0) return { primary: '#111114', secondary: '#2a2a31' };

  const toHex = (bucket: { count: number; r: number; g: number; b: number }) => {
    const r = Math.round(bucket.r / bucket.count);
    const g = Math.round(bucket.g / bucket.count);
    const b = Math.round(bucket.b / bucket.count);
    return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  };

  const primary = toHex(sorted[0]!);
  const secondary = sorted[1] ? toHex(sorted[1]) : darken(primary, 0.5);
  return { primary, secondary };
}

function darken(hex: string, factor: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * factor);
  const g = Math.round(((n >> 8) & 255) * factor);
  const b = Math.round((n & 255) * factor);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
