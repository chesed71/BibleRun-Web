import { describe, it, expect } from 'vitest';
import { parseFileName } from '../parseFileName';

describe('parseFileName', () => {
  it('parses basic case with verse range', () => {
    const result = parseFileName('01_로마서_10_9_10.wav');
    expect(result).toEqual({
      id: 1,
      book: '로마서',
      chapter: 10,
      verseStart: 9,
      verseEnd: 10,
      verseSuffix: null,
    });
  });

  it('parses suffix case', () => {
    const result = parseFileName('15_로마서_11_36a.wav');
    expect(result).toEqual({
      id: 15,
      book: '로마서',
      chapter: 11,
      verseStart: 36,
      verseEnd: null,
      verseSuffix: 'a',
    });
  });

  it('parses single verse case', () => {
    const result = parseFileName('06_시편_119_105.wav');
    expect(result).toEqual({
      id: 6,
      book: '시편',
      chapter: 119,
      verseStart: 105,
      verseEnd: null,
      verseSuffix: null,
    });
  });

  it('parses long book name', () => {
    const result = parseFileName('04_예레미야애가_3_22_23.wav');
    expect(result).toEqual({
      id: 4,
      book: '예레미야애가',
      chapter: 3,
      verseStart: 22,
      verseEnd: 23,
      verseSuffix: null,
    });
  });

  it('handles mp3 extension', () => {
    const result = parseFileName('01_로마서_10_9_10.mp3');
    expect(result).not.toBeNull();
    expect(result!.book).toBe('로마서');
  });

  it('returns null for invalid filename', () => {
    expect(parseFileName('invalid')).toBeNull();
  });
});
