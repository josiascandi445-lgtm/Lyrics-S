import { create } from 'zustand';
import { createId } from '@/lib/utils/id';
import { createDefaultProject } from '@/lib/project/defaults';
import { sortLinesByStartTime } from '@/lib/lyrics/utils';
import type {
  BackgroundSettings,
  CoverImage,
  HeaderSettings,
  LyricLine,
  Project,
  Song,
  VideoSettings,
  VisualSettings,
} from '@/types';
import type { WaveformData } from '@/lib/audio/waveform';

export type EditorTab = 'music' | 'lyrics' | 'visual' | 'background' | 'video';

interface ProjectStoreState {
  project: Project;
  waveform: WaveformData | null;
  activeTab: EditorTab;
  selectedLineId: string | null;
  syncModeActive: boolean;
  wordSyncLineId: string | null;

  // --- ações gerais ---
  loadProject: (project: Project) => void;
  resetProject: () => void;
  renameProject: (name: string) => void;
  setActiveTab: (tab: EditorTab) => void;

  // --- música ---
  setSong: (partial: Partial<Song>) => void;
  setWaveform: (waveform: WaveformData | null) => void;

  // --- capa ---
  setCover: (partial: Partial<CoverImage>) => void;

  // --- letras ---
  setLyricsLines: (lines: LyricLine[]) => void;
  addLine: (afterId?: string) => void;
  removeLine: (id: string) => void;
  updateLine: (id: string, partial: Partial<LyricLine>) => void;
  duplicateLine: (id: string) => void;
  reorderLines: (fromIndex: number, toIndex: number) => void;
  splitLine: (id: string, splitAtCharIndex: number) => void;
  mergeWithNext: (id: string) => void;
  setSelectedLine: (id: string | null) => void;

  // --- sincronização ---
  setSyncModeActive: (active: boolean) => void;
  markLineStart: (id: string, time: number) => void;
  markLineEnd: (id: string, time: number) => void;
  setWordSyncLineId: (id: string | null) => void;
  updateWordTiming: (lineId: string, wordId: string, startTime: number, endTime: number) => void;
  generateWordsForLine: (lineId: string) => void;

  // --- settings ---
  setVisual: (partial: Partial<VisualSettings>) => void;
  setBackground: (partial: Partial<BackgroundSettings>) => void;
  setVideo: (partial: Partial<VideoSettings>) => void;
  setHeader: (partial: Partial<HeaderSettings>) => void;
}

