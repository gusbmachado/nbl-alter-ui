import type { Position } from './types';
export function readStored<T>(key: string): T | null {
  try { const raw = localStorage.getItem(`nbl:${key}`); return raw ? JSON.parse(raw) as T : null; }
  catch { return null; }
}
export function writeStored(key: string, value: unknown) {
  try { localStorage.setItem(`nbl:${key}`, JSON.stringify(value)); } catch { /* Storage is optional. */ }
}
export function readPosition(bookSlug?: string): Position | null {
  const p = readStored<Position>(bookSlug ? `position:${bookSlug}` : 'last-position');
  return p && typeof p.bookSlug === 'string' && Number.isInteger(p.chapter) && p.chapter > 0 &&
    Number.isInteger(p.verse) && p.verse > 0 && Number.isInteger(p.offset) && p.offset >= 0 ? p : null;
}
export function savePosition(p: Position) {
  writeStored(`position:${p.bookSlug}`, p); writeStored('last-position', p);
}
