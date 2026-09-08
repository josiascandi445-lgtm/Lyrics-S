'use client';

import { useState } from 'react';
import { X, Download, XCircle } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useProjectAssets } from '@/hooks/useProjectAssets';
import {
  exportProjectToMp4,
  cancelAllExports,
  type ExportProgress,
} from '@/lib/export/exportEngine';
import { ASPECT_RATIOS } from '@/types';

interface ExportDialogProps {
  songFile: File | null;
  onClose: () => void;
}

export function ExportDialog({ songFile, onClose }: ExportDialogProps) {
  const project = useProjectStore((s) => s.project);
  const assets = useProjectAssets(project.cover.objectUrl);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const dims = ASPECT_RATIOS[project.video.aspectRatio];
  const isRunning =
    progress !== null && !['done', 'error', 'cancelled', 'idle'].includes(progress.stage);

  async function handleExport() {
    if (!songFile) {
      setErrorMsg('É preciso ter um ficheiro de áudio carregado para exportar.');
      return;
    }
    setErrorMsg(null);
    setResultBlob(null);
    try {
      const blob = await exportProjectToMp4({
        project,
        songFile,
        assets,
        onProgress: setProgress,
      });
      setResultBlob(blob);
    } catch (e) {
      if (!(e instanceof Error) || e.name !== 'ExportCancelledError') {
        setErrorMsg(e instanceof Error ? e.message : 'Erro desconhecido ao exportar.');
      }
    }
  }

  function handleDownload() {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name || 'lyrics-video'}.mp4`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="panel w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Exportar MP4</h2>
          <button className="btn-icon" onClick={onClose} disabled={isRunning}>
            <X size={18} />
          </button>
        </div>

        <div className="text-sm text-neutral-400 space-y-1">
          <p>
            Resolução: <span className="text-neutral-200">{dims.width}×{dims.height}</span> ({dims.label})
          </p>
          <p>
            FPS: <span className="text-neutral-200">{project.video.fps}</span>
          </p>
          <p>
            Duração: <span className="text-neutral-200">{project.song.duration?.toFixed(1) ?? '—'}s</span>
          </p>
        </div>

        {!songFile && (
          <p className="text-sm text-amber-400">
            Nenhum ficheiro de áudio em memória. Volta a carregar o MP3/M4A no separador "Música" antes de exportar
            (isto acontece por exemplo depois de importares um projeto sem media incluído).
          </p>
        )}

        {progress && (
          <div className="space-y-2">
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <p className="text-xs text-neutral-400">{progress.message}</p>
          </div>
        )}

        {errorMsg && <p className="text-sm text-red-400">{errorMsg}</p>}

        <div className="flex items-center gap-2">
          {!isRunning && !resultBlob && (
            <button className="btn-primary flex items-center gap-2" onClick={handleExport} disabled={!songFile}>
              <Download size={16} />
              Iniciar exportação
            </button>
          )}
          {isRunning && (
            <button
              className="btn-secondary flex items-center gap-2"
              onClick={() => cancelAllExports()}
            >
              <XCircle size={16} />
              Cancelar
            </button>
          )}
          {resultBlob && (
            <button className="btn-primary flex items-center gap-2" onClick={handleDownload}>
              <Download size={16} />
              Descarregar MP4
            </button>
          )}
        </div>

        <p className="text-[11px] text-neutral-600 leading-relaxed">
          A primeira exportação de cada sessão descarrega o motor ffmpeg.wasm (~30MB) a partir de um CDN — é
          necessária ligação à internet nessa altura. A exportação corre inteiramente no teu computador; nenhum
          ficheiro é enviado para um servidor.
        </p>
      </div>
    </div>
  );
}
