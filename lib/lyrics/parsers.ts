import { createId } from '@/lib/utils/id';
import type { LyricLine } from '@/types';

export class LyricsParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LyricsParseError';
  }
}

function makeLine(text: string, startTime: number, endTime: number): LyricLine {
  return {
    id: createId('line'),
    text: text.trim(),
    startTime,
    endTime,
    words: [],
  };
}

/**
 * TXT: uma linha de texto por linha. Sem timing — o utilizador sincroniza
 * depois no modo de sincronização. Cada linha recebe um timing provisório
 * sequencial de 3s para que a ordem/duração inicial faça sentido na timeline
 * antes de ser ajustada manualmente.
 */
export function parseTXT(content: string): LyricLine[] {
  const rawLines = content.replace(/\r\n/g, '\n').split('\n');
  const lines = rawLines.map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) {
    throw new LyricsParseError('O ficheiro TXT não contém nenhuma linha de texto.');
  }
  const PROVISIONAL_DURATION = 3;
  return lines.map((text, i) =>
    makeLine(text, i * PROVISIONAL_DURATION, (i + 1) * PROVISIONAL_DURATION)
  );
}

/** Converte "mm:ss.xx" ou "mm:ss:xx" ou "h:mm:ss.xx" (LRC) para segundos. */
function lrcTimeToSeconds(raw: string): number {
  // formatos aceites: mm:ss.xx | mm:ss:xx | mm:ss
  const match = raw.match(/^(\d+):(\d{1,2})([.:](\d{1,3}))?$/);
  if (!match) throw new LyricsParseError(`Timestamp LRC inválido: "${raw}"`);
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  const fracRaw = match[4] ?? '0';
  // normaliza fração para centésimos/milésimos consistentes
  const frac = Number(fracRaw.padEnd(3, '0').slice(0, 3)) / 1000;
  return minutes * 60 + seconds + frac;
}

/**
 * LRC: [mm:ss.xx]texto — pode haver várias tags de tempo na mesma linha
 * (repetição do refrão). O endTime de cada linha é o startTime da linha
 * seguinte (ou +4s para a última).
 */
export function parseLRC(content: string): LyricLine[] {
  const rawLines = content.replace(/\r\n/g, '\n').split('\n');
  const timeTagRegex = /\[(\d+:\d{1,2}(?:[.:]\d{1,3})?)\]/g;

  type Entry = { time: number; text: string };
  const entries: Entry[] = [];

  for (const rawLine of rawLines) {
    const line = rawLine.trim();
    if (!line) continue;
    // ignora metadata tags como [ar:Artist] [ti:Title] [al:Album] [00:00.00]
    const tags = Array.from(line.matchAll(timeTagRegex));
    if (tags.length === 0) continue; // linha sem timestamp (metadata ou lixo) — ignorada
    const text = line.replace(timeTagRegex, '').trim();
    if (!text) continue;
    for (const tag of tags) {
      const timeStr = tag[1];
      if (!timeStr) continue;
      try {
        const time = lrcTimeToSeconds(timeStr);
        entries.push({ time, text });
      } catch {
        // timestamp malformado nesta tag específica — ignora só esta tag
        continue;
      }
    }
  }

  if (entries.length === 0) {
    throw new LyricsParseError(
      'Não foi possível encontrar nenhuma linha com timestamp válido no ficheiro LRC.'
    );
  }

  entries.sort((a, b) => a.time - b.time);

  const lines: LyricLine[] = [];
  for (let i = 0; i < entries.length; i++) {
    const current = entries[i]!;
    const next = entries[i + 1];
    const endTime = next ? next.time : current.time + 4;
    lines.push(makeLine(current.text, current.time, Math.max(endTime, current.time + 0.2)));
  }
  return lines;
}

function srtTimeToSeconds(raw: string): number {
  // formato: HH:MM:SS,mmm  (a spec também aceita '.' em vez de ',')
  const match = raw.match(/^(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})$/);
  if (!match) throw new LyricsParseError(`Timestamp SRT inválido: "${raw}"`);
  const [, h, m, s, ms] = match;
  return Number(h) * 3600 + Number(m) * 60 + Number(s) + Number((ms ?? '0').padEnd(3, '0')) / 1000;
}

