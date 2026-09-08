export class FileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileValidationError';
  }
}

const AUDIO_EXTENSIONS = ['mp3', 'm4a'];
// Nota: ficheiros .m4a partilham o contentor com .mp4, por isso alguns
// sistemas/pickers de ficheiros (Android, Google Drive, iCloud, etc.)
// reportam o mime type como "video/mp4" ou deixam o "type" vazio. Por isso
// a validação abaixo aceita também qualquer mime type que comece por
// "audio/", e não bloqueia apenas por causa do mime type se a extensão
// bater certo (ou vice-versa).
const AUDIO_MIME_HINTS = [
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'audio/mp4a-latm',
  'audio/aac',
  'audio/x-aac',
  'video/mp4', // comum para .m4a em alguns sistemas/pickers
];

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const IMAGE_MIME_HINTS = ['image/jpeg', 'image/png', 'image/webp'];

function getExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase().trim() ?? '';
}

export function validateAudioFile(file: File): void {
  const ext = getExtension(file.name);
  const type = file.type.toLowerCase();
  const extOk = AUDIO_EXTENSIONS.includes(ext);
  const mimeOk = AUDIO_MIME_HINTS.includes(type) || type.startsWith('audio/');
  // Alguns pickers de ficheiros (sobretudo em telemóvel) não preenchem o
  // "type" nem dão um nome de ficheiro com extensão fiável. Nesse caso
  // (type vazio e sem extensão reconhecida) deixamos passar em vez de
  // bloquear — é preferível arriscar um ficheiro inválido (que depois falha
  // de forma clara ao tentar tocar) do que impedir um MP3/M4A válido.
  const noSignalAtAll = type === '' && ext === '';
  if (!extOk && !mimeOk && !noSignalAtAll) {
    throw new FileValidationError(
      `Formato de áudio não reconhecido ("${file.name}"${file.type ? `, tipo: ${file.type}` : ''}). Usa um ficheiro MP3 ou M4A.`
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
  const type = file.type.toLowerCase();
  const extOk = IMAGE_EXTENSIONS.includes(ext);
  const mimeOk = IMAGE_MIME_HINTS.includes(type) || type.startsWith('image/');
  const noSignalAtAll = type === '' && ext === '';
  if (!extOk && !mimeOk && !noSignalAtAll) {
    throw new FileValidationError(
      `Formato de imagem não reconhecido ("${file.name}"${file.type ? `, tipo: ${file.type}` : ''}). Usa JPG, PNG ou WebP.`
    );
  }
  if (file.size === 0) {
    throw new FileValidationError(`A imagem "${file.name}" está vazia ou corrompida.`);
  }
}
