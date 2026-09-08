export class FileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileValidationError';
  }
}

const AUDIO_EXTENSIONS = ['mp3', 'm4a'];
const AUDIO_MIME_HINTS = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/m4a'];

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const IMAGE_MIME_HINTS = ['image/jpeg', 'image/png', 'image/webp'];

function getExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? '';
}

export function validateAudioFile(file: File): void {
  const ext = getExtension(file.name);
  const mimeOk = AUDIO_MIME_HINTS.some((m) => file.type === m);
  if (!AUDIO_EXTENSIONS.includes(ext) && !mimeOk) {
    throw new FileValidationError(
      `Formato de áudio não suportado ("${file.name}"). Usa um ficheiro MP3 ou M4A.`
    );
  }
  if (file.size === 0) {
    throw new FileValidationError(`O ficheiro "${file.name}" está vazio ou corrompido.`);
  }
  const MAX_SIZE = 200 * 1024 * 1024; // 200MB — limite prático para processamento local
  if (file.size > MAX_SIZE) {
    throw new FileValidationError(
      `O ficheiro "${file.name}" é demasiado grande (${(file.size / 1024 / 1024).toFixed(
        0
      )}MB). Máximo recomendado: 200MB.`
    );
  }
}

export function validateImageFile(file: File): void {
  const ext = getExtension(file.name);
  const mimeOk = IMAGE_MIME_HINTS.some((m) => file.type === m);
  if (!IMAGE_EXTENSIONS.includes(ext) && !mimeOk) {
    throw new FileValidationError(
      `Formato de imagem não suportado ("${file.name}"). Usa JPG, PNG ou WebP.`
    );
  }
  if (file.size === 0) {
    throw new FileValidationError(`A imagem "${file.name}" está vazia ou corrompida.`);
  }
}
