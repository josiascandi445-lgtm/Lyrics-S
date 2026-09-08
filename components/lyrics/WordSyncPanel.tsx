'use client';

import { useEffect, useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { audioClock } from '@/lib/audio/audioClock';
import { useAudioClockState } from '@/hooks/useAudioClock';
import { formatTime } from '@/lib/utils/time';

interface WordSyncPanelProps {
  lineId: string;
}

export function WordSyncPanel({ lineId }: WordSyncPanelProps) {
  const line = useProjectStore((s) => s.project.lyrics.lines.find((l) => l.id === lineId));
  const generateWordsForLine = useProjectStore((s) => s.generateWordsForLine);
  const updateWordTiming = useProjectStore((s) => s.updateWordTiming);
  const { time } = useAudioClockState();
  const [tapMode, setTapMode] = useState(false);
  const [tapIndex, setTapIndex] = useState(0);

  useEffect(() => {
    if (!tapMode || !line) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.code !== 'KeyW') return;
      if (!line) return;
      e.preventDefault();
      const words = line.words;
      if (tapIndex >= words.length) return;
      const word = words[tapIndex]!;
      const t = audioClock.currentTime;
      updateWordTiming(line.id, word.id, t, word.endTime);
      const prev = words[tapIndex - 1];
      if (prev) updateWordTiming(line.id, prev.id, prev.startTime, t);
      const isLast = tapIndex === words.length - 1;
      if (isLast) updateWordTiming(line.id, word.id, t, line.endTime);
      setTapIndex((i) => i + 1);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [tapMode, tapIndex, line, updateWordTiming]);

  if (!line) return null;

  return (
    <div className="panel p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Sincronização por palavra</p>
        <span className="text-xs font-mono text-neutral-500">{formatTime(time)}</span>
      </div>
      <p className="text-xs text-neutral-500 truncate">"{line.text}"</p>

      {line.words.length === 0 ? (
        <button className="btn-secondary" onClick={() => generateWordsForLine(line.id)}>
          Gerar palavras a partir do texto
        </button>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <button
              className="btn-secondary"
              onClick={() => {
                setTapIndex(0);
                setTapMode((v) => !v);
              }}
            >
              {tapMode ? 'Parar tap-sync' : 'Iniciar tap-sync (tecla W)'}
            </button>
            <button className="btn-secondary" onClick={() => audioClock.toggle()}>
              Play/Pause
            </button>
          </div>
          {tapMode && (
            <p className="text-xs text-accent-soft">
              Próxima palavra a marcar: <strong>{line.words[tapIndex]?.text ?? '(fim)'}</strong> — pressiona
              "W" no instante em que ela é cantada.
            </p>
          )}
          <div className="max-h-56 overflow-y-auto space-y-1">
            {line.words.map((word, i) => (
              <div key={word.id} className={`flex items-center gap-2 p-1.5 rounded-lg ${i === tapIndex && tapMode ? 'bg-accent/15' : ''}`}>
                <span className="text-sm flex-1 truncate">{word.text}</span>
                <input
                  type="number"
                  step={0.01}
                  className="w-20 bg-base-850 border border-white/10 rounded px-1.5 py-1 text-xs"
                  value={Number(word.startTime.toFixed(2))}
                  onChange={(e) => updateWordTiming(line.id, word.id, Number(e.target.value), word.endTime)}
                />
                <span className="text-neutral-600 text-xs">→</span>
                <input
                  type="number"
                  step={0.01}
                  className="w-20 bg-base-850 border border-white/10 rounded px-1.5 py-1 text-xs"
                  value={Number(word.endTime.toFixed(2))}
                  onChange={(e) => updateWordTiming(line.id, word.id, word.startTime, Number(e.target.value))}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