/**
 * SRT: blocos separados por linha em branco:
 * 1
 * 00:00:12,500 --> 00:00:16,200
 * Texto (pode ter várias linhas, juntamos com espaço)
 */
export function parseSRT(content: string): LyricLine[] {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\uFEFF/g, '');
  const blocks = normalized.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);

  if (blocks.length === 0) {
    throw new LyricsParseError('O ficheiro SRT está vazio ou mal formatado.');
  }

  const lines: LyricLine[] = [];
  const arrowRegex = /(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})/;

  for (const block of blocks) {
    const blockLines = block.split('\n').map((l) => l.trim());
    const arrowLineIndex = blockLines.findIndex((l) => arrowRegex.test(l));
    if (arrowLineIndex === -1) continue; // bloco sem timing válido, ignora
    const arrowMatch = blockLines[arrowLineIndex]!.match(arrowRegex)!;
    let startTime: number;
    let endTime: number;
    try {
      startTime = srtTimeToSeconds(arrowMatch[1]!);
      endTime = srtTimeToSeconds(arrowMatch[2]!);
    } catch {
      continue;
    }
    const textLines = blockLines.slice(arrowLineIndex + 1).filter(Boolean);
    const text = textLines.join(' ').trim();
    if (!text) continue;
    if (endTime <= startTime) endTime = startTime + 0.5;
    lines.push(makeLine(text, startTime, endTime));
  }

  if (lines.length === 0) {
    throw new LyricsParseError('Nenhum bloco válido (texto + timestamps) foi encontrado no SRT.');
  }

  lines.sort((a, b) => a.startTime - b.startTime);
  return lines;
}

/**
 * JSON: formato interno (array de LyricLine, ou objeto { lines: LyricLine[] }).
 * Aceita também um formato simplificado [{ text, start, end, words? }] para
 * facilitar integrações externas.
 */
export function parseJSONLyrics(content: string): LyricLine[] {
  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch (e) {
    throw new LyricsParseError('JSON inválido: não foi possível fazer parse do ficheiro.');
  }

  const rawLines: unknown[] = Array.isArray(data)
    ? data
    : typeof data === 'object' && data !== null && Array.isArray((data as any).lines)
    ? (data as any).lines
    : [];

  if (rawLines.length === 0) {
    throw new LyricsParseError('O JSON não contém nenhuma linha de letras reconhecível.');
  }

  return rawLines.map((raw, i) => {
    const r = raw as Record<string, unknown>;
    const text = String(r.text ?? '').trim();
    const startTime = Number(r.startTime ?? r.start ?? 0);
    const endTime = Number(r.endTime ?? r.end ?? startTime + 3);
    if (!text) {
      throw new LyricsParseError(`Linha ${i + 1} do JSON não tem campo "text" válido.`);
    }
    const words = Array.isArray(r.words)
      ? (r.words as unknown[]).map((w) => {
          const wr = w as Record<string, unknown>;
          return {
            id: createId('word'),
            text: String(wr.text ?? '').trim(),
            startTime: Number(wr.startTime ?? wr.start ?? startTime),
            endTime: Number(wr.endTime ?? wr.end ?? endTime),
          };
        })
      : [];
    return {
      id: createId('line'),
      text,
      startTime,
      endTime: Math.max(endTime, startTime + 0.05),
      words,
    };
  });
}

export type LyricsFileFormat = 'txt' | 'lrc' | 'srt' | 'json';

export function detectFormatFromFileName(fileName: string): LyricsFileFormat | null {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'txt') return 'txt';
  if (ext === 'lrc') return 'lrc';
  if (ext === 'srt') return 'srt';
  if (ext === 'json') return 'json';
  return null;
}

export function parseLyricsFile(content: string, format: LyricsFileFormat): LyricLine[] {
  switch (format) {
    case 'txt':
      return parseTXT(content);
    case 'lrc':
      return parseLRC(content);
    case 'srt':
      return parseSRT(content);
    case 'json':
      return parseJSONLyrics(content);
    default:
      throw new LyricsParseError(`Formato de letras não suportado: ${format}`);
  }
}
