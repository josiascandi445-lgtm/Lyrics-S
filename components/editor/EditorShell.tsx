'use client';

import { useEffect, useRef, useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useAttachAudioElement } from '@/hooks/useAudioClock';
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts';
import { generateWaveform } from '@/lib/audio/waveform';
import { TopBar } from './TopBar';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { PreviewCanvas } from '@/components/preview/PreviewCanvas';
import { PlaybackControls } from '@/components/player/PlaybackControls';
import { Timeline } from '@/components/timeline/Timeline';

export function EditorShell() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const project = useProjectStore((s) => s.project);
  const setSong = useProjectStore((s) => s.setSong);
  const setWaveform = useProjectStore((s) => s.setWaveform);

  const [songFile, setSongFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  useAttachAudioElement(audioRef);
  useGlobalShortcuts();

  // gera a waveform sempre que um novo ficheiro de áudio é carregado
  useEffect(() => {
    if (!songFile) {
      setWaveform(null);
      return;
    }
    let cancelled = false;
    generateWaveform(songFile)
      .then((wf) => {
        if (!cancelled) setWaveform(wf);
      })
      .catch(() => {
        if (!cancelled) setWaveform(null);
      });
    return () => {
      cancelled = true;
    };
  }, [songFile, setWaveform]);

  function handleLoadedMetadata() {
    const el = audioRef.current;
    if (el && Number.isFinite(el.duration)) {
      setSong({ duration: el.duration });
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <TopBar
        songFile={songFile}
        coverFile={coverFile}
        onProjectImported={(s, c) => {
          setSongFile(s);
          setCoverFile(c);
        }}
      />

      <div className="flex-1 min-h-0 flex">
        <div className="w-[380px] shrink-0 border-r border-white/5 min-h-0">
          <SettingsPanel onSongFileChange={setSongFile} onCoverFileChange={setCoverFile} />
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          <div ref={previewContainerRef} className="flex-1 min-h-0 p-4">
            <PreviewCanvas />
          </div>
          <PlaybackControls previewContainerRef={previewContainerRef} />
        </div>
      </div>

      <div className="h-40 shrink-0 border-t border-white/5">
        <Timeline />
      </div>

      {project.song.objectUrl && (
        <audio
          ref={audioRef}
          src={project.song.objectUrl}
          onLoadedMetadata={handleLoadedMetadata}
          className="hidden"
        />
      )}
    </div>
  );
}
