'use client';

import { useProjectStore } from '@/stores/projectStore';
import { FONT_PRESETS } from '@/lib/project/defaults';
import type { VisualSettings } from '@/types';

const PRESET_LABELS: Record<VisualSettings['preset'], string> = {
  modern: 'Modern',
  minimal: 'Minimal',
  bold: 'Bold',
  spotify: 'Spotify Inspired',
  clean: 'Clean',
  custom: 'Custom',
};

export function VisualTab() {
  const visual = useProjectStore((s) => s.project.visual);
  const setVisual = useProjectStore((s) => s.setVisual);
  const header = useProjectStore((s) => s.project.header);
  const setHeader = useProjectStore((s) => s.setHeader);

  function applyPreset(preset: VisualSettings['preset']) {
    setVisual({ preset, ...FONT_PRESETS[preset] });
  }

  return (
    <div className="max-w-md space-y-6">
      <section>
        <h3 className="text-sm font-semibold mb-3">Presets</h3>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(PRESET_LABELS) as VisualSettings['preset'][])
            .filter((p) => p !== 'custom')
            .map((p) => (
              <button
                key={p}
                onClick={() => applyPreset(p)}
                className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                  visual.preset === p
                    ? 'border-accent bg-accent/10 text-accent-soft'
                    : 'border-white/10 hover:border-white/20 text-neutral-300'
                }`}
              >
                {PRESET_LABELS[p]}
              </button>
            ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Tipografia</h3>
        <Row label="Tamanho da fonte" value={visual.fontSizePx} min={24} max={140} step={1} unit="px" onChange={(v) => setVisual({ fontSizePx: v })} />
        <Row label="Peso da fonte" value={visual.fontWeight} min={100} max={900} step={100} onChange={(v) => setVisual({ fontWeight: v })} />
        <Row label="Espaçamento entre letras" value={visual.letterSpacing} min={-3} max={5} step={0.1} unit="px" onChange={(v) => setVisual({ letterSpacing: v })} />
        <div className="grid grid-cols-2 gap-3">
          <ColorField label="Cor (linha ativa)" value={visual.color} onChange={(v) => setVisual({ color: v })} />
          <div>
            <label className="field-label">Alinhamento</label>
            <select
              className="w-full bg-base-850 border border-white/10 rounded-lg px-2 py-2 text-sm"
              value={visual.textAlign}
              onChange={(e) => setVisual({ textAlign: e.target.value as VisualSettings['textAlign'] })}
            >
              <option value="left">Esquerda</option>
              <option value="center">Centro</option>
              <option value="right">Direita</option>
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input type="checkbox" checked={visual.textShadow} onChange={(e) => setVisual({ textShadow: e.target.checked })} />
          Sombra no texto
        </label>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Efeito de cascata (linhas)</h3>
        <Row label="Linhas visíveis de cada lado" value={visual.visibleLinesEachSide} min={1} max={4} step={1} onChange={(v) => setVisual({ visibleLinesEachSide: v })} />
        <Row label="Espaçamento entre linhas" value={visual.lineSpacingPx} min={40} max={200} step={2} unit="px" onChange={(v) => setVisual({ lineSpacingPx: v })} />
        <Row label="Redução de escala por linha" value={visual.inactiveScaleStep} min={0} max={0.4} step={0.01} onChange={(v) => setVisual({ inactiveScaleStep: v })} />
        <Row label="Redução de opacidade por linha" value={visual.inactiveOpacityStep} min={0} max={0.6} step={0.01} onChange={(v) => setVisual({ inactiveOpacityStep: v })} />
        <Row label="Blur máximo" value={visual.maxBlurPx} min={0} max={20} step={0.5} unit="px" onChange={(v) => setVisual({ maxBlurPx: v })} />
        <Row label="Duração da transição" value={visual.transitionDurationMs} min={100} max={1000} step={10} unit="ms" onChange={(v) => setVisual({ transitionDurationMs: v })} />
        <div>
          <label className="field-label">Easing</label>
          <select
            className="w-full bg-base-850 border border-white/10 rounded-lg px-2 py-2 text-sm"
            value={visual.easing}
            onChange={(e) => setVisual({ easing: e.target.value as VisualSettings['easing'] })}
          >
            <option value="easeOutCubic">Ease Out Cubic</option>
            <option value="easeInOutCubic">Ease In-Out Cubic</option>
            <option value="easeOutQuint">Ease Out Quint</option>
            <option value="linear">Linear</option>
          </select>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Preenchimento tipo karaokê</h3>
        <p className="text-xs text-neutral-500">
          A parte já cantada da linha ativa fica sólida; a parte ainda não cantada fica translúcida, com uma
          transição suave a acompanhar a música (funciona mesmo sem sincronização por palavra — usa o tempo da
          linha como aproximação nesse caso).
        </p>
        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input
            type="checkbox"
            checked={visual.karaokeFillEnabled}
            onChange={(e) => setVisual({ karaokeFillEnabled: e.target.checked })}
          />
          Ativar preenchimento progressivo
        </label>
        {visual.karaokeFillEnabled && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <ColorField label="Cor (já cantado)" value={visual.sungColor} onChange={(v) => setVisual({ sungColor: v })} />
              <ColorField label="Cor (por cantar)" value={visual.unsungColor} onChange={(v) => setVisual({ unsungColor: v })} />
            </div>
            <Row
              label="Suavidade da transição"
              value={visual.karaokeSoftnessFraction}
              min={0}
              max={0.3}
              step={0.01}
              onChange={(v) => setVisual({ karaokeSoftnessFraction: v })}
            />
          </>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Cabeçalho (capa + título + artista)</h3>
        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input type="checkbox" checked={header.enabled} onChange={(e) => setHeader({ enabled: e.target.checked })} />
          Mostrar no topo do vídeo
        </label>
        <p className="text-xs text-neutral-500">
          Usa a capa e o título/artista definidos no separador &ldquo;Música&rdquo;.
        </p>
      </section>
    </div>
  );
}

function Row({
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

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const isHex = value.startsWith('#');
  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={isHex ? value : '#ffffff'}
          onChange={(e) => onChange(e.target.value)}
          className="w-9 h-9 rounded-lg bg-transparent border border-white/10"
        />
        <input
          className="flex-1 bg-base-850 border border-white/10 rounded-lg px-2 py-2 text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
