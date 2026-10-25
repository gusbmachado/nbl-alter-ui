import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { readSource, compile, validate } from '../src/lib/content';
import { progress, stateLabel } from '../src/lib/catalog';

test('catálogo segue as quatro divisões e todos os títulos da especificação', () => {
  const { catalog } = compile();
  const spec = readFileSync('codex-nbl/INSTRUCOES-CODEX.md', 'utf8');
  const required = ['Torá', 'Profetas', 'Escritos', 'Novo Testamento Grego'];
  assert.deepEqual(catalog.collections.map(c => c.title), required);
  assert.equal(catalog.books.length, 66);
  for (const collection of catalog.collections) {
    const line = spec.split('\n').find(line => line.startsWith(`- **${collection.title}:**`))!;
    const expected = line.split('** ')[1].replace(/\.$/, '').split(', ');
    assert.deepEqual(catalog.books.filter(b => b.collectionId === collection.id).map(b => b.title), expected);
  }
});
test('rascunhos, notas rascunho e livros desabilitados não entram no resultado público', () => {
  const source = readSource();
  source.notes[0].status = 'draft';
  const result = compile(source);
  assert.equal(result.chapters.length, 4);
  assert(!JSON.stringify(result).includes('DRAFT_SENTINEL'));
  assert(!result.chapters.some(c => c.notes.some(n => n.id === source.notes[0].id)));
  source.books.find(b => b.slug === 'genesis')!.enabled = false;
  assert(!compile(source).chapters.some(c => c.book === 'genesis'));
});
test('30 notas independentes no mesmo verso e referências inválidas rejeitadas', () => {
  const source = readSource();
  assert.equal(compile(source).chapters.find(c => c.book === 'salmos' && c.chapter === 1)!.notes.length, 30);
  source.notes[0].verseStart = 999;
  assert.throws(() => validate(source), /Verso inicial inexistente/);
});
test('IDs duplicados, categorias desconhecidas e estado editorial incorreto falham', () => {
  let source = readSource();
  source.notes.push(source.notes[0]);
  assert.throws(() => validate(source), /duplicado/);
  source = readSource(); source.notes[0].category = 'missing';
  assert.throws(() => validate(source), /Categoria inválida/);
  source = readSource(); source.books.find(b => b.slug === 'genesis')!.publicationState = 'complete';
  assert.throws(() => validate(source), /capítulos faltantes/);
});
test('publicar um capítulo recalcula índice e progresso sem alterar componentes', () => {
  const source = readSource();
  source.chapters.find(c => c.id === 'genesis-004')!.status = 'published';
  const { catalog, chapters } = compile(source);
  assert.equal(chapters.length, 5);
  assert.equal(catalog.books.find(b => b.slug === 'genesis')!.chapters.length, 4);
  assert.equal(progress(catalog.books).published, 5);
});
test('porcentagem não infere conclusão editorial e total desconhecido não inventa porcentagem', () => {
  const book = compile().catalog.books.find(b => b.slug === 'genesis')!;
  assert.equal(stateLabel({ ...book, totalChapters: 3 }), 'Parcial');
  assert.equal(progress([{ ...book, totalChapters: null }]).percent, null);
});
test('CMS edita os mesmos arquivos, notas individuais e IDs explícitos de versos', () => {
  const config = parse(readFileSync('public/admin/config.yml', 'utf8'));
  assert.equal(config.backend.name, 'github');
  for (const name of ['collections', 'books', 'chapters', 'notes']) {
    const collection = config.collections.find((c: { name: string }) => c.name === name);
    assert.equal(collection.folder, `src/content/${name}`);
    assert.equal(collection.format, 'json');
  }
  const chapter = config.collections.find((c: { name: string }) => c.name === 'chapters');
  assert(chapter.fields.find((f: { name: string }) => f.name === 'verses').fields.some((f: { name: string }) => f.name === 'number'));
});

test('amostra real preserva 31/25/24 versos, 184/172/138 notas e atribuição', () => {
  const { chapters } = compile();
  const sample = chapters.filter(c => c.book === 'genesis').sort((a, b) => a.chapter - b.chapter);
  assert.deepEqual(sample.map(c => c.verses.length), [31, 25, 24]);
  assert.deepEqual(sample.map(c => c.notes.length), [184, 172, 138]);
  assert(sample.every(c => c.contentKind === 'sample' && c.sourceLabel?.includes('ref-text.txt')));
  assert(sample.every(c => !c.notes.some(n => n.body.includes('Nota fictícia'))));
});
