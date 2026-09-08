import type { LyricLine, ValidationIssue } from '@/types';

/**
 * Valida os timings das linhas/palavras. Não lança — devolve uma lista de
 * problemas para serem mostrados na UI (secção 41: mensagens úteis, não
 * bloquear o utilizador desnecessariamente com exceções).
 */
export function validateLyrics(lines: LyricLine[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  lines.forEach((line, index) => {
    if (line.startTime < 0) {
      issues.push({
        severity: 'error',
        message: `Linha ${index + 1} ("${truncate(line.text)}") tem tempo de início negativo.`,
        lineId: line.id,
      });
    }
    if (line.endTime <= line.startTime) {
      issues.push({
        severity: 'error',
        message: `Linha ${index + 1} ("${truncate(line.text)}") termina antes (ou ao mesmo tempo) de começar.`,
        lineId: line.id,
      });
    }
    const next = lines[index + 1];
    if (next && line.endTime > next.startTime + 0.001) {
      issues.push({
        severity: 'warning',
        message: `Linha ${index + 1} sobrepõe-se à linha ${index + 2} (fim ${line.endTime.toFixed(
          2
        )}s > início ${next.startTime.toFixed(2)}s).`,
        lineId: line.id,
      });
    }

    line.words.forEach((word, wIndex) => {
      if (word.startTime < line.startTime - 0.01 || word.endTime > line.endTime + 0.01) {
        issues.push({
          severity: 'warning',
          message: `Palavra "${word.text}" (linha ${index + 1}) está fora do intervalo da linha.`,
          lineId: line.id,
          wordId: word.id,
        });
      }
      if (word.endTime <= word.startTime) {
        issues.push({
          severity: 'error',
          message: `Palavra "${word.text}" (linha ${index + 1}) termina antes de começar.`,
          lineId: line.id,
          wordId: word.id,
        });
      }
      const nextWord = line.words[wIndex + 1];
      if (nextWord && word.endTime > nextWord.startTime + 0.001) {
        issues.push({
          severity: 'warning',
          message: `Palavras sobrepostas na linha ${index + 1}: "${word.text}" e "${nextWord.text}".`,
          lineId: line.id,
        });
      }
    });
  });

  return issues;
}

function truncate(text: string, max = 30): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
