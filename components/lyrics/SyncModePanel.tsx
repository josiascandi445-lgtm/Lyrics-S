'use client';

import { useAudioClockState } from '@/hooks/useAudioClock';
import { audioClock } from '@/lib/audio/audioClock';
import { useProjectStore } from '@/stores/projectStore';
import { formatTime } from '@/lib/utils/time';

export function SyncModePanel() {
  const { time, isPlaying } = useAudioClockState();
  const lines = useProjectStore((s) => s.project.lyrics.lines);
  const selectedLineId = useProjectStore((s) => s.selectedLineId);
  const setSelectedLine = useProjectStore((s) => s.setSelectedLine);
  const markLineStart = useProjectStore((s) => s.markLineStart);
  const markLineEnd = useProjectStore((s) => s.markLineEnd);

  return (
    <div className="panel p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-accent-soft">Modo de sincronização ativo</p>
          <p className="text-xs text-neutral-500">
            Space = play/pause · S = marcar início · E = marcar fim (avança automaticamente) · Enter = sair
          </p>
        </div>
        <div className="text-lg font-mono tabular-nums">{formatTime(time)}</div>
      </div>

      <button className="btn-secondary" onClick={() => audioClock.toggle()}>
        {isPlaying ? 'Pausar' : 'Reproduzir'}
      </button>

      <div className="max-h-64 overflow-y-auto space-y-1">
        {lines.map((line) => {
          const isActive = time >= line.startTime && time < line.endTime;
          const isTarget = selectedLineId === line.id;
          return (
            <div
              key={line.id}
              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${
                isTarget ? 'bg-accent/15' : isActive ? 'bg-white/5' : ''
              }`}
              onClick={() => setSelectedLine(line.id)}
            >
              <span className="text-xs font-mono text-neutral-500 w-14 shrink-0">
                {formatTime(line.startTime, { centis: false })}
              </span>
              <span className="text-sm flex-1 truncate">{line.text}</span>
              <button
                className="btn-icon !p-1 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  markLineStart(line.id, audioClock.currentTime);
                }}
              >
                S
              </button>
              <button
                className="btn-icon !p-1 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  markLineEnd(line.id, audioClock.currentTime);
                }}
              >
                E
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
