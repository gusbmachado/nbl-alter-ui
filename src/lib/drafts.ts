import type { PublicChapter } from './types';

export interface Draft { version: 1; book: string; chapters: PublicChapter[] }
export const draftOf = (book: string, chapters: PublicChapter[]): Draft => ({ version: 1, book, chapters });

/** Import only editable fields. Identity, provenance and publication remain from the sample. */
export function validateDraft(input: unknown, book: string, source: PublicChapter[], categories: string[]): Draft {
  const fail = (): never => { throw new Error('Arquivo incompatível. Importe um rascunho exportado deste tomo, com versos e notas válidos.'); };
  if (!input || typeof input !== 'object') return fail();
  const data = input as Draft;
  if (data.version !== 1 || data.book !== book || !Array.isArray(data.chapters) || data.chapters.length !== source.length) return fail();
  const ids = new Set<string>();
  const chapters = source.map(base => {
    const matches = data.chapters.filter(c => c && c.chapter === base.chapter);
    if (matches.length !== 1) return fail();
    const incoming = matches[0];
    if (!Array.isArray(incoming.verses) || incoming.verses.length !== base.verses.length || !Array.isArray(incoming.notes) || incoming.notes.length > 2000) return fail();
    const verses = base.verses.map((verse, i) => {
      const edited = incoming.verses[i];
      if (!edited || edited.number !== verse.number || typeof edited.text !== 'string' || !edited.text.trim() || edited.text.length > 100000 || !['prose', 'poetry'].includes(edited.style)) return fail();
      return { ...verse, text: edited.text, style: edited.style };
    });
    const numbers = new Set(verses.map(v => v.number));
    const notes = incoming.notes.map(note => {
      if (!note || typeof note.id !== 'string' || !/^[a-z0-9-]{1,120}$/.test(note.id) || ids.has(note.id) || typeof note.body !== 'string' || !note.body.trim() || note.body.length > 100000 || !categories.includes(note.category) || !['chapter', 'verse', 'range'].includes(note.scope) || !Number.isInteger(note.order) || note.order < 0 || (note.title !== undefined && (typeof note.title !== 'string' || note.title.length > 500))) return fail();
      if (note.scope !== 'chapter' && (!numbers.has(note.verseStart!) || !numbers.has(note.verseEnd!) || note.verseStart! > note.verseEnd! || (note.scope === 'verse' && note.verseStart !== note.verseEnd))) return fail();
      ids.add(note.id);
      return { id: note.id, book, chapter: base.chapter, status: 'published' as const, scope: note.scope,
        ...(note.scope === 'chapter' ? {} : { verseStart: note.verseStart, verseEnd: note.verseEnd }),
        category: note.category, title: note.title || '', order: note.order, body: note.body };
    });
    return { ...base, verses, notes };
  });
  return draftOf(book, chapters);
}

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('nbl-editor-demo', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('drafts');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Armazenamento ocupado por outra aba.'));
  });
}
export async function readDraft(book: string): Promise<unknown> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('drafts');
    const request = transaction.objectStore('drafts').get(book);
    transaction.oncomplete = () => { db.close(); resolve(request.result); };
    transaction.onabort = () => { db.close(); reject(transaction.error); };
    transaction.onerror = () => { db.close(); reject(transaction.error); };
  });
}
export async function writeDraft(draft: Draft): Promise<void> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('drafts', 'readwrite');
    transaction.objectStore('drafts').put(draft, draft.book);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onabort = () => { db.close(); reject(transaction.error); };
    transaction.onerror = () => { db.close(); reject(transaction.error); };
  });
}
