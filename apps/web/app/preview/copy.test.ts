import { describe, expect, it } from 'vitest';
import { copy } from './copy';

describe('opening preview copy', () => {
  it('preserves the four approved A01-S01 dialogue lines and unknown speaker', () => {
    expect(copy['pt-BR'].lines).toEqual([
      'Que merda... Minha cabeça.', 'Onde eu estou?', 'Sangue...?', 'Que diabos aconteceu aqui?',
    ]);
    expect(copy.en.lines).toEqual([
      'Shit... My head.', 'Where am I?', 'Blood...?', 'What the hell happened here?',
    ]);
    expect(copy.en.speaker).toBe('???');
    expect(copy['pt-BR'].speaker).toBe('???');
  });

  it('has the same label keys and dialogue count in both languages', () => {
    expect(Object.keys(copy['pt-BR']).sort()).toEqual(Object.keys(copy.en).sort());
    expect(copy['pt-BR'].lines.length).toBe(copy.en.lines.length);
  });
});
