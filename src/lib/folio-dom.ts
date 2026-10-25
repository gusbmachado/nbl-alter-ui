import type { CatalogBook, PublicChapter } from './types';
import type { Page } from './pagination';
import type { Leaf } from './folio';
import { coverAsset } from './covers';

export function fillSegments(target: HTMLElement, segments: Page, chapter: PublicChapter, showNotes: boolean) {
  target.replaceChildren();
  for (const segment of segments) {
    const block = document.createElement('section'); block.className = 'folio-verse';
    const heading = document.createElement('div'); heading.className = 'folio-verse-heading';
    const label = document.createElement('span'); label.textContent = `${segment.verse}${segment.offset ? ' · continuação' : ''}`;
    heading.append(label);
    const notes = chapter.notes.filter(n => n.scope !== 'chapter' && n.verseStart! <= segment.verse && n.verseEnd! >= segment.verse);
    if (showNotes && notes.length) {
      const marker = document.createElement('button'); marker.type = 'button'; marker.className = 'note-marker';
      marker.textContent = '✦'; marker.title = `${notes.length} notas do verso ${segment.verse}`; marker.setAttribute('aria-label', `${notes.length} notas do verso ${segment.verse}`);
      marker.dataset.noteVerse = String(segment.verse); marker.dataset.noteChapter = String(chapter.chapter);
      heading.append(marker);
    }
    const text = document.createElement('p'); text.className = `verse-text ${segment.style}`;
    if (segment.verse === chapter.verses[0]?.number && segment.offset === 0) text.classList.add('chapter-initial');
    text.textContent = segment.text; text.dataset.verse = String(segment.verse); text.dataset.offset = String(segment.offset);
    block.append(heading, text); target.append(block);
  }
}
export function makeLeaf(leaf: Leaf, index: number, book: CatalogBook, chapters: PublicChapter[], showNotes: boolean) {
  const element = document.createElement('div'); element.className = `folio-page folio-${leaf.kind}`;
  element.dataset.leaf = String(index);
  if (leaf.kind === 'front' || leaf.kind === 'back') {
    element.dataset.density = 'hard';
    const img = document.createElement('img'); img.src = coverAsset(book.coverVariant, leaf.kind === 'front' ? 'capa' : 'contracapa');
    img.alt = leaf.kind === 'front' ? `Capa de ${book.title}` : `Contracapa de ${book.title}`;
    img.draggable = false; element.append(img);
    if (leaf.kind === 'front') {
      const plaque = document.createElement('span'); plaque.className = 'folio-cover-title'; plaque.textContent = book.title;
      element.append(plaque);
      const button = document.createElement('button'); button.className = 'folio-open'; button.textContent = 'Abrir o tomo →';
      button.setAttribute('aria-label', `Abrir ${book.title}`); button.dataset.openBook = 'true'; element.append(button);
    }
    return element;
  }
  const inner = document.createElement('div'); inner.className = 'folio-inner';
  const header = document.createElement('header'); header.className = 'folio-header';
  header.textContent = leaf.kind === 'blank' ? book.title : `${book.title} · capítulo ${leaf.chapter}`;
  const text = document.createElement('div'); text.className = 'folio-text';
  if (leaf.kind === 'text') fillSegments(text, leaf.segments, chapters.find(c => c.chapter === leaf.chapter)!, showNotes);
  else text.textContent = 'Fim dos capítulos disponíveis neste tomo.';
  const footer = document.createElement('footer'); footer.className = 'folio-footer'; footer.textContent = `${index}  ·  ❧`;
  inner.append(header, text, footer); element.append(inner);
  return element;
}
