'use client';

import { useProjectStore } from '@/stores/projectStore';
import type { BackgroundMode } from '@/types';

const MODE_LABELS: Record<BackgroundMode, string> = {
  cover: 'Capa',
  solid: 'Cor sólida',
  gradient: 'Gradiente',
  auto: 'Auto (cores da capa)',
};

export function BackgroundTab() {
  const background = useProjectStore((s) => s.project.background);
  const setBackground = useProjectStore((s) => s.setBackground);
  const hasCover = useProjectStore((s) => !!s.project.cover.objectUrl);

  return (
    <div className="max-w-md space-y-6">
      <section>
        <h3 className="text-sm font-semibold mb-3">Modo</h3>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(MODE_LABELS) as BackgroundMode[]).map((mode) => {
            const disabled = (mode === 'cover' || mode === 'auto') && !hasCover;
            return (
              <button
                key={mode}
                disabled={disabled}
                onClick={() => setBackground({ mode })}
                className={`px-3 py-2 rounded-lg text-sm border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                  background.mode === mode
                    ? 'border-accent bg-accent/10 text-accent-soft'
                    : 'border-white/10 hover:border-white/20 text-neutral-300'
                }`}
              >
                {MODE_LABELS[mode]}
              </button>
            );
          })}
        </div>
        {!hasCover && (
          <p className="text-xs text-neutral-500 mt-2">
            Importa uma capa no separador "Música" para usar os modos Capa e Auto.
          </p>
        )}
      </section>

      {background.mode === 'solid' && (
        <section>
          <label className="field-label">Cor</label>
          <input
            type="color"
            value={background.solidColor}
            onChange={(e) => setBackground({ solidColor: e.target.value })}
            className="w-full h-10 rounded-lg bg-transparent border border-white/10"
          />
        </section>
      )}

      {(background.mode === 'gradient' || (background.mode === 'auto' && !hasCover)) && (
        <section className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Cor 1</label>
              <input type="color" value={background.gradientFrom} onChange={(e) => setBackground({ gradientFrom: e.target.value })} className="w-full h-10 rounded-lg bg-transparent border border-white/10" />
            </div>
            <div>
              <label className="field-label">Cor 2</label>
              <input type="color" value={background.gradientTo} onChange={(e) => setBackground({ gradientTo: e.target.value })} className="w-full h-10 rounded-lg bg-transparent border border-white/10" />
            </div>
          </div>
          <SliderRow label="Direção" value={background.gradientAngleDeg} min={0} max={360} step={1} unit="°" onChange={(v) => setBackground({ gradientAngleDeg: v })} />
        </section>
      )}

      {(background.mode === 'cover' || background.mode === 'auto') && hasCover && (
        <section className="space-y-3">
          <SliderRow label="Blur da capa" value={background.blurPx} min={0} max={80} step={1} unit="px" onChange={(v) => setBackground({ blurPx: v })} />
        </section>
      )}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Overlay</h3>
        <SliderRow label="Escurecimento" value={background.overlayDarkness} min={0} max={1} step={0.01} onChange={(v) => setBackground({ overlayDarkness: v })} />
        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input type="checkbox" checked={background.overlayGradient} onChange={(e) => setBackground({ overlayGradient: e.target.checked })} />
          Gradiente escuro na base (legibilidade)
        </label>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Movimento subtil</h3>
        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input
            type="checkbox"
            checked={background.motion.enabled}
            onChange={(e) => setBackground({ motion: { ...background.motion, enabled: e.target.checked } })}
          />
          Ativar zoom/pan lento
        </label>
        {background.motion.enabled && (
          <>
            <SliderRow
              label="Velocidade"
              value={background.motion.zoomSpeed}
              min={0.01}
              max={0.2}
              step={0.005}
              onChange={(v) => setBackground({ motion: { ...background.motion, zoomSpeed: v } })}
            />
            <SliderRow
              label="Quantidade de pan"
              value={background.motion.panAmountPx}
              min={0}
              max={60}
              step={1}
              unit="px"
              onChange={(v) => setBackground({ motion: { ...background.motion, panAmountPx: v } })}
            />
          </>
        )}
      </section>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="field-label !mb-0">{label}</label>
        <span className="text-xs text-neutral-500">
          {value}
          {unit ?? ''}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
    </div>
  );
}
