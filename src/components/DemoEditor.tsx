import { useEffect, useRef, useState } from 'react';
import type { CatalogBook, Note, PublicChapter } from '../lib/types';
import { draftOf, readDraft, validateDraft, writeDraft } from '../lib/drafts';
import Reader from './Reader';

type Category = { id: string; label: string };
export default function DemoEditor({ book, categories }: { book: CatalogBook; categories: Category[] }) {
  const [source, setSource] = useState<PublicChapter[]>([]);
  const [chapters, setChapters] = useState<PublicChapter[]>([]);
  const [chapterNumber, setChapterNumber] = useState(book.chapters[0].chapter);
  const [verseNumber, setVerseNumber] = useState(1);
  const [preview, setPreview] = useState<PublicChapter[] | null>(null);
  const [status, setStatus] = useState('Carregando a amostra…');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [restore, setRestore] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const previewButton = useRef<HTMLButtonElement>(null);
  const focusNote = useRef<string | null>(null);
  const previewHeading = useRef<HTMLHeadingElement>(null);
  const chapter = chapters.find(c => c.chapter === chapterNumber) || chapters[0];
  const verse = chapter?.verses.find(v => v.number === verseNumber) || chapter?.verses[0];
  const categoryIds = categories.map(c => c.id);

  useEffect(() => {
    const controller = new AbortController();
    setError('');
    async function load() {
      try {
        const originals = await Promise.all(book.chapters.map(async c => {
          const response = await fetch(`/dados/${book.slug}/${c.chapter}.json`, { signal: controller.signal });
          if (!response.ok) throw new Error('Não foi possível carregar a amostra. Tente novamente.');
          return response.json() as Promise<PublicChapter>;
        }));
        let working = originals;
        try {
          const saved = await readDraft(book.slug);
          if (saved) working = validateDraft(saved, book.slug, originals, categoryIds).chapters;
        } catch {
          if (!controller.signal.aborted) setMessage('Não foi possível recuperar o rascunho local. A amostra foi aberta; você pode importar um arquivo exportado anteriormente.');
        }
        if (controller.signal.aborted) return;
        const params = new URL(location.href).searchParams;
        const selected = originals.find(c => c.chapter === Number(params.get('capitulo'))) || originals[0];
        setChapterNumber(selected.chapter);
        const requestedVerse = Number(params.get('verso'));
        setVerseNumber(selected.verses.some(v => v.number === requestedVerse) ? requestedVerse : selected.verses[0].number);
        setSource(originals); setChapters(working);
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Falha ao carregar.');
      }
    }
    void load();
    return () => controller.abort();
  }, [book.slug, retry]);

  useEffect(() => {
    if (!chapters.length) return;
    if (focusNote.current) { document.getElementById(`comment-${focusNote.current}`)?.focus(); focusNote.current = null; }
    let active = true;
    let draft;
    try { draft = validateDraft(draftOf(book.slug, chapters), book.slug, source, categoryIds); }
    catch { setStatus('Há campos vazios ou inválidos. Complete-os para salvar e pré-visualizar.'); return; }
    setStatus('Salvando neste navegador…');
    saveQueue.current = saveQueue.current.catch(() => {}).then(() => writeDraft(draft));
    void saveQueue.current.then(() => { if (active) setStatus('Rascunho salvo neste navegador'); }, () => {
      if (active) setStatus('Somente nesta sessão: armazenamento indisponível. Exporte antes de sair.');
    });
    return () => { active = false; };
  }, [chapters]);

  useEffect(() => {
    if (preview) previewHeading.current?.focus();
  }, [preview]);

  function updateChapter(edit: (value: PublicChapter) => PublicChapter) {
    setChapters(current => current.map(c => c.chapter === chapter.chapter ? edit(c) : c));
    setMessage('');
  }
  function updateNote(id: string, patch: Partial<Note>) {
    updateChapter(c => ({ ...c, notes: c.notes.map(n => n.id === id ? { ...n, ...patch } : n) }));
  }
  function checked() {
    try { return validateDraft(draftOf(book.slug, chapters), book.slug, source, categoryIds); }
    catch { setMessage('Complete os versos e as notas vazias antes de continuar.'); return null; }
  }
  function exportDraft() {
    const draft = checked(); if (!draft) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `rascunho-${book.slug}.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage('Rascunho exportado. O arquivo pode ser importado em outro navegador.');
  }
  async function importDraft(file?: File) {
    if (!file) return;
    try {
      if (file.size > 5_000_000) throw new Error('O arquivo deve ter no máximo 5 MB.');
      const draft = validateDraft(JSON.parse(await file.text()), book.slug, source, categoryIds);
      setChapters(draft.chapters); setMessage('Rascunho importado. Confira as alterações na prévia.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Arquivo inválido.'); }
    if (fileInput.current) fileInput.current.value = '';
  }
  function addNote() {
    const id = `demo-${crypto.randomUUID()}`;
    focusNote.current = id;
    updateChapter(c => ({ ...c, notes: [...c.notes, {
      id, book: book.slug, chapter: c.chapter, status: 'published', scope: 'verse',
      verseStart: verse!.number, verseEnd: verse!.number,
      category: categories.find(v => v.id === 'other')?.id || categories[0].id,
      order: Math.max(0, ...c.notes.map(n => n.order)) + 1, title: '', body: '',
    }] }));
  }
  function noteFields(note: Note) {
    return <details className="editor-note" key={note.id} open={note.id.startsWith('demo-')}>
      <summary>{note.title || `Nota ${note.order}`}<span>{note.body.slice(0, 85)}{note.body.length > 85 ? '…' : ''}</span></summary>
      <div className="editor-note-heading"><span>{note.scope === 'chapter' ? 'Nota do capítulo' : note.scope === 'range' ? `Versos ${note.verseStart}–${note.verseEnd}` : `Nota do verso ${note.verseStart}`}</span>
        <button onClick={() => updateChapter(c => ({ ...c, notes: c.notes.filter(n => n.id !== note.id) }))}>Remover nota</button></div>
      <label>Título da nota<input aria-label="Título da nota" value={note.title || ''} maxLength={500} onChange={e => updateNote(note.id, { title: e.target.value })} /></label>
      <label>Comentário<textarea aria-label="Comentário" id={`comment-${note.id}`} value={note.body} rows={5} onChange={e => updateNote(note.id, { body: e.target.value })} /></label>
      <label>Tipo de nota<select aria-label="Tipo de nota" value={note.category} onChange={e => updateNote(note.id, { category: e.target.value })}>{categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
    </details>;
  }
  if (!chapters.length) return <section className="editor-intro"><h1>Preparando a oficina</h1><p role={error ? 'alert' : 'status'}>{error || status}</p>{error && <button onClick={() => setRetry(n => n + 1)}>Tentar novamente</button>}</section>;
  const notes = chapter.notes.filter(n => n.scope !== 'chapter' && n.verseStart! <= verse!.number && n.verseEnd! >= verse!.number);
  return <section className="demo-editor">
    <header className="editor-intro"><a className="button secondary editor-return" href={`/ler/${book.slug}/?capitulo=${chapter.chapter}&verso=${verse!.number}`}>← Voltar à passagem original · {book.title} {chapter.chapter}:{verse!.number}</a><p className="eyebrow">OFICINA DE EDIÇÃO · SEM LOGIN</p><h1>{book.title}: experimentar e conferir</h1>
      <p>Altere um verso, acrescente uma nota e veja o resultado no livro. Você trabalha em uma cópia; a amostra original permanece intacta.</p>
      <ol className="editor-steps"><li>1. Editar</li><li>2. Ver no livro</li><li>3. Exportar rascunho</li></ol>
    </header>
    <div className="editor-actions">
      <button ref={previewButton} className="button" onClick={() => { const draft = checked(); if (draft) setPreview(draft.chapters); }}>Pré-visualizar no livro</button>
      <button onClick={exportDraft}>Exportar rascunho</button>
      <button onClick={() => fileInput.current?.click()}>Importar rascunho</button>
      <button onClick={() => setRestore(true)}>Restaurar amostra</button>
      <input ref={fileInput} hidden type="file" accept=".json,application/json" aria-label="Arquivo de rascunho" onChange={e => void importDraft(e.target.files?.[0])} />
    </div>
    <p role="status" className="editor-save">{status}</p>
    {message && <p className="editor-message" role="alert">{message}</p>}
    {restore && <div className="editor-message"><p>Substituir todas as alterações deste tomo pela amostra inicial? Exporte antes se quiser guardar seu trabalho.</p><button onClick={() => { setChapters(structuredClone(source)); setRestore(false); setPreview(null); setMessage('Amostra restaurada.'); }}>Sim, restaurar</button> <button onClick={() => setRestore(false)}>Cancelar</button></div>}
    {preview ? <section className="editor-preview"><div className="preview-bar"><h2 tabIndex={-1} ref={previewHeading}>Prévia do rascunho · não publicado</h2><button onClick={() => { setPreview(null); requestAnimationFrame(() => previewButton.current?.focus()); }}>← Voltar à edição</button></div>
      <Reader book={book} categories={categories} previewChapters={preview} startChapter={chapter.chapter} startVerse={verse!.number} />
    </section> : <div className="editor-workspace">
      <aside className="editor-index"><label>Capítulo em edição<select aria-label="Capítulo em edição" value={chapter.chapter} onChange={e => { setChapterNumber(Number(e.target.value)); setVerseNumber(1); }}>{chapters.map(c => <option key={c.chapter} value={c.chapter}>Capítulo {c.chapter}</option>)}</select></label>
        <nav aria-label="Versos para editar">{chapter.verses.map(v => <button key={v.number} aria-pressed={v.number === verse?.number} onClick={() => setVerseNumber(v.number)}>{v.number}</button>)}</nav>
        <a href={`/ler/${book.slug}/`}>Consultar a amostra original ↗</a>
      </aside>
      <div className="editor-fields"><h2>Capítulo {chapter.chapter} · verso {verse!.number}</h2>
        <label>Texto do verso<textarea className="editor-translation" aria-label="Texto do verso" rows={8} value={verse!.text} onChange={e => updateChapter(c => ({ ...c, verses: c.verses.map(v => v.number === verse!.number ? { ...v, text: e.target.value } : v) }))} /></label>
        <p className="caption">As quebras de linha serão preservadas na leitura.</p>
        <div className="editor-notes-title"><h3>Notas deste verso <small>({notes.length})</small></h3><button onClick={addNote}>Adicionar nota</button></div>
        {notes.map(noteFields)}
        {chapter.notes.some(n => n.scope === 'chapter') && <details><summary>Notas gerais do capítulo</summary>{chapter.notes.filter(n => n.scope === 'chapter').map(noteFields)}</details>}
      </div>
    </div>}
    <footer className="editor-footnote">Este é um editor experimental, separado do Sveltia. Os rascunhos ficam neste navegador e podem ser apagados ao limpar seus dados. Nada é publicado ou enviado ao professor automaticamente.</footer>
  </section>;
}
