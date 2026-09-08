'use client';

import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize } from 'lucide-react';
import { useState } from 'react';
import { audioClock } from '@/lib/audio/audioClock';
import { useAudioClockState } from '@/hooks/useAudioClock';
import { formatTime } from '@/lib/utils/time';

export function PlaybackControls({ previewContainerRef }: { previewContainerRef?: React.RefObject<HTMLElement> }) {
  const { time, isPlaying } = useAudioClockState();
  const [muted, setMuted] = useState(false);
  const duration = audioClock.duration || 0;

  function handleFullscreen() {
    const el = previewContainerRef?.current;
    if (el?.requestFullscreen) void el.requestFullscreen();
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <button className="btn-icon" onClick={() => audioClock.seek(0)} title="Reiniciar">
        <RotateCcw size={16} />
      </button>
      <button className="btn-icon" onClick={() => audioClock.toggle()} title="Play/Pause (Space)">
        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
      </button>
      <span className="text-xs font-mono text-neutral-400 tabular-nums w-24">
        {formatTime(time, { centis: false })} / {formatTime(duration, { centis: false })}
      </span>
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.01}
        value={Math.min(time, duration || 0)}
        onChange={(e) => audioClock.seek(Number(e.target.value))}
        className="flex-1"
      />
      <button
        className="btn-icon"
        onClick={() => {
          const el = audioClock.element;
          if (el) {
            el.muted = !el.muted;
            setMuted(el.muted);
          }
        }}
        title="Volume"
      >
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
      <button className="btn-icon" onClick={handleFullscreen} title="Fullscreen">
        <Maximize size={16} />
      </button>
    </div>
  );
}
