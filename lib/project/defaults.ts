import { createId } from '@/lib/utils/id';
import type {
  BackgroundSettings,
  ExportSettings,
  LyricsEffectSettings,
  Project,
  VideoSettings,
  VisualSettings,
} from '@/types';

export const FONT_PRESETS: Record<VisualSettings['preset'], Partial<VisualSettings>> = {
  modern: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 700,
    letterSpacing: 0,
  },
  minimal: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 400,
    letterSpacing: 0.5,
  },
  bold: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 900,
    letterSpacing: -0.5,
  },
  spotify: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 800,
    letterSpacing: -1,
  },
  clean: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 500,
    letterSpacing: 0,
  },
  custom: {},
};

export function createDefaultVisualSettings(): VisualSettings {
  return {
    preset: 'spotify',
    fontFamily: '"Inter", sans-serif',
    fontWeight: 800,
    fontSizePx: 64,
    lineHeight: 1.2,
    letterSpacing: -1,
    textAlign: 'center',
    color: '#ffffff',
    inactiveColor: 'rgba(255,255,255,0.45)',
    textShadow: true,

    visibleLinesEachSide: 2,
    activeScale: 1,
    inactiveScaleStep: 0.14,
    activeOpacity: 1,
    inactiveOpacityStep: 0.28,
    maxBlurPx: 6,
    lineSpacingPx: 92,
    transitionDurationMs: 420,
    easing: 'easeOutCubic',

    wordHighlightEnabled: true,
    wordHighlightColor: '#1ed760',
    wordHighlightScale: 1.08,
  };
}

export function createDefaultBackgroundSettings(): BackgroundSettings {
  return {
    mode: 'cover',
    solidColor: '#0a0a0c',
    gradientFrom: '#1d1d22',
    gradientTo: '#0a0a0c',
    gradientAngleDeg: 135,
    overlayDarkness: 0.45,
    overlayGradient: true,
    blurPx: 40,
    motion: {
      enabled: true,
      zoomSpeed: 0.05,
      panAmountPx: 14,
    },
  };
}

export function createDefaultVideoSettings(): VideoSettings {
  return { aspectRatio: 'vertical', fps: 30 };
}

export function createDefaultExportSettings(): ExportSettings {
  return { videoBitrateKbps: 6000, audioBitrateKbps: 192 };
}

export function createDefaultEffectSettings(): LyricsEffectSettings {
  return { activeEffectId: 'spotify-inspired' };
}

export function createDefaultProject(name = 'Novo Projeto'): Project {
  const now = new Date().toISOString();
  return {
    formatVersion: 1,
    id: createId('project'),
    name,
    createdAt: now,
    updatedAt: now,
    song: {
      fileName: null,
      mimeType: null,
      fileSize: null,
      duration: null,
      objectUrl: null,
      title: '',
      artist: '',
      album: '',
    },
    cover: {
      fileName: null,
      mimeType: null,
      objectUrl: null,
      zoom: 1,
      position: { x: 0.5, y: 0.5 },
      blur: 0,
      brightness: 1,
    },
    lyrics: { lines: [] },
    visual: createDefaultVisualSettings(),
    background: createDefaultBackgroundSettings(),
    video: createDefaultVideoSettings(),
    export: createDefaultExportSettings(),
    effect: createDefaultEffectSettings(),
  };
}
