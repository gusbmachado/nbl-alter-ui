import { useEffect, useState } from 'react';
import { readPosition } from '../lib/storage';
import type { CatalogBook } from '../lib/types';
export default function Continue({ books }: { books: Pick<CatalogBook, 'slug' | 'title' | 'chapters'>[] }) {
  const [link, setLink] = useState<{ href: string; title: string } | null>(null);
  useEffect(() => {
    const saved = readPosition();
    const book = books.find(b => b.slug === saved?.bookSlug && b.chapters.length);
    if (book && saved) setLink({ href: `/ler/${book.slug}/?capitulo=${saved.chapter}&verso=${saved.verse}&offset=${saved.offset}`, title: book.title });
  }, [books]);
  return link ? <a className="button secondary" href={link.href}>Continuar leitura · {link.title} →</a> : null;
}
