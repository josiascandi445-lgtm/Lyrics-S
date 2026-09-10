// ============================================================================
// Lyrics Studio — Core Data Model
// Todos os tempos são armazenados em segundos (number, precisão de vírgula
// flutuante), o suficiente para sincronização a nível de frame em 60 FPS
// (1 frame a 60fps = 0.01666s).
// ============================================================================

export type ID = string;

// ---------------------------------------------------------------------------
// Letras
// ---------------------------------------------------------------------------

export interface LyricWord {
  id: ID;
  text: string;
  /** segundos, tempo absoluto na música */
  startTime: number;
  /** segundos, tempo absoluto na música */
  endTime: number;
}

export interface LyricLine {
  id: ID;
  text: string;
  /** segundos, tempo absoluto na música */
  startTime: number;
  /** segundos, tempo absoluto na música */
  endTime: number;
  /**
   * Palavras sincronizadas individualmente. Pode ser vazio — nesse caso a
   * linha inteira usa apenas o timing de LyricLine (ver lib/lyrics/utils.ts).
   */
  words: LyricWord[];
}

export interface Lyrics {
  lines: LyricLine[];
}

// ---------------------------------------------------------------------------
// Música
// ---------------------------------------------------------------------------

export interface Song {
  /** nome de ficheiro original */
  fileName: string | null;
  /** mime type detectado, ex: audio/mpeg, audio/mp4 */
  mimeType: string | null;
  /** tamanho em bytes */
  fileSize: number | null;
  /** duração em segundos, obtida do elemento <audio> depois de "loadedmetadata" */
  duration: number | null;
  /** Object URL usado durante a sessão de edição (não persiste entre reloads) */
  objectUrl: string | null;
  /**
   * Bytes do ficheiro original em base64, guardados apenas quando o utilizador
   * exporta o projeto com "incluir media". Não fica em memória durante a
   * edição normal (fica só o objectUrl) para poupar RAM.
   */
  title: string;
  artist: string;
  album?: string;
}

export interface CoverImage {
  fileName: string | null;
  mimeType: string | null;
  objectUrl: string | null;
  /** 0-1, aplicado como transform no editor de crop */
  zoom: number;
  /** posição relativa do crop, 0-1 em x/y */
  position: { x: number; y: number };
  blur: number; // px
  brightness: number; // 0-2, 1 = normal
}

// ---------------------------------------------------------------------------
// Visual (tipografia / linha ativa)
// ---------------------------------------------------------------------------

export type FontPreset = 'modern' | 'minimal' | 'bold' | 'spotify' | 'clean' | 'custom';

export interface VisualSettings {
  preset: FontPreset;
  fontFamily: string;
  fontWeight: number; // 100-900
  fontSizePx: number; // tamanho da linha ativa, em px, à resolução de exportação
  lineHeight: number; // multiplicador
  letterSpacing: number; // px
  textAlign: 'left' | 'center' | 'right';
  color: string; // cor da linha ativa
  inactiveColor: string; // cor das linhas inativas
  textShadow: boolean;

  // Efeito de "cascata" de linhas (secção 15-19 da spec)
  visibleLinesEachSide: number; // quantas linhas próximas mostrar de cada lado
  activeScale: number; // ex 1.0
  inactiveScaleStep: number; // redução de escala por linha de distância
  activeOpacity: number; // 0-1
  inactiveOpacityStep: number; // redução de opacidade por linha de distância
  maxBlurPx: number; // blur máximo nas linhas mais distantes
  lineSpacingPx: number; // espaço vertical entre linhas, à resolução de exportação
  transitionDurationMs: number;
  easing: 'easeOutCubic' | 'easeInOutCubic' | 'easeOutQuint' | 'linear';

  // Preenchimento progressivo tipo karaoke na linha ativa (secção 44 / Fase 2:
  // "aparência parcialmente opaca/sólida do texto interagindo com o fundo").
  // A parte já cantada aparece em `sungColor` (sólida), a parte ainda não
  // cantada em `unsungColor` (translúcida), com uma transição suave entre
  // as duas que acompanha o tempo real da música.
  karaokeFillEnabled: boolean;
  sungColor: string;
  unsungColor: string;
  /** largura da transição suave entre cantado/não-cantado, em fração da linha (0-0.3) */
  karaokeSoftnessFraction: number;
}

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------

