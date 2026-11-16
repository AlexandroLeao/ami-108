import { describe, expect, it } from 'vitest';
import { paginateText } from './pagination';
describe('presentation-only dialogue pagination', () => {
  it('keeps short dialogue unchanged', () => {
    expect(paginateText('Onde eu estou?', (text) => text.length <= 20)).toEqual(['Onde eu estou?']);
  });
  it('splits on words when possible, without losing content', () => {
    const text = 'Uma frase longa que precisa de várias páginas.';
    const result = paginateText(text, (part) => part.length <= 16);
    expect(result.join(' ')).toBe(text);
    expect(result.every((part) => part.length <= 16)).toBe(true);
  });
  it('always progresses on a long unbroken word', () => {
    expect(paginateText('ABCDEFGHI', (part) => part.length <= 3)).toEqual(['ABC', 'DEF', 'GHI']);
  });
});
