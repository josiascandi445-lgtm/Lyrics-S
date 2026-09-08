'use client';

import { useEffect, useRef } from 'react';
import { audioClock } from '@/lib/audio/audioClock';
import { renderProjectFrame } from '@/lib/render/compositor';
import { ASPECT_RATIOS } from '@/types';
import { useProjectStore } from '@/stores/projectStore';
import { useProjectAssets } from '@/hooks/useProjectAssets';

export function PreviewCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const project = useProjectStore((s) => s.project);
  const assets = useProjectAssets(project.cover.objectUrl);

  // canvas interno sempre na resolução real de exportação — o CSS trata do
  // dimensionamento visual, garantindo que o preview é fiel ao resultado final.
  const dims = ASPECT_RATIOS[project.video.aspectRatio];

  const projectRef = useRef(project);
  projectRef.current = project;
  const assetsRef = useRef(assets);
  assetsRef.current = assets;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;
    const draw = () => {
      const t = audioClock.currentTime;
      renderProjectFrame(ctx, projectRef.current, assetsRef.current, t, dims.width, dims.height);
      rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [dims.width, dims.height]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-black/40 rounded-xl overflow-hidden">
      <canvas
        ref={canvasRef}
        width={dims.width}
        height={dims.height}
        style={{ aspectRatio: `${dims.width} / ${dims.height}` }}
        className="max-w-full max-h-full"
      />
    </div>
  );
}