export type BackgroundMode = 'cover' | 'solid' | 'gradient' | 'auto';

export interface BackgroundSettings {
  mode: BackgroundMode;
  solidColor: string;
  gradientFrom: string;
  gradientTo: string;
  gradientAngleDeg: number;
  overlayDarkness: number; // 0-1
  overlayGradient: boolean;
  blurPx: number;
  /** movimento subtil (secção 25) */
  motion: {
    enabled: boolean;
    zoomSpeed: number; // fração de zoom por segundo, valor pequeno ex 0.003
    panAmountPx: number; // deslocamento máximo em px
  };
}

// ---------------------------------------------------------------------------
// Cabeçalho (capa + título + artista, fixo no topo do vídeo)
// ---------------------------------------------------------------------------

export interface HeaderSettings {
  enabled: boolean;
}

// ---------------------------------------------------------------------------
// Vídeo / Exportação
// ---------------------------------------------------------------------------

export type AspectRatioId = 'vertical' | 'square' | 'portrait' | 'landscape';

export interface AspectRatioDef {
  id: AspectRatioId;
  label: string;
  width: number;
  height: number;
}

export const ASPECT_RATIOS: Record<AspectRatioId, AspectRatioDef> = {
  vertical: { id: 'vertical', label: '9:16', width: 1080, height: 1920 },
  square: { id: 'square', label: '1:1', width: 1080, height: 1080 },
  portrait: { id: 'portrait', label: '4:5', width: 1080, height: 1350 },
  landscape: { id: 'landscape', label: '16:9', width: 1920, height: 1080 },
};

export type FpsOption = 24 | 30 | 60;

export interface VideoSettings {
  aspectRatio: AspectRatioId;
  fps: FpsOption;
}

export interface ExportSettings {
  videoBitrateKbps: number;
  audioBitrateKbps: number;
}

// ---------------------------------------------------------------------------
// Efeitos (arquitetura extensível — secção 23)
// ---------------------------------------------------------------------------

export type LyricsEffectId = 'spotify-inspired';

export interface LyricsEffectSettings {
  activeEffectId: LyricsEffectId;
}

// ---------------------------------------------------------------------------
// Projeto
// ---------------------------------------------------------------------------

export interface Project {
  formatVersion: 1;
  id: ID;
  name: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  song: Song;
  cover: CoverImage;
  lyrics: Lyrics;
  visual: VisualSettings;
  background: BackgroundSettings;
  video: VideoSettings;
  export: ExportSettings;
  effect: LyricsEffectSettings;
  header: HeaderSettings;
}

// ---------------------------------------------------------------------------
// Estado visual calculado (saída do LyricsRenderer para um instante `t`)
// ---------------------------------------------------------------------------

export interface RenderedWordState {
  word: LyricWord;
  /** 0 = ainda não cantada, 1 = a ser cantada agora, 2 = já cantada */
  status: 0 | 1 | 2;
  /** progresso 0-1 dentro da palavra atual, útil para highlight suave */
  progress: number;
}

export interface RenderedLineState {
  line: LyricLine;
  /** posição relativa à linha ativa: 0 = ativa, -1 = anterior, +1 = próxima, etc. */
  relativeIndex: number;
  /** posição vertical interpolada (pode ser fracionária durante a transição) */
  positionY: number;
  opacity: number;
  scale: number;
  blurPx: number;
  /**
   * Progresso 0-1 do preenchimento tipo karaoke (esquerda→direita) desta
   * linha no instante atual. Só é relevante para a linha ativa; para as
   * restantes vale sempre 0 ou 1 (já cantada / ainda não chegou).
   */
  fillProgress: number;
  words: RenderedWordState[];
}

export interface RenderFrame {
  time: number;
  activeLineIndex: number; // pode ser -1 se ainda não começou
  lines: RenderedLineState[];
}

// ---------------------------------------------------------------------------
// Erros de validação (secção 41)
// ---------------------------------------------------------------------------

export interface ValidationIssue {
  severity: 'error' | 'warning';
  message: string;
  lineId?: ID;
  wordId?: ID;
}