function touch(project: Project): Project {
  return { ...project, updatedAt: new Date().toISOString() };
}

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  project: createDefaultProject(),
  waveform: null,
  activeTab: 'music',
  selectedLineId: null,
  syncModeActive: false,
  wordSyncLineId: null,

  loadProject: (project) => set({ project, waveform: null, selectedLineId: null }),
  resetProject: () => set({ project: createDefaultProject(), waveform: null, selectedLineId: null }),
  renameProject: (name) => set((s) => ({ project: touch({ ...s.project, name }) })),
  setActiveTab: (activeTab) => set({ activeTab }),

  setSong: (partial) =>
    set((s) => ({ project: touch({ ...s.project, song: { ...s.project.song, ...partial } }) })),

  setWaveform: (waveform) => set({ waveform }),

  setCover: (partial) =>
    set((s) => ({ project: touch({ ...s.project, cover: { ...s.project.cover, ...partial } }) })),

  setLyricsLines: (lines) =>
    set((s) => ({
      project: touch({ ...s.project, lyrics: { lines: sortLinesByStartTime(lines) } }),
    })),

  addLine: (afterId) =>
    set((s) => {
      const lines = [...s.project.lyrics.lines];
      const index = afterId ? lines.findIndex((l) => l.id === afterId) : lines.length - 1;
      const prev = lines[index];
      const startTime = prev ? prev.endTime : 0;
      const newLine: LyricLine = {
        id: createId('line'),
        text: 'Nova linha',
        startTime,
        endTime: startTime + 3,
        words: [],
      };
      lines.splice(index + 1, 0, newLine);
      return { project: touch({ ...s.project, lyrics: { lines } }), selectedLineId: newLine.id };
    }),

  removeLine: (id) =>
    set((s) => ({
      project: touch({
        ...s.project,
        lyrics: { lines: s.project.lyrics.lines.filter((l) => l.id !== id) },
      }),
      selectedLineId: s.selectedLineId === id ? null : s.selectedLineId,
    })),

  updateLine: (id, partial) =>
    set((s) => ({
      project: touch({
        ...s.project,
        lyrics: {
          lines: s.project.lyrics.lines.map((l) => (l.id === id ? { ...l, ...partial } : l)),
        },
      }),
    })),

  duplicateLine: (id) =>
    set((s) => {
      const lines = [...s.project.lyrics.lines];
      const index = lines.findIndex((l) => l.id === id);
      if (index === -1) return s;
      const original = lines[index]!;
      const clone: LyricLine = {
        ...original,
        id: createId('line'),
        words: original.words.map((w) => ({ ...w, id: createId('word') })),
      };
      lines.splice(index + 1, 0, clone);
      return { project: touch({ ...s.project, lyrics: { lines } }) };
    }),

  reorderLines: (fromIndex, toIndex) =>
    set((s) => {
      const lines = [...s.project.lyrics.lines];
      const [moved] = lines.splice(fromIndex, 1);
      if (!moved) return s;
      lines.splice(toIndex, 0, moved);
      return { project: touch({ ...s.project, lyrics: { lines } }) };
    }),

  splitLine: (id, splitAtCharIndex) =>
    set((s) => {
      const lines = [...s.project.lyrics.lines];
      const index = lines.findIndex((l) => l.id === id);
      if (index === -1) return s;
      const original = lines[index]!;
      const firstText = original.text.slice(0, splitAtCharIndex).trim();
      const secondText = original.text.slice(splitAtCharIndex).trim();
      if (!firstText || !secondText) return s;
      const mid = (original.startTime + original.endTime) / 2;
      const first: LyricLine = { ...original, text: firstText, endTime: mid, words: [] };
      const second: LyricLine = {
        id: createId('line'),
        text: secondText,
        startTime: mid,
        endTime: original.endTime,
        words: [],
      };
      lines.splice(index, 1, first, second);
      return { project: touch({ ...s.project, lyrics: { lines } }) };
    }),

  mergeWithNext: (id) =>
    set((s) => {
      const lines = [...s.project.lyrics.lines];
      const index = lines.findIndex((l) => l.id === id);
      const next = lines[index + 1];
      if (index === -1 || !next) return s;
      const current = lines[index]!;
      const merged: LyricLine = {
        ...current,
        text: `${current.text} ${next.text}`.trim(),
        endTime: next.endTime,
        words: [...current.words, ...next.words],
      };
      lines.splice(index, 2, merged);
      return { project: touch({ ...s.project, lyrics: { lines } }) };
    }),

  setSelectedLine: (id) => set({ selectedLineId: id }),

  setSyncModeActive: (syncModeActive) => set({ syncModeActive }),

  markLineStart: (id, time) =>
    set((s) => ({
      project: touch({
        ...s.project,
        lyrics: {
          lines: s.project.lyrics.lines.map((l) => (l.id === id ? { ...l, startTime: time } : l)),
        },
      }),
    })),

  markLineEnd: (id, time) =>
    set((s) => ({
      project: touch({
        ...s.project,
        lyrics: {
          lines: s.project.lyrics.lines.map((l) => (l.id === id ? { ...l, endTime: time } : l)),
        },
      }),
    })),

  setWordSyncLineId: (id) => set({ wordSyncLineId: id }),

  updateWordTiming: (lineId, wordId, startTime, endTime) =>
    set((s) => ({
      project: touch({
        ...s.project,
        lyrics: {
          lines: s.project.lyrics.lines.map((l) =>
            l.id !== lineId
              ? l
              : {
                  ...l,
                  words: l.words.map((w) => (w.id === wordId ? { ...w, startTime, endTime } : w)),
                }
          ),
        },
      }),
    })),

  generateWordsForLine: (lineId) =>
    set((s) => ({
      project: touch({
        ...s.project,
        lyrics: {
          lines: s.project.lyrics.lines.map((l) => {
            if (l.id !== lineId) return l;
            const tokens = l.text.split(/\s+/).filter(Boolean);
            if (tokens.length === 0) return l;
            const span = (l.endTime - l.startTime) / tokens.length;
            const words = tokens.map((text, i) => ({
              id: createId('word'),
              text,
              startTime: l.startTime + i * span,
              endTime: l.startTime + (i + 1) * span,
            }));
            return { ...l, words };
          }),
        },
      }),
    })),

  setVisual: (partial) =>
    set((s) => ({ project: touch({ ...s.project, visual: { ...s.project.visual, ...partial } }) })),

  setBackground: (partial) =>
    set((s) => ({
      project: touch({
        ...s.project,
        background: { ...s.project.background, ...partial, motion: { ...s.project.background.motion, ...(partial.motion ?? {}) } },
      }),
    })),

  setVideo: (partial) =>
    set((s) => ({ project: touch({ ...s.project, video: { ...s.project.video, ...partial } }) })),

  setHeader: (partial) =>
    set((s) => ({ project: touch({ ...s.project, header: { ...s.project.header, ...partial } }) })),
}));

export function getActiveLine(): LyricLine | null {
  const { project, selectedLineId } = useProjectStore.getState();
  return project.lyrics.lines.find((l) => l.id === selectedLineId) ?? null;
}
