import type { Verse } from './types';

/** Keep stale/shared positions inside the current edition's actual text. */
export function normalizeAnchor(verses: Verse[], requested: { verse: number; offset: number }) {
  const verse = verses.find(v => v.number === requested.verse) || verses[0];
  if (!verse) return { verse: 1, offset: 0 };
  const offset = Number.isFinite(requested.offset) ? Math.floor(requested.offset) : 0;
  return { verse: verse.number, offset: Math.max(0, Math.min(offset, verse.text.length - 1)) };
}

export function urlInteger(value: string | null, fallback: number, minimum: number) {
  if (value === null || value.trim() === '') return fallback;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= minimum ? number : fallback;
}
