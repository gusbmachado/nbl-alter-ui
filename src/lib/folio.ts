import type { PublicChapter, Verse } from './types';
import type { Page, Segment } from './pagination';
export interface Leaf { kind: 'front' | 'text' | 'blank' | 'back'; chapter: number; segments: Page }

/** Pack multiple verses per leaf; split only verses that cannot fit on an empty leaf. */
export function composePages(verses: Verse[], fits: (page: Page) => boolean): Page[] {
  const pages: Page[] = [];
  let page: Page = [];
  for (const verse of verses) {
    let offset = 0;
    while (offset < verse.text.length) {
      const segment: Segment = { verse: verse.number, offset, text: verse.text.slice(offset), style: verse.style };
      if (fits([...page, segment])) { page.push(segment); break; }
      if (page.length && fits([segment])) { pages.push(page); page = [segment]; break; }
      let low = 1, high = segment.text.length, count = 0;
      while (low <= high) {
        const middle = Math.floor((low + high) / 2);
        if (fits([...page, { ...segment, text: segment.text.slice(0, middle) }])) { count = middle; low = middle + 1; }
        else high = middle - 1;
      }
      if (!count) {
        if (page.length) { pages.push(page); page = []; continue; }
        throw new Error('Uma linha não cabe na folha. Reduza a fonte ou use o modo estudo.');
      }
      if (count < segment.text.length) {
        const space = segment.text.slice(0, count).search(/\s+\S*$/);
        if (space > count / 2) count = space + 1;
        if (count > 1 && /[\uD800-\uDBFF]/.test(segment.text[count - 1])) count--;
      }
      page.push({ ...segment, text: segment.text.slice(0, count) });
      pages.push(page); page = []; offset += count;
    }
  }
  if (page.length) pages.push(page);
  return pages;
}
export function compileLeaves(chapters: PublicChapter[], fits: (page: Page, chapter: PublicChapter) => boolean): Leaf[] {
  const leaves: Leaf[] = [{ kind: 'front', chapter: 0, segments: [] }];
  for (const chapter of chapters) {
    for (const segments of composePages(chapter.verses, page => fits(page, chapter))) {
      leaves.push({ kind: 'text', chapter: chapter.chapter, segments });
    }
  }
  // An even number of leaves leaves both hard covers outside the last spread.
  if (leaves.length % 2 === 0) leaves.push({ kind: 'blank', chapter: 0, segments: [] });
  leaves.push({ kind: 'back', chapter: 0, segments: [] });
  return leaves;
}
export function leafForPosition(leaves: Leaf[], chapter: number, verse: number, offset = 0) {
  const exact = leaves.findIndex(l => l.chapter === chapter && l.segments.some(s => s.verse === verse && offset >= s.offset && offset < s.offset + s.text.length));
  if (exact >= 0) return exact;
  const sameVerse = leaves.findIndex(l => l.chapter === chapter && l.segments.some(s => s.verse === verse));
  if (sameVerse >= 0) return sameVerse;
  const sameChapter = leaves.findIndex(l => l.kind === 'text' && l.chapter === chapter);
  return sameChapter >= 0 ? sameChapter : 1;
}
