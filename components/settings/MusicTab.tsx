'use client';

import { X, RefreshCw } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { FileDropZone } from '@/components/ui/FileDropZone';
import { validateAudioFile, validateImageFile, FileValidationError } from '@/lib/utils/fileValidation';
import { formatTime } from '@/lib/utils/time';

interface MusicTabProps {
  onSongFileChange: (file: File | null) => void;
  onCoverFileChange: (file: File | null) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function MusicTab({ onSongFileChange, onCoverFileChange }: MusicTabProps) {
  const project = useProjectStore((s) => s.project);
  const setSong = useProjectStore((s) => s.setSong);
  const setCover = useProjectStore((s) => s.setCover);

  function handleAudioFile(file: File) {
    try {
      validateAudioFile(file);
    } catch (e) {
      alert(e instanceof FileValidationError ? e.message : 'Erro ao validar o áudio.');
      return;
    }
    if (project.song.objectUrl) URL.revokeObjectURL(project.song.objectUrl);
    const objectUrl = URL.createObjectURL(file);
    setSong({
      fileName: file.name,
      mimeType: file.type || null,
      fileSize: file.size,
      objectUrl,
      duration: null,
    });
    onSongFileChange(file);
  }

  function handleImageFile(file: File) {
    try {
      validateImageFile(file);
    } catch (e) {
      alert(e instanceof FileValidationError ? e.message : 'Erro ao validar a imagem.');
      return;
    }
    if (project.cover.objectUrl) URL.revokeObjectURL(project.cover.objectUrl);
    const objectUrl = URL.createObjectURL(file);
    setCover({ fileName: file.name, mimeType: file.type || null, objectUrl });
    onCoverFileChange(file);
  }

  function removeAudio() {
    if (project.song.objectUrl) URL.revokeObjectURL(project.song.objectUrl);
    setSong({ fileName: null, mimeType: null, fileSize: null, objectUrl: null, duration: null });
    onSongFileChange(null);
  }

  function removeCover() {
    if (project.cover.objectUrl) URL.revokeObjectURL(project.cover.objectUrl);
    setCover({ fileName: null, mimeType: null, objectUrl: null });
    onCoverFileChange(null);
  }

  return (
    <div className="space-y-8 max-w-md">
      <section>
        <h3 className="text-sm font-semibold mb-3">Áudio</h3>
        {!project.song.objectUrl ? (
          <FileDropZone
            accept=".mp3,.m4a,audio/mpeg,audio/mp4"
            label="Clica ou arrasta um ficheiro MP3/M4A"
            hint="Máx. 200MB"
            onFile={handleAudioFile}
          />
        ) : (
          <div className="panel p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{project.song.fileName}</p>
              <p className="text-xs text-neutral-500">
                {project.song.duration ? formatTime(project.song.duration, { centis: false }) : '—'} ·{' '}
                {project.song.mimeType ?? 'formato desconhecido'} ·{' '}
                {project.song.fileSize ? formatBytes(project.song.fileSize) : '—'}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <label className="btn-icon cursor-pointer">
                <RefreshCw size={16} />
                <input
                  type="file"
                  accept=".mp3,.m4a,audio/mpeg,audio/mp4"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleAudioFile(f);
                    e.target.value = '';
                  }}
                />
              </label>
              <button className="btn-icon" onClick={removeAudio}>
                <X size={16} />
              </button>
            </div>
          </div>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-3">Capa</h3>
        {!project.cover.objectUrl ? (
          <FileDropZone
            accept=".jpg,.jpeg,.png,.webp,image/*"
            label="Clica ou arrasta uma imagem"
            hint="JPG, PNG ou WebP"
            onFile={handleImageFile}
          />
        ) : (
          <div className="space-y-3">
            <div className="panel p-3 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={project.cover.objectUrl}
                alt="Capa"
                className="w-16 h-16 object-cover rounded-lg"
                style={{ filter: `blur(${project.cover.blur}px) brightness(${project.cover.brightness})` }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{project.cover.fileName}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <label className="btn-icon cursor-pointer">
                  <RefreshCw size={16} />
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImageFile(f);
                      e.target.value = '';
                    }}
                  />
                </label>
                <button className="btn-icon" onClick={removeCover}>
                  <X size={16} />
                </button>
              </div>
            </div>

            <SliderField
              label="Zoom"
              min={1}
              max={2}
              step={0.01}
              value={project.cover.zoom}
              onChange={(v) => setCover({ zoom: v })}
            />
            <SliderField
              label="Blur"
              min={0}
              max={30}
              step={1}
              value={project.cover.blur}
              onChange={(v) => setCover({ blur: v })}
            />
            <SliderField
              label="Brilho"
              min={0.3}
              max={1.5}
              step={0.01}
              value={project.cover.brightness}
              onChange={(v) => setCover({ brightness: v })}
            />
          </div>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-3">Metadata</h3>
        <div className="space-y-3">
          <div>
            <label className="field-label">Título</label>
            <input
              className="w-full bg-base-850 border border-white/10 rounded-lg px-3 py-2 text-sm"
              value={project.song.title}
              onChange={(e) => setSong({ title: e.target.value })}
              placeholder="Ocean Eyes"
            />
          </div>
          <div>
            <label className="field-label">Artista</label>
            <input
              className="w-full bg-base-850 border border-white/10 rounded-lg px-3 py-2 text-sm"
              value={project.song.artist}
              onChange={(e) => setSong({ artist: e.target.value })}
              placeholder="Billie Eilish"
            />
          </div>
          <div>
            <label className="field-label">Álbum (opcional)</label>
            <input
              className="w-full bg-base-850 border border-white/10 rounded-lg px-3 py-2 text-sm"
              value={project.song.album ?? ''}
              onChange={(e) => setSong({ album: e.target.value })}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function SliderField({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="field-label !mb-0">{label}</label>
        <span className="text-xs text-neutral-500">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}
