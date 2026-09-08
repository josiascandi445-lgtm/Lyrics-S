import type { Project } from '@/types';

export interface ProjectFilePayload {
  formatVersion: 1;
  project: Project;
  media?: {
    songDataUrl?: string;
    songFileName?: string;
    coverDataUrl?: string;
    coverFileName?: string;
  };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function dataUrlToFile(dataUrl: string, fileName: string): File {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header?.match(/data:(.*);base64/);
  const mime = mimeMatch?.[1] ?? 'application/octet-stream';
  const binary = atob(base64 ?? '');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], fileName, { type: mime });
}

/**
 * Exporta o projeto para um ficheiro ".lyricsproject" (JSON).
 *
 * `includeMedia`: se verdadeiro, embebe o áudio e a capa como base64 dentro
 * do próprio ficheiro (secção 37: "se tecnicamente possível, incluir capa e
 * áudio"). Isto aumenta o tamanho do ficheiro em ~33% (overhead do base64) —
 * para músicas muito grandes isso pode tornar o ficheiro pesado; nesse caso
 * a alternativa (documentada no README) é exportar sem media e voltar a
 * anexar manualmente o MP3/imagem depois de importar o projeto.
 */
export async function exportProjectToFile(
  project: Project,
  songFile: File | null,
  coverFile: File | null,
  includeMedia: boolean
): Promise<Blob> {
  const payload: ProjectFilePayload = { formatVersion: 1, project };

  if (includeMedia) {
    payload.media = {};
    if (songFile) {
      payload.media.songDataUrl = await fileToDataUrl(songFile);
      payload.media.songFileName = songFile.name;
    }
    if (coverFile) {
      payload.media.coverDataUrl = await fileToDataUrl(coverFile);
      payload.media.coverFileName = coverFile.name;
    }
  }

  const json = JSON.stringify(payload);
  return new Blob([json], { type: 'application/json' });
}

export async function parseProjectFile(
  file: File
): Promise<{ project: Project; songFile: File | null; coverFile: File | null }> {
  const text = await file.text();
  const payload = JSON.parse(text) as ProjectFilePayload;
  if (!payload.project) {
    throw new Error('Ficheiro de projeto inválido: falta o campo "project".');
  }

  let songFile: File | null = null;
  let coverFile: File | null = null;

  if (payload.media?.songDataUrl && payload.media.songFileName) {
    songFile = dataUrlToFile(payload.media.songDataUrl, payload.media.songFileName);
  }
  if (payload.media?.coverDataUrl && payload.media.coverFileName) {
    coverFile = dataUrlToFile(payload.media.coverDataUrl, payload.media.coverFileName);
  }

  return { project: payload.project, songFile, coverFile };
}
