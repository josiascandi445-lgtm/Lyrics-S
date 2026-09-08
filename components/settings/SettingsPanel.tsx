'use client';

import { Music, Type, Palette, Image as ImageIcon, MonitorPlay } from 'lucide-react';
import { useProjectStore, type EditorTab } from '@/stores/projectStore';
import { MusicTab } from './MusicTab';
import { LyricsTab } from './LyricsTab';
import { VisualTab } from './VisualTab';
import { BackgroundTab } from './BackgroundTab';
import { VideoTab } from './VideoTab';

const TABS: { id: EditorTab; label: string; icon: typeof Music }[] = [
  { id: 'music', label: 'Música', icon: Music },
  { id: 'lyrics', label: 'Letras', icon: Type },
  { id: 'visual', label: 'Visual', icon: Palette },
  { id: 'background', label: 'Background', icon: ImageIcon },
  { id: 'video', label: 'Vídeo', icon: MonitorPlay },
];

interface SettingsPanelProps {
  onSongFileChange: (file: File | null) => void;
  onCoverFileChange: (file: File | null) => void;
}

export function SettingsPanel({ onSongFileChange, onCoverFileChange }: SettingsPanelProps) {
  const activeTab = useProjectStore((s) => s.activeTab);
  const setActiveTab = useProjectStore((s) => s.setActiveTab);

  return (
    <div className="flex h-full min-h-0">
      <nav className="w-40 shrink-0 border-r border-white/5 p-2 flex flex-col gap-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className="tab-btn flex items-center gap-2"
            data-active={activeTab === id}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {activeTab === 'music' && (
          <MusicTab onSongFileChange={onSongFileChange} onCoverFileChange={onCoverFileChange} />
        )}
        {activeTab === 'lyrics' && <LyricsTab />}
        {activeTab === 'visual' && <VisualTab />}
        {activeTab === 'background' && <BackgroundTab />}
        {activeTab === 'video' && <VideoTab />}
      </div>
    </div>
  );
}
