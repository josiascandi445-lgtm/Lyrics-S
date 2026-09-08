'use client';

import { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { audioClock } from '@/lib/audio/audioClock';
import { useAudioClockState } from '@/hooks/useAudioClock';

const TRACK_HEIGHT = 88;
const WAVEFORM_HEIGHT = 40;

export function Timeline() {
  const waveform = useProjectStore((s) => s.waveform);
  const lines = useProjectStore((s) => s.project.lyrics.lines);
  const selectedLineId = useProjectStore((s) => s.selectedLineId);
  const setSelectedLine = useProjectStore((s) => s.setSelectedLine);
  const { time } = useAudioClockState();
  const duration = audioClock.duration || waveform?.duration || 60;

  const [pxPerSecond, setPxPerSecond] = useState(60);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const width = Math.max(1, Math.ceil(duration * pxPerSecond));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = TRACK_HEIGHT * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${TRACK_HEIGHT}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, TRACK_HEIGHT);

    // waveform
    ctx.fillStyle = '#3a3a43';
    if (waveform) {
      const barWidth = width / waveform.peaks.length;
      for (let i = 0; i < waveform.peaks.length; i++) {
        const peak = waveform.peaks[i]!;
        const barHeight = Math.max(1, peak * WAVEFORM_HEIGHT);
        const x = i * barWidth;
        const y = WAVEFORM_HEIGHT / 2 - barHeight / 2 + 8;
        ctx.fillRect(x, y, Math.max(1, barWidth - 0.5), barHeight);
      }
    }

    // linhas de letras
    const lineTop = WAVEFORM_HEIGHT + 16;
    for (const line of lines) {
      const x = line.startTime * pxPerSecond;
      const w = Math.max(2, (line.endTime - line.startTime) * pxPerSecond);
      const isSelected = line.id === selectedLineId;
      ctx.fillStyle = isSelected ? 'rgba(124,92,255,0.55)' : 'rgba(124,92,255,0.25)';
      ctx.strokeStyle = isSelected ? '#7c5cff' : 'rgba(124,92,255,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, lineTop, w, 24, 4);
      ctx.fill();
      ctx.stroke();

      if (w > 20) {
        ctx.fillStyle = '#e5e5e5';
        ctx.font = '11px Inter, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.save();
        ctx.beginPath();
        ctx.rect(x + 4, lineTop, w - 8, 24);
        ctx.clip();
        ctx.fillText(line.text, x + 6, lineTop + 12);
        ctx.restore();
      }

      // palavras (se sincronizadas)
      for (const word of line.words) {
        const wx = word.startTime * pxPerSecond;
        const ww = Math.max(1, (word.endTime - word.startTime) * pxPerSecond);
        ctx.strokeStyle = 'rgba(30,215,96,0.7)';
        ctx.strokeRect(wx, lineTop + 26, ww, 6);
      }
    }
  }, [waveform, lines, selectedLineId, width, pxPerSecond]);

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const t = x / pxPerSecond;
    audioClock.seek(t);

    const lineTop = WAVEFORM_HEIGHT + 16;
    const y = e.clientY - rect.top;
    if (y >= lineTop && y <= lineTop + 24) {
      const clicked = lines.find((l) => t >= l.startTime && t <= l.endTime);
      if (clicked) setSelectedLine(clicked.id);
    }
  }

  const playheadX = time * pxPerSecond;

  // auto-scroll para manter o playhead visível
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const visibleStart = container.scrollLeft;
    const visibleEnd = visibleStart + container.clientWidth;
    if (playheadX < visibleStart || playheadX > visibleEnd - 40) {
      container.scrollLeft = Math.max(0, playheadX - container.clientWidth / 3);
    }
  }, [playheadX]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-1 border-b border-white/5">
        <span className="text-xs text-neutral-500">Timeline</span>
        <div className="flex items-center gap-1">
          <button className="btn-icon !p-1" onClick={() => setPxPerSecond((v) => Math.max(10, v - 20))}>
            <ZoomOut size={14} />
          </button>
          <button className="btn-icon !p-1" onClick={() => setPxPerSecond((v) => Math.min(400, v + 20))}>
            <ZoomIn size={14} />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="relative flex-1 overflow-x-auto overflow-y-hidden">
        <canvas ref={canvasRef} onClick={handleClick} className="cursor-pointer" />
        <div
          className="absolute top-0 bottom-0 w-px bg-red-500 pointer-events-none"
          style={{ left: playheadX }}
        />
      </div>
    </div>
  );
}
