'use client';

import { useCallback, useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

interface FileDropZoneProps {
  accept: string;
  label: string;
  hint?: string;
  onFile: (file: File) => void;
  compact?: boolean;
}

export function FileDropZone({ accept, label, hint, onFile, compact }: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  return (
    <div
      className={`rounded-xl border-2 border-dashed transition-colors flex flex-col items-center justify-center text-center cursor-pointer ${
        dragging ? 'border-accent bg-accent/5' : 'border-white/10 hover:border-white/20'
      } ${compact ? 'p-4' : 'p-8'}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <UploadCloud size={compact ? 20 : 28} className="text-neutral-500 mb-2" />
      <p className="text-sm font-medium text-neutral-300">{label}</p>
      {hint && <p className="text-xs text-neutral-500 mt-1">{hint}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
