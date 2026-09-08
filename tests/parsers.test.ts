import { describe, expect, it } from 'vitest';
import { parseTXT, parseLRC, parseSRT, parseJSONLyrics, LyricsParseError } from '@/lib/lyrics/parsers';

describe('parseTXT', () => {
  it('cria uma linha por linha de texto não vazia', () => {
    const lines = parseTXT('Primeira linha\n\nSegunda linha\nTerceira linha');
    expect(lines).toHaveLength(3);
    expect(lines[0]!.text).toBe('Primeira linha');
    expect(lines[1]!.startTime).toBeGreaterThan(lines[0]!.startTime);
  });

  it('lança erro para conteúdo vazio', () => {
    expect(() => parseTXT('   \n  ')).toThrow(LyricsParseError);
  });
});

describe('parseLRC', () => {
  it('faz parse de timestamps e ordena por tempo', () => {
    const content = '[00:16.20]Segunda linha\n[00:12.50]Primeira linha';
    const lines = parseLRC(content);
    expect(lines).toHaveLength(2);
    expect(lines[0]!.text).toBe('Primeira linha');
    expect(lines[0]!.startTime).toBeCloseTo(12.5, 2);
    expect(lines[1]!.startTime).toBeCloseTo(16.2, 2);
  });

  it('usa o início da próxima linha como fim da anterior', () => {
    const content = '[00:00.00]A\n[00:05.00]B\n[00:10.00]C';
    const lines = parseLRC(content);
    expect(lines[0]!.endTime).toBeCloseTo(5, 2);
    expect(lines[1]!.endTime).toBeCloseTo(10, 2);
  });

  it('ignora linhas de metadata sem timestamp', () => {
    const content = '[ar:Artist]\n[ti:Title]\n[00:01.00]Letra';
    const lines = parseLRC(content);
    expect(lines).toHaveLength(1);
  });

  it('lança erro quando não há nenhum timestamp válido', () => {
    expect(() => parseLRC('sem timestamps aqui')).toThrow(LyricsParseError);
  });
});

describe('parseSRT', () => {
  it('faz parse de blocos com timing e texto', () => {
    const content = [
      '1',
      '00:00:12,500 --> 00:00:16,200',
      'Primeira linha',
      '',
      '2',
      '00:00:16,200 --> 00:00:20,000',
      'Segunda linha',
    ].join('\n');
    const lines = parseSRT(content);
    expect(lines).toHaveLength(2);
    expect(lines[0]!.startTime).toBeCloseTo(12.5, 2);
    expect(lines[0]!.endTime).toBeCloseTo(16.2, 2);
    expect(lines[1]!.text).toBe('Segunda linha');
  });

  it('junta múltiplas linhas de texto num único bloco', () => {
    const content = ['1', '00:00:00,000 --> 00:00:02,000', 'Linha A', 'Linha B'].join('\n');
    const lines = parseSRT(content);
    expect(lines[0]!.text).toBe('Linha A Linha B');
  });

  it('lança erro para conteúdo sem blocos válidos', () => {
    expect(() => parseSRT('lixo sem estrutura nenhuma')).toThrow(LyricsParseError);
  });
});

describe('parseJSONLyrics', () => {
  it('aceita um array simples de linhas', () => {
    const json = JSON.stringify([
      { text: 'Linha 1', start: 0, end: 3 },
      { text: 'Linha 2', start: 3, end: 6 },
    ]);
    const lines = parseJSONLyrics(json);
    expect(lines).toHaveLength(2);
    expect(lines[0]!.text).toBe('Linha 1');
  });

  it('aceita palavras aninhadas', () => {
    const json = JSON.stringify([
      {
        text: 'I love this song',
        start: 0,
        end: 4,
        words: [
          { text: 'I', start: 0, end: 1 },
          { text: 'love', start: 1, end: 2 },
        ],
      },
    ]);
    const lines = parseJSONLyrics(json);
    expect(lines[0]!.words).toHaveLength(2);
  });

  it('lança erro para JSON inválido', () => {
    expect(() => parseJSONLyrics('{ isto não é json válido')).toThrow(LyricsParseError);
  });
});
