import { useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import type { Note } from '../lib/types';
export default function Notes({ notes, label, categories, close, plain, contentLabel }: {
  notes: Note[]; label: string; categories: { id: string; label: string }[]; close: () => void; plain: boolean; contentLabel: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [filter, setFilter] = useState('');
  const [query, setQuery] = useState('');
  const [simple, setSimple] = useState(plain);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    return () => { dialog.current?.close(); previous?.focus(); };
  }, []);
  const filtered = notes.filter(n => (!filter || n.category === filter) &&
    `${n.title} ${n.body}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));
  return <dialog ref={dialog} className={`notes-dialog ${simple ? 'plain' : ''}`} aria-labelledby="notes-title"
    onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === dialog.current) close(); }}>
    <div className="scroll-cap" aria-hidden="true" />
    <div className="notes-inner">
      <header className="notes-header"><div><p className="eyebrow">CADERNO DE NOTAS</p><h2 id="notes-title">{label}</h2></div><button autoFocus onClick={close} aria-label="Fechar notas">✕</button></header>
      <details className="notes-search"><summary>Buscar e filtrar notas</summary><div className="notes-filters">
        <label>Categoria<select aria-label="Categoria" value={filter} onChange={e => setFilter(e.target.value)}><option value="">Todas as categorias</option>{categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
        <label>Buscar nas notas<input type="search" value={query} onChange={e => setQuery(e.target.value)} /></label>
        <label className="checkbox"><input type="checkbox" checked={simple} onChange={e => setSimple(e.target.checked)} />Sem ornamentação</label>
      </div>
      </details>
      <p role="status">{filtered.length} de {notes.length} notas · {contentLabel}</p>
      <div className="notes-list" tabIndex={0} aria-label="Lista de notas">
        {filtered.map(note => <article key={note.id} className="note-entry"><span className="eyebrow">{categories.find(c => c.id === note.category)?.label}</span><h3>{note.title || `Nota ${note.order}`}</h3><Markdown skipHtml
          allowedElements={['p', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'blockquote', 'br', 'code']}
          unwrapDisallowed>{note.body}</Markdown></article>)}
        {!filtered.length && <p>Nenhuma nota corresponde à busca.</p>}
      </div>
    </div><div className="scroll-cap" aria-hidden="true" />
  </dialog>;
}
