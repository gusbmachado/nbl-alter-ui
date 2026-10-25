import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAnchor, urlInteger } from '../src/lib/position';
import { paginate, pageForPosition } from '../src/lib/pagination';
import type { Verse } from '../src/lib/types';

test('offset salvo antes de uma revisão aponta para a folha correta do verso encurtado', () => {
  const verses: Verse[] = [{ number: 3, text: 'Uma frase. Outra frase. Última frase.', style: 'prose' }];
  const anchor = normalizeAnchor(verses, { verse: 3, offset: 1500 });
  const pages = paginate(verses, text => text.length < 15);
  assert.equal(anchor.offset, verses[0].text.length - 1);
  assert.equal(pageForPosition(pages, anchor.verse, anchor.offset), pages.length - 1);
});
test('verso retirado e offsets inválidos usam posições existentes', () => {
  const verses: Verse[] = [{ number: 2, text: 'Texto.', style: 'prose' }];
  assert.deepEqual(normalizeAnchor(verses, { verse: 99, offset: -5 }), { verse: 2, offset: 0 });
  assert.deepEqual(normalizeAnchor(verses, { verse: 2, offset: Infinity }), { verse: 2, offset: 0 });
  assert.deepEqual(normalizeAnchor(verses, { verse: 2, offset: 2.8 }), { verse: 2, offset: 2 });
});
test('parâmetros compartilhados rejeitam frações, infinito e números inseguros', () => {
  for (const value of [null, '', 'NaN', 'Infinity', '-1', '1.5', '9007199254740993']) {
    assert.equal(urlInteger(value, 1, 1), 1);
  }
  assert.equal(urlInteger('24', 1, 1), 24);
  assert.equal(urlInteger('0', 0, 0), 0);
});
