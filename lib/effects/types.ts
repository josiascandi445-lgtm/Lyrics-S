import type { RenderFrame, VisualSettings } from '@/types';

export interface EffectRenderContext {
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  frame: RenderFrame;
  visual: VisualSettings;
  width: number;
  height: number;
  /** centro horizontal onde o bloco de letras é ancorado (px) */
  anchorX: number;
  /** centro vertical onde a linha ativa fica ancorada (px) */
  anchorY: number;
}

/**
 * Arquitetura extensível de efeitos (secção 23). A Fase 1 implementa apenas
 * `SpotifyInspiredLyrics`. Efeitos futuros (GradientTextEffect,
 * SolidTextEffect, TextureTextEffect, BlurEffect, OverlayEffect, MaskEffect)
 * implementam a mesma interface e podem ser adicionados ao registry sem
 * alterar o LyricsRenderer nem o pipeline de exportação.
 */
export interface LyricsEffect {
  id: string;
  name: string;
  render(context: EffectRenderContext): void;
}
