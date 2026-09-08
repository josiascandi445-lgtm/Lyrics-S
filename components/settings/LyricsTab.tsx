'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { LyricsEditor } from '@/components/lyrics/LyricsEditor';
import { ImportLyricsDialog } from '@/components/lyrics/ImportLyricsDialog';
import { SyncModePanel } from '@/components/lyrics/SyncModePanel';
import { WordSyncPanel } from '@/components/lyrics/WordSyncPanel';

export function LyricsTab() {
  const [showImport, setShowImport] = useState(false);
  const syncModeActive = useProjectStore((s) => s.syncModeActive);
  const setSyncModeActive = useProjectStore((s) => s.setSyncModeActive);
  const selectedLineId = useProjectStore((s) => s.selectedLineId);
  const hasSong = useProjectStore((s) => !!s.project.song.objectUrl);
  const lineCount = useProjectStore((s) => s.project.lyrics.lines.length);

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex items-center gap-2">
        <button className="btn-secondary flex items-center gap-2" onClick={() => setShowImport(true)}>
          <Upload size={16} />
          Importar (TXT/LRC/SRT/JSON)
        </button>
        <button
          className={syncModeActive ? 'btn-primary' : 'btn-secondary'}
          disabled={!hasSong || lineCount === 0}
          onClick={() => setSyncModeActive(!syncModeActive)}
          title={!hasSong ? 'Importa primeiro uma música' : undefined}
        >
          {syncModeActive ? 'Sair do modo de sincronização' : 'Modo de sincronização'}
        </button>
      </div>

      {syncModeActive ? <SyncModePanel /> : <LyricsEditor />}

      {selectedLineId && <WordSyncPanel lineId={selectedLineId} />}

      {showImport && <ImportLyricsDialog onClose={() => setShowImport(false)} />}
    </div>
  );
}
