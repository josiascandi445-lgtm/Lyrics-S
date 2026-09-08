'use client';

import { useRef, useState } from 'react';
import { FolderOpen, Save, Download, Music2 } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { exportProjectToFile, parseProjectFile } from '@/lib/project/serialization';
import { ExportDialog } from '@/components/export/ExportDialog';

interface TopBarProps {
  songFile: File | null;
  coverFile: File | null;
  onProjectImported: (songFile: File | null, coverFile: File | null) => void;
}

export function TopBar({ songFile, coverFile, onProjectImported }: TopBarProps) {
  const project = useProjectStore((s) => s.project);
  const renameProject = useProjectStore((s) => s.renameProject);
  const loadProject = useProjectStore((s) => s.loadProject);
  const [showExport, setShowExport] = useState(false);
  const [busy, setBusy] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  async function handleSaveProject(includeMedia: boolean) {
    setBusy(true);
    try {
      const blob = await exportProjectToFile(project, songFile, coverFile, includeMedia);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name || 'projeto'}.lyricsproject`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  async function handleImportProject(file: File) {
    setBusy(true);
    try {
      const { project: imported, songFile: importedSong, coverFile: importedCover } =
        await parseProjectFile(file);
      const songUrl = importedSong ? URL.createObjectURL(importedSong) : null;
      const coverUrl = importedCover ? URL.createObjectURL(importedCover) : null;
      loadProject({
        ...imported,
        song: { ...imported.song, objectUrl: songUrl },
        cover: { ...imported.cover, objectUrl: coverUrl },
      });
      onProjectImported(importedSong, importedCover);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Não foi possível importar o projeto.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <header className="h-14 shrink-0 border-b border-white/5 flex items-center justify-between px-4 gap-4 bg-base-900">
      <div className="flex items-center gap-2 min-w-0">
        <Music2 size={18} className="text-accent shrink-0" />
        <input
          value={project.name}
          onChange={(e) => renameProject(e.target.value)}
          className="bg-transparent text-sm font-semibold outline-none focus:bg-white/5 rounded px-2 py-1 min-w-0 truncate"
        />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <input
          ref={importInputRef}
          type="file"
          accept=".lyricsproject,application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleImportProject(file);
            e.target.value = '';
          }}
        />
        <button className="btn-icon" title="Abrir projeto" onClick={() => importInputRef.current?.click()}>
          <FolderOpen size={18} />
        </button>
        <button
          className="btn-icon"
          title="Guardar projeto (com media)"
          disabled={busy}
          onClick={() => handleSaveProject(true)}
        >
          <Save size={18} />
        </button>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => setShowExport(true)}
          disabled={!project.song.objectUrl || project.lyrics.lines.length === 0}
        >
          <Download size={16} />
          Exportar MP4
        </button>
      </div>

      {showExport && (
        <ExportDialog songFile={songFile} onClose={() => setShowExport(false)} />
      )}
    </header>
  );
}
