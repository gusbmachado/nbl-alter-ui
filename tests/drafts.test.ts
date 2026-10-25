import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compile } from '../src/lib/content';
import { draftOf, validateDraft } from '../src/lib/drafts';
const { catalog, chapters } = compile();
const source = chapters.filter(c => c.book === 'genesis');
const categories = catalog.site.noteCategories.map(c => c.id);
test('rascunho aceita alterações e preserva identidade e origem da amostra', () => {
  const draft = structuredClone(draftOf('genesis', source));
  draft.chapters[0].verses[0].text = 'Teste de edição';
  draft.chapters[0].sourceLabel = 'Origem adulterada';
  const checked = validateDraft(draft, 'genesis', source, categories);
  assert.equal(checked.chapters[0].verses[0].text, 'Teste de edição');
  assert.equal(checked.chapters[0].sourceLabel, source[0].sourceLabel);
  assert.notEqual(source[0].verses[0].text, 'Teste de edição');
});
test('importação rejeita versão, livro, versos e referências inválidas sem alterar a fonte', () => {
  for (const mutate of [
    (d: any) => d.version = 2,
    (d: any) => d.book = 'salmos',
    (d: any) => d.chapters.pop(),
    (d: any) => d.chapters[0].verses[0].number = 999,
    (d: any) => d.chapters[0].verses[0].text = '',
    (d: any) => d.chapters[0].notes[0].verseEnd = 999,
    (d: any) => d.chapters[0].notes[1].id = d.chapters[0].notes[0].id,
    (d: any) => d.chapters[0].notes[0].category = 'unknown',
  ]) {
    const draft = structuredClone(draftOf('genesis', source)); mutate(draft);
    assert.throws(() => validateDraft(draft, 'genesis', source, categories));
  }
});
