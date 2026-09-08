'use client';

import { useProjectStore } from '@/stores/projectStore';
import { ASPECT_RATIOS, type AspectRatioId, type FpsOption } from '@/types';

const FPS_OPTIONS: FpsOption[] = [24, 30, 60];

export function VideoTab() {
  const video = useProjectStore((s) => s.project.video);
  const setVideo = useProjectStore((s) => s.setVideo);

  return (
    <div className="max-w-md space-y-6">
      <section>
        <h3 className="text-sm font-semibold mb-3">Proporção</h3>
        <div className="grid grid-cols-2 gap-2">
          {(Object.values(ASPECT_RATIOS)).map((ar) => (
            <button
              key={ar.id}
              onClick={() => setVideo({ aspectRatio: ar.id as AspectRatioId })}
              className={`px-3 py-3 rounded-lg text-sm border transition-colors flex flex-col items-center gap-1 ${
                video.aspectRatio === ar.id
                  ? 'border-accent bg-accent/10 text-accent-soft'
                  : 'border-white/10 hover:border-white/20 text-neutral-300'
              }`}
            >
              <div
                className="border border-current/40 rounded"
                style={{
                  width: ar.width > ar.height ? 32 : (ar.width / ar.height) * 32,
                  height: ar.width > ar.height ? (ar.height / ar.width) * 32 : 32,
                }}
              />
              <span className="font-medium">{ar.label}</span>
              <span className="text-xs opacity-60">
                {ar.width}×{ar.height}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-3">FPS</h3>
        <div className="grid grid-cols-3 gap-2">
          {FPS_OPTIONS.map((fps) => (
            <button
              key={fps}
              onClick={() => setVideo({ fps })}
              className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                video.fps === fps
                  ? 'border-accent bg-accent/10 text-accent-soft'
                  : 'border-white/10 hover:border-white/20 text-neutral-300'
              }`}
            >
              {fps} FPS
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
