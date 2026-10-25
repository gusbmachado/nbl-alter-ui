import { test } from 'node:test';
import assert from 'node:assert/strict';
import { composePages, compileLeaves, leafForPosition } from '../src/lib/folio';
import type { PublicChapter, Verse } from '../src/lib/types';
const verses: Verse[] = [
  { number: 1, text: 'Primeiro verso.', style: 'prose' },
  { number: 2, text: 'Segundo verso.', style: 'prose' },
  { number: 3, text: 'Texto extenso, com espaços\n e א e 🌳. '.repeat(60), style: 'poetry' },
];
const fits = (page: { text: string }[]) => page.reduce((n, s) => n + s.text.length + 8, 0) <= 120;
test('folhas agrupam versos e preservam integralmente continuações e offsets', () => {
  const pages = composePages(verses, fits);
  assert.ok(pages[0].length > 1);
  assert.ok(pages.every(fits));
  for (const verse of verses) {
    const segments = pages.flat().filter(s => s.verse === verse.number);
    assert.equal(segments.map(s => s.text).join(''), verse.text);
    let offset = 0;
    for (const segment of segments) { assert.equal(segment.offset, offset); offset += segment.text.length; }
  }
});
test('capítulos compõem um tomo com duas capas externas e navegação semântica', () => {
  const chapters = [1, 2, 3].map(chapter => ({ id: `g-${chapter}`, book: 'genesis', chapter, status: 'published', verses, notes: [] } as PublicChapter));
  const leaves = compileLeaves(chapters, fits);
  assert.equal(leaves.length % 2, 0);
  assert.equal(leaves[0].kind, 'front');
  assert.equal(leaves.at(-1)?.kind, 'back');
  const selected = leaves[leafForPosition(leaves, 2, 3, 300)];
  assert.equal(selected.chapter, 2);
  assert.ok(selected.segments.some(s => s.verse === 3 && s.offset <= 300 && s.offset + s.text.length > 300));
  assert.deepEqual([...new Set(leaves.filter(l => l.kind === 'text').map(l => l.chapter))], [1, 2, 3]);
});
