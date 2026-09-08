'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { FileDropZone } from '@/components/ui/FileDropZone';
import {
  detectFormatFromFileName,
  parseLyricsFile,
  LyricsParseError,
  type LyricsFileFormat,
} from '@/lib/lyrics/parsers';
import { useProjectStore } from '@/stores/projectStore';

interface ImportLyricsDialogProps {
  onClose: () => void;
}

const FORMAT_LABELS: Record<LyricsFileFormat, string> = {
  txt: 'TXT (texto simples)',
  lrc: 'LRC (sincronizado por linha)',
  srt: 'SRT (legendas)',
  json: 'JSON (formato interno)',
};

export function ImportLyricsDialog({ onClose }: ImportLyricsDialogProps) {
  const setLyricsLines = useProjectStore((s) => s.setLyricsLines);
  const existingLines = useProjectStore((s) => s.project.lyrics.lines);
  const [error, setError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<{ file: File; format: LyricsFileFormat } | null>(null);

  async function handleFile(file: File) {
    setError(null);
    const detected = detectFormatFromFileName(file.name);
    if (!detected) {
      setError('Extensão não reconhecida. Usa .txt, .lrc, .srt ou .json.');
      return;
    }
    setPendingFile({ file, format: detected });
  }

  async function confirmImport(replaceExisting: boolean) {
    if (!pendingFile) return;
    try {
      const content = await pendingFile.file.text();
      const parsedLines = parseLyricsFile(content, pendingFile.format);
      setLyricsLines(replaceExisting ? parsedLines : [...existingLines, ...parsedLines]);
      onClose();
    } catch (e) {
      setError(e instanceof LyricsParseError ? e.message : 'Erro inesperado ao importar o ficheiro.');
      setPendingFile(null);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="panel w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Importar letras</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {!pendingFile && (
          <>
            <FileDropZone
              accept=".txt,.lrc,.srt,.json"
              label="Clica ou arrasta um ficheiro"
              hint="Formatos suportados: TXT, LRC, SRT, JSON"
              onFile={handleFile}
            />
            {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
          </>
        )}

        {pendingFile && (
          <div className="space-y-4">
            <p className="text-sm text-neutral-300">
              Ficheiro: <span className="font-medium">{pendingFile.file.name}</span>
              <br />
              Formato detetado: <span className="font-medium">{FORMAT_LABELS[pendingFile.format]}</span>
            </p>
            {existingLines.length > 0 && (
              <p className="text-xs text-amber-400">
                Já existem {existingLines.length} linha(s) no projeto. Escolhe se queres substituir ou adicionar.
              </p>
            )}
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-2">
              {existingLines.length > 0 && (
                <button className="btn-secondary" onClick={() => confirmImport(false)}>
                  Adicionar às existentes
                </button>
              )}
              <button className="btn-primary" onClick={() => confirmImport(true)}>
                {existingLines.length > 0 ? 'Substituir tudo' : 'Importar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
