import type { Verse } from './types';
export interface Segment { verse: number; text: string; offset: number; style: Verse['style'] }
export type Page = Segment[];
/**
 * Split at whitespace where possible, preserving every original character.
 * Height is measured by the reader using the actual font and column width.
 * Each segment owns a page: inexpensive, predictable, and friendly to reflow.
 */
export function paginate(verses: Verse[], fits: (text: string, style: Verse['style']) => boolean): Page[] {
  const pages: Page[] = [];
  for (const verse of verses) {
    let offset = 0;
    while (offset < verse.text.length) {
      const rest = verse.text.slice(offset);
      let lo = 1, hi = rest.length, count = 1;
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (fits(rest.slice(0, mid), verse.style)) { count = mid; lo = mid + 1; }
        else hi = mid - 1;
      }
      if (count < rest.length) {
        const space = rest.slice(0, count).search(/\s+\S*$/);
        if (space > count / 2) count = space + 1;
        // Never split a UTF-16 surrogate pair.
        if (count > 1 && /[\uD800-\uDBFF]/.test(rest[count - 1])) count--;
      }
      pages.push([{ verse: verse.number, text: rest.slice(0, count), offset, style: verse.style }]);
      offset += count;
    }
  }
  return pages;
}
export function pageForPosition(pages: Page[], verse: number, offset = 0) {
  const exact = pages.findIndex(page => page.some(s => s.verse === verse && offset >= s.offset && offset < s.offset + s.text.length));
  if (exact >= 0) return exact;
  const sameVerse = pages.findIndex(page => page.some(s => s.verse === verse));
  return sameVerse >= 0 ? sameVerse : 0;
}
