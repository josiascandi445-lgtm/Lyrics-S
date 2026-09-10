import { computeRenderFrame } from './lyricsRenderer';
import { renderBackground } from './backgroundRenderer';
import { renderHeader } from './headerRenderer';
import { getEffect } from '@/lib/effects/spotifyInspired';
import type { Project } from '@/types';

export interface CompositorAssets {
  coverImage: ImageBitmap | HTMLImageElement | null;
  autoColors: { primary: string; secondary: string } | null;
}

/**
 * Renderiza um frame completo (background + letras) para `time` segundos,
 * na `ctx` fornecida, respeitando as dimensões de exportação do projeto.
 *
 * Esta função é chamada:
 *   - pelo <PreviewCanvas> a cada requestAnimationFrame, com
 *     time = audioElement.currentTime;
 *   - pelo Web Worker de exportação, com time = frameIndex / fps, para cada
 *     frame do vídeo final.
 *
 * Garantir que ambos os caminhos produzem exatamente o mesmo resultado
 * visual é o requisito da secção 22 da spec.
 */
export function renderProjectFrame(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  project: Project,
  assets: CompositorAssets,
  time: number,
  width: number,
  height: number
): void {
  renderBackground({
    ctx,
    settings: project.background,
    width,
    height,
    time,
    coverImage: assets.coverImage,
    autoColors: assets.autoColors,
  });

  const frame = computeRenderFrame(time, project.lyrics, project.visual);
  const effect = getEffect(project.effect.activeEffectId);

  effect.render({
    ctx,
    frame,
    visual: project.visual,
    width,
    height,
    anchorX: width / 2,
    anchorY: height * 0.5,
  });

  // Cabeçalho (capa + título + artista) desenhado por cima de tudo, sempre
  // nítido — secção 8 da spec ("esses dados aparecem no vídeo") e o efeito
  // de referência da Fase 2.
  renderHeader(ctx, width, project.song, assets.coverImage, project.header);
}
