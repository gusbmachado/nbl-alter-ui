// Build-time module. Never import this file from a React island.
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Book, Catalog, Chapter, Collection, Note, PublicChapter, Site } from './types';

export interface Source { collections: Collection[]; books: Book[]; chapters: Chapter[]; notes: Note[]; site: Site }
const safeId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
function unique(values: (string | number)[], context: string) {
  assert(new Set(values).size === values.length, `Identificador duplicado: ${context}`);
}
function positive(value: unknown) { return Number.isInteger(value) && Number(value) > 0; }
export function readSource(root = resolve('src/content')): Source {
  const load = <T,>(folder: string): T[] => readdirSync(resolve(root, folder)).filter(f => f.endsWith('.json'))
    .sort().map(f => JSON.parse(readFileSync(resolve(root, folder, f), 'utf8')) as T);
  return {
    collections: load<Collection>('collections'), books: load<Book>('books'),
    chapters: load<Chapter>('chapters'), notes: load<Note>('notes'),
    site: JSON.parse(readFileSync(resolve(root, 'site.json'), 'utf8')),
  };
}
export function validate(source: Source) {
  const { collections, books, chapters, notes, site } = source;
  unique(collections.map(c => c.id), 'coleções');
  unique(books.map(b => b.slug), 'livros');
  unique(chapters.map(c => c.id), 'IDs de capítulos');
  unique(chapters.map(c => `${c.book}/${c.chapter}`), 'capítulos');
  unique(notes.map(n => n.id), 'notas');
  unique(site.noteCategories.map(c => c.id), 'categorias');
  assert(site.noteCategories.length, 'Cadastre categorias de notas');
  assert(!site.newsletterUrl || /^https:\/\//.test(site.newsletterUrl), 'Newsletter requer URL HTTPS');
  for (const c of collections) {
    assert(safeId.test(c.id) && c.title?.trim() && positive(c.order) && typeof c.enabled === 'boolean', `Coleção inválida: ${c.id}`);
  }
  for (const b of books) {
    assert(safeId.test(b.slug) && b.title?.trim() && positive(b.order) && typeof b.enabled === 'boolean', `Livro inválido: ${b.slug}`);
    assert(collections.some(c => c.id === b.collectionId), `Coleção ausente: ${b.slug}`);
    assert(b.totalChapters === null || positive(b.totalChapters), `Total inválido: ${b.slug}`);
    assert(['planned', 'in_progress', 'complete'].includes(b.publicationState), `Estado inválido: ${b.slug}`);
    assert(Array.isArray(b.canonTags) && b.canonTags.every(t => typeof t === 'string'), `Tags inválidas: ${b.slug}`);
    const published = chapters.filter(c => c.book === b.slug && c.status === 'published');
    assert(b.publicationState !== 'complete' || (b.totalChapters !== null && published.length === b.totalChapters), `Livro completo com capítulos faltantes: ${b.slug}`);
    assert(b.publicationState !== 'planned' || !published.length, `Livro planejado com capítulos publicados: ${b.slug}`);
  }
  for (const c of chapters) {
    const b = books.find(b => b.slug === c.book);
    assert(b && safeId.test(c.id) && positive(c.chapter), `Capítulo inválido: ${c.id}`);
    assert(b.totalChapters === null || c.chapter <= b.totalChapters, `Capítulo fora do total: ${c.id}`);
    assert(['draft', 'published'].includes(c.status), `Estado inválido: ${c.id}`);
    assert(!c.contentKind || ['sample', 'demonstration'].includes(c.contentKind), `Natureza do conteúdo inválida: ${c.id}`);
    assert(c.contentKind !== 'sample' || (typeof c.sourceLabel === 'string' && c.sourceLabel.trim()), `Origem da amostra ausente: ${c.id}`);
    assert(Array.isArray(c.verses) && c.verses.length > 0, `Capítulo sem versos: ${c.id}`);
    unique(c.verses.map(v => v.number), `versos de ${c.id}`);
    assert(c.verses.every((v, i) => positive(v.number) && typeof v.text === 'string' && v.text.trim() &&
      ['prose', 'poetry'].includes(v.style) && (!i || v.number > c.verses[i - 1].number)), `Versos inválidos ou fora de ordem: ${c.id}`);
    assert(!c.publishedAt || !Number.isNaN(Date.parse(c.publishedAt)), `Data inválida: ${c.id}`);
  }
  for (const n of notes) {
    const chapter = chapters.find(c => c.book === n.book && c.chapter === n.chapter);
    assert(chapter && safeId.test(n.id), `Referência inválida: ${n.id}`);
    assert(['draft', 'published'].includes(n.status), `Estado de nota inválido: ${n.id}`);
    assert(n.status !== 'published' || chapter.status === 'published', `Nota pública em capítulo rascunho: ${n.id}`);
    assert(site.noteCategories.some(c => c.id === n.category), `Categoria inválida: ${n.id}`);
    assert(positive(n.order) && typeof n.body === 'string' && n.body.trim(), `Corpo/ordem inválidos: ${n.id}`);
    assert(['verse', 'range', 'chapter'].includes(n.scope), `Escopo inválido: ${n.id}`);
    if (n.scope !== 'chapter') {
      assert(chapter.verses.some(v => v.number === n.verseStart), `Verso inicial inexistente: ${n.id}`);
      assert(chapter.verses.some(v => v.number === n.verseEnd), `Verso final inexistente: ${n.id}`);
      assert(n.verseEnd! >= n.verseStart!, `Faixa invertida: ${n.id}`);
      assert(n.scope !== 'verse' || n.verseStart === n.verseEnd, `Nota de verso com faixa: ${n.id}`);
    }
  }
}
export function compile(source = readSource()): { catalog: Catalog; chapters: PublicChapter[] } {
  validate(source);
  const collections = source.collections.filter(c => c.enabled).sort((a, b) => a.order - b.order);
  const enabled = source.books.filter(b => b.enabled && collections.some(c => c.id === b.collectionId));
  const chapters = source.chapters.filter(c => c.status === 'published' && enabled.some(b => b.slug === c.book))
    .map(c => ({ ...c, notes: source.notes.filter(n => n.status === 'published' && n.book === c.book && n.chapter === c.chapter)
      .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)) }));
  const books = enabled.sort((a, b) => collections.findIndex(c => c.id === a.collectionId) - collections.findIndex(c => c.id === b.collectionId) || a.order - b.order)
    .map(b => ({ ...b, chapters: chapters.filter(c => c.book === b.slug).sort((a, b) => a.chapter - b.chapter)
      .map(c => ({ chapter: c.chapter, title: c.title, publishedAt: c.publishedAt, contentKind: c.contentKind, sourceLabel: c.sourceLabel })) }));
  return { catalog: { collections, books, site: source.site }, chapters };
}
