import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { renderProjectFrame, type CompositorAssets } from '@/lib/render/compositor';
import { ASPECT_RATIOS, type Project } from '@/types';

export type ExportStage =
  | 'idle'
  | 'preparing'
  | 'rendering-frames'
  | 'encoding'
  | 'done'
  | 'cancelled'
  | 'error';

export interface ExportProgress {
  stage: ExportStage;
  /** 0-100 */
  percent: number;
  message: string;
}

export interface ExportOptions {
  project: Project;
  songFile: File;
  assets: CompositorAssets;
  onProgress: (progress: ExportProgress) => void;
}

export class ExportCancelledError extends Error {
  constructor() {
    super('Exportação cancelada pelo utilizador.');
    this.name = 'ExportCancelledError';
  }
}

let ffmpegSingleton: FFmpeg | null = null;

/**
 * Carrega o core do ffmpeg.wasm. O core (ffmpeg-core.js/.wasm, ~30MB) é
 * obtido via CDN (unpkg) e convertido para blob URL — este é o padrão
 * recomendado pela própria ffmpeg.wasm para evitar problemas de CORS/COEP.
 * Requer ligação à internet na primeira utilização (o browser guarda em
 * cache HTTP depois disso). Isto corre no browser do utilizador, não no
 * ambiente onde este código foi escrito.
 */
async function loadFFmpeg(onLog: (msg: string) => void): Promise<FFmpeg> {
  if (ffmpegSingleton) return ffmpegSingleton;

  const ffmpeg = new FFmpeg();
  ffmpeg.on('log', ({ message }) => onLog(message));

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  ffmpegSingleton = ffmpeg;
  return ffmpeg;
}

interface CancelToken {
  cancelled: boolean;
}

const activeCancelTokens = new Set<CancelToken>();

export function cancelAllExports() {
  for (const token of activeCancelTokens) token.cancelled = true;
}

function canvasToPngBytes(canvas: OffscreenCanvas): Promise<Uint8Array> {
  return canvas.convertToBlob({ type: 'image/png' }).then(async (blob) => {
    const buffer = await blob.arrayBuffer();
    return new Uint8Array(buffer);
  });
}

export async function exportProjectToMp4(options: ExportOptions): Promise<Blob> {
  const { project, songFile, assets, onProgress } = options;
  const cancelToken: CancelToken = { cancelled: false };
  activeCancelTokens.add(cancelToken);

  try {
    const duration = project.song.duration;
    if (!duration || duration <= 0) {
      throw new Error('Duração da música desconhecida — não é possível exportar.');
    }

    onProgress({ stage: 'preparing', percent: 0, message: 'A preparar FFmpeg…' });
    const ffmpeg = await loadFFmpeg(() => {});

    if (cancelToken.cancelled) throw new ExportCancelledError();

    const dims = ASPECT_RATIOS[project.video.aspectRatio];
    const fps = project.video.fps;
    const totalFrames = Math.max(1, Math.ceil(duration * fps));

    onProgress({ stage: 'preparing', percent: 5, message: 'A preparar áudio…' });
    const audioExt = songFile.name.split('.').pop()?.toLowerCase() || 'mp3';
    await ffmpeg.writeFile(`audio.${audioExt}`, await fetchFile(songFile));

    // --- Renderização determinística frame a frame (secção 32, passo 5) ---
    const canvas = new OffscreenCanvas(dims.width, dims.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Não foi possível criar o contexto de canvas para renderização.');

    const framePad = String(totalFrames).length;
    for (let i = 0; i < totalFrames; i++) {
      if (cancelToken.cancelled) throw new ExportCancelledError();

      const t = i / fps;
      renderProjectFrame(ctx, project, assets, t, dims.width, dims.height);
      const bytes = await canvasToPngBytes(canvas);
      const frameName = `frame_${String(i).padStart(Math.max(framePad, 6), '0')}.png`;
      await ffmpeg.writeFile(frameName, bytes);

      if (i % 5 === 0 || i === totalFrames - 1) {
        const percent = Math.round((i / totalFrames) * 70); // 0-70% = render de frames
        onProgress({
          stage: 'rendering-frames',
          percent,
          message: `A renderizar frames… (${i + 1}/${totalFrames})`,
        });
      }
    }

    if (cancelToken.cancelled) throw new ExportCancelledError();

    // --- Codificação / mux (secção 32, passos 6-7) ---
    onProgress({ stage: 'encoding', percent: 72, message: 'A codificar vídeo (H.264/AAC)…' });

    ffmpeg.on('progress', ({ progress }) => {
      if (cancelToken.cancelled) return;
      const percent = 72 + Math.round(Math.min(Math.max(progress, 0), 1) * 26);
      onProgress({ stage: 'encoding', percent, message: 'A codificar vídeo (H.264/AAC)…' });
    });

    const framePattern = `frame_%0${Math.max(framePad, 6)}d.png`;
    await ffmpeg.exec([
      '-framerate', String(fps),
      '-i', framePattern,
      '-i', `audio.${audioExt}`,
      '-map', '0:v:0',
      '-map', '1:a:0',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-b:v', `${project.export.videoBitrateKbps}k`,
      '-c:a', 'aac',
      '-b:a', `${project.export.audioBitrateKbps}k`,
      '-shortest',
      '-movflags', '+faststart',
      'output.mp4',
    ]);

    if (cancelToken.cancelled) throw new ExportCancelledError();

    onProgress({ stage: 'encoding', percent: 99, message: 'A finalizar…' });
    const outputData = await ffmpeg.readFile('output.mp4');
    // Copia para um Uint8Array "normal" (backed por ArrayBuffer, não
    // SharedArrayBuffer/ArrayBufferLike) — necessário para satisfazer o tipo
    // BlobPart em versões recentes do TypeScript/lib.dom.
    const outputBytes = new Uint8Array(outputData as Uint8Array);

    // limpeza do filesystem virtual do ffmpeg para libertar memória
    for (let i = 0; i < totalFrames; i++) {
      const frameName = `frame_${String(i).padStart(Math.max(framePad, 6), '0')}.png`;
      try {
        await ffmpeg.deleteFile(frameName);
      } catch {
        /* ignora */
      }
    }
    try {
      await ffmpeg.deleteFile(`audio.${audioExt}`);
      await ffmpeg.deleteFile('output.mp4');
    } catch {
      /* ignora */
    }

    onProgress({ stage: 'done', percent: 100, message: 'Exportação concluída.' });
    return new Blob([outputBytes], { type: 'video/mp4' });
  } catch (error) {
    if (error instanceof ExportCancelledError) {
      onProgress({ stage: 'cancelled', percent: 0, message: 'Exportação cancelada.' });
    } else {
      onProgress({
        stage: 'error',
        percent: 0,
        message: error instanceof Error ? error.message : 'Erro desconhecido na exportação.',
      });
    }
    throw error;
  } finally {
    activeCancelTokens.delete(cancelToken);
  }
}
