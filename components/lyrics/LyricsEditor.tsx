'use client';

import { useState } from 'react';
import { Plus, Trash2, Copy, ArrowUp, ArrowDown, Scissors, GitMerge } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { createId } from '@/lib/utils/id';
import { formatTime } from '@/lib/utils/time';
import { validateLyrics } from '@/lib/lyrics/validation';
import type { LyricLine } from '@/types';

export function LyricsEditor() {
  const lines = useProjectStore((s) => s.project.lyrics.lines);
  const setLyricsLines = useProjectStore((s) => s.setLyricsLines);
  const addLine = useProjectStore((s) => s.addLine);
  const removeLine = useProjectStore((s) => s.removeLine);
  const updateLine = useProjectStore((s) => s.updateLine);
  const duplicateLine = useProjectStore((s) => s.duplicateLine);
  const reorderLines = useProjectStore((s) => s.reorderLines);
  const splitLine = useProjectStore((s) => s.splitLine);
  const mergeWithNext = useProjectStore((s) => s.mergeWithNext);
  const selectedLineId = useProjectStore((s) => s.selectedLineId);
  const setSelectedLine = useProjectStore((s) => s.setSelectedLine);

  const [pasteText, setPasteText] = useState('');
  const issues = validateLyrics(lines);

  function handlePasteAsLines() {
    const newLines: LyricLine[] = pasteText
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((text, i) => ({
        id: createId('line'),
        text,
        startTime: i * 3,
        endTime: (i + 1) * 3,
        words: [],
      }));
    if (newLines.length === 0) return;
    setLyricsLines([...lines, ...newLines]);
    setPasteText('');
  }

  return (
    <div className="space-y-4">
      {lines.length === 0 && (
        <div className="panel p-4">
          <label className="field-label">Colar letras (uma linha de texto por linha)</label>
          <textarea
            className="w-full h-32 bg-base-850 border border-white/10 rounded-lg p-2 text-sm resize-none"
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={'Primeira linha\nSegunda linha\nTerceira linha'}
          />
          <button className="btn-primary mt-2" onClick={handlePasteAsLines} disabled={!pasteText.trim()}>
            Criar linhas
          </button>
        </div>
      )}

      {issues.length > 0 && (
        <div className="panel p-3 space-y-1 max-h-32 overflow-y-auto">
          {issues.map((issue, i) => (
            <p key={i} className={`text-xs ${issue.severity === 'error' ? 'text-red-400' : 'text-amber-400'}`}>
              {issue.message}
            </p>
          ))}
        </div>
      )}

      <div className="space-y-1">
        {lines.map((line, index) => (
          <div
            key={line.id}
            className={`panel p-2 flex items-center gap-2 cursor-pointer ${
              selectedLineId === line.id ? 'border-accent/60' : ''
            }`}
            onClick={() => setSelectedLine(line.id)}
          >
            <span className="text-xs text-neutral-500 w-16 shrink-0 tabular-nums">
              {formatTime(line.startTime, { centis: false })}
            </span>
            <input
              className="flex-1 bg-transparent text-sm outline-none min-w-0"
              value={line.text}
              onChange={(e) => updateLine(line.id, { text: e.target.value })}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button className="btn-icon !p-1" title="Mover para cima" disabled={index === 0} onClick={() => reorderLines(index, index - 1)}>
                <ArrowUp size={14} />
              </button>
              <button className="btn-icon !p-1" title="Mover para baixo" disabled={index === lines.length - 1} onClick={() => reorderLines(index, index + 1)}>
                <ArrowDown size={14} />
              </button>
              <button
                className="btn-icon !p-1"
                title="Dividir a meio"
                onClick={() => splitLine(line.id, Math.floor(line.text.length / 2))}
              >
                <Scissors size={14} />
              </button>
              <button
                className="btn-icon !p-1"
                title="Juntar com a próxima"
                disabled={index === lines.length - 1}
                onClick={() => mergeWithNext(line.id)}
              >
                <GitMerge size={14} />
              </button>
              <button className="btn-icon !p-1" title="Duplicar" onClick={() => duplicateLine(line.id)}>
                <Copy size={14} />
              </button>
              <button className="btn-icon !p-1 hover:text-red-400" title="Remover" onClick={() => removeLine(line.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="btn-secondary flex items-center gap-2" onClick={() => addLine(lines[lines.length - 1]?.id)}>
        <Plus size={16} />
        Adicionar linha
      </button>
    </div>
  );
}
