import test from 'node:test';
import assert from 'node:assert/strict';
import { paginate, pageForPosition } from '../src/lib/pagination';
import { readSource } from '../src/lib/content';
test('todas as palavras e quebras sobrevivem à paginação em fontes/larguras diferentes', () => {
  const verses = readSource().chapters.find(c => c.id === 'salmos-001')!.verses;
  for (const capacity of [70, 180, 400, 900]) {
    const pages = paginate(verses, text => text.length <= capacity);
    for (const verse of verses) {
      const segments = pages.flat().filter(s => s.verse === verse.number);
      assert.equal(segments.map(s => s.text).join(''), verse.text);
      assert.equal(segments[0].offset, 0);
    }
    assert(pages.flat().filter(s => s.verse === 3).length > 1);
  }
});
test('retomada semântica atravessa repaginação e publicação de novos versos', () => {
  const verses = readSource().chapters.find(c => c.id === 'salmos-001')!.verses;
  const anchor = { verse: 3, offset: 1500 };
  for (const capacity of [100, 333, 800]) {
    const pages = paginate(verses, text => text.length <= capacity);
    const segment = pages[pageForPosition(pages, anchor.verse, anchor.offset)][0];
    assert.equal(segment.verse, anchor.verse);
    assert(segment.offset <= anchor.offset && segment.offset + segment.text.length > anchor.offset);
  }
});
test('tokens longos, caracteres não latinos e ausência de espaço não bloqueiam paginação', () => {
  const text = 'λόγος דבר ' + 'x'.repeat(1000) + ' 🌿'.repeat(10);
  const pages = paginate([{ number: 7, text, style: 'poetry' }], text => text.length < 30);
  assert.equal(pages.flat().map(s => s.text).join(''), text);
  assert.equal(pageForPosition(pages, 999), 0);
});

test('todos os versos reais preservam sentenças e caracteres em várias larguras', () => {
  for (const chapter of readSource().chapters.filter(c => c.contentKind === 'sample')) {
    for (const capacity of [90, 320, 700]) {
      const pages = paginate(chapter.verses, text => text.length <= capacity);
      for (const verse of chapter.verses) {
        assert.equal(pages.flat().filter(s => s.verse === verse.number).map(s => s.text).join(''), verse.text);
      }
    }
  }
});
