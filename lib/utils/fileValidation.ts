export class FileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileValidationError';
  }
}

/**
 * Nota importante: esta validação NÃO tenta adivinhar o formato do áudio a
 * partir da extensão do nome do ficheiro ou do `file.type` (mime type).
 *
 * Isso foi tentado numa versão anterior e causava falsos negativos: o nome
 * de um ficheiro pode ter pontos, espaços ou outros caracteres antes da
 * extensão (ex.: "Billie Eilish - ocean eyes (Lyrics).mp3"), e sobretudo em
 * telemóvel o `file.type` reportado varia muito consoante a app de onde o
 * ficheiro veio (Google Drive, Ficheiros do iPhone, WhatsApp, etc.) — por
 * vezes vem vazio, por vezes vem um valor genérico como
 * "application/octet-stream", e ficheiros .m4a são por vezes reportados
 * como "video/mp4" porque partilham o mesmo contentor.
 *
 * A única forma 100% fiável de saber se o browser consegue reproduzir um
 * ficheiro de áudio é tentar mesmo carregá-lo no elemento <audio> e ver se
 * dispara o evento "error" — é isso que o EditorShell faz depois de o
 * ficheiro ser aceite aqui. Esta função limita-se a verificar o tamanho.
 */
export function validateAudioFile(file: File): void {
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

/** Mesma lógica que `validateAudioFile` — só tamanho, sem adivinhar formato pela extensão/mime type. */
export function validateImageFile(file: File): void {
  if (file.size === 0) {
    throw new FileValidationError(`A imagem "${file.name}" está vazia ou corrompida.`);
  }
  const MAX_SIZE = 30 * 1024 * 1024; // 30MB é mais do que suficiente para uma capa
  if (file.size > MAX_SIZE) {
    throw new FileValidationError(
      `A imagem "${file.name}" é demasiado grande (${(file.size / 1024 / 1024).toFixed(0)}MB). Máximo recomendado: 30MB.`
    );
  }
}
