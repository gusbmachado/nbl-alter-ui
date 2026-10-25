import type { CatalogBook } from './types';
export function progress(books: CatalogBook[]) {
  const published = books.reduce((sum, b) => sum + b.chapters.length, 0);
  const total = books.every(b => b.totalChapters !== null) ? books.reduce((sum, b) => sum + b.totalChapters!, 0) : null;
  return { published, total, percent: total ? published / total * 100 : null };
}
export function stateLabel(book: CatalogBook) {
  if (!book.chapters.length) return 'Ainda não disponível';
  return book.publicationState === 'complete' && book.chapters.length === book.totalChapters ? 'Completo' : 'Parcial';
}
