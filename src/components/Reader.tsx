import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { CatalogBook, Note, Position, PublicChapter } from '../lib/types';
import type { Leaf } from '../lib/folio';
import { readPosition, readStored, savePosition, writeStored } from '../lib/storage';
import { normalizeAnchor, urlInteger } from '../lib/position';
import FlipBook, { type Cursor, type FlipBookHandle } from './FlipBook';
import Notes from './Notes';
import BackCover from './BackCover';

interface Preferences { theme: 'pergaminho' | 'noturno'; size: number; font: 'manuscript' | 'literary'; sound: boolean; volume: number; notes: boolean }
const defaults: Preferences = { theme: 'pergaminho', size: 18, font: 'manuscript', sound: true, volume: .35, notes: true };
export default function Reader({ book, categories, previewChapters, startChapter, startVerse }: { book: CatalogBook; categories: { id: string; label: string }[]; previewChapters?: PublicChapter[]; startChapter?: number; startVerse?: number }) {
  const [prefs, setPrefs] = useState(defaults);
  const [panel, setPanel] = useState<'index' | 'settings' | null>(null);
  const [hint, setHint] = useState(false);
  const panelDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!panel) return;
    const previous = document.activeElement as HTMLElement | null;
    panelDialog.current?.showModal();
    return () => { panelDialog.current?.close(); previous?.focus({ preventScroll: true }); };
  }, [panel]);
  useEffect(() => {
    setHint(readStored('gesture-seen') !== true);
    const update = (event: Event) => setPrefs(old => ({ ...old, ...(event as CustomEvent).detail }));
    window.addEventListener('nbl-effects', update);
    return () => window.removeEventListener('nbl-effects', update);
  }, []);
  const [mode, setMode] = useState<'book' | 'study'>('book');
  const [chapters, setChapters] = useState<PublicChapter[]>([]);
  const [chapterNumber, setChapterNumber] = useState(book.chapters[0].chapter);
  const [verseNumber, setVerseNumber] = useState(1);
  const [pageState, setPageState] = useState({ index: 0, total: 0, kind: 'front' });
  const [resume, setResume] = useState<Position | null>(null);
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [retry, setRetry] = useState(0);
  const [activeNotes, setActiveNotes] = useState<{ notes: Note[]; label: string; kind: string } | null>(null);
  const cursor = useRef<Cursor>({ kind: 'front', chapter: book.chapters[0].chapter, verse: 1, offset: 0 });
  const flip = useRef<FlipBookHandle>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const root = useRef<HTMLElement>(null);
  const chapter = chapters.find(c => c.chapter === chapterNumber);
  const contentLabel = previewChapters ? 'Rascunho de demonstração · não publicado' : chapter?.contentKind === 'sample' ? 'Amostra real fornecida' : 'Texto fictício de teste';
  const patch = (value: Partial<Preferences>) => setPrefs(old => ({ ...old, ...value }));

  useEffect(() => {
    const saved = readStored<Partial<Preferences>>('preferences');
    if (saved) setPrefs({
      theme: saved.theme === 'noturno' ? 'noturno' : 'pergaminho',
      size: Number.isFinite(saved.size) ? Math.max(16, Math.min(30, saved.size!)) : defaults.size,
      font: saved.font === 'literary' ? 'literary' : 'manuscript', sound: saved.sound !== false,
      volume: Number.isFinite(saved.volume) ? Math.max(0, Math.min(1, saved.volume!)) : defaults.volume, notes: saved.notes !== false,
    });
    const position = previewChapters ? null : readPosition(book.slug); setResume(position);
    const url = new URL(window.location.href);
    if (previewChapters) {
      cursor.current = { kind: 'text', chapter: startChapter || book.chapters[0].chapter, verse: startVerse || 1, offset: 0 };
      setChapterNumber(cursor.current.chapter);
      setVerseNumber(cursor.current.verse);
    } else if (url.searchParams.has('capitulo')) {
      const requested = urlInteger(url.searchParams.get('capitulo'), book.chapters[0].chapter, 1);
      const number = book.chapters.some(c => c.chapter === requested) ? requested : book.chapters[0].chapter;
      cursor.current = { kind: 'text', chapter: number, verse: urlInteger(url.searchParams.get('verso'), 1, 1), offset: urlInteger(url.searchParams.get('offset'), 0, 0) };
      setChapterNumber(number);
      if (number !== requested) setNotice('O capítulo solicitado não está disponível; abrimos o primeiro publicado.');
    }
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches); update(); media.addEventListener('change', update);
    setReady(true);
    return () => { media.removeEventListener('change', update); audio.current?.pause(); };
  }, [book.slug, book.chapters]);
  useEffect(() => {
    if (ready) writeStored('preferences', prefs);
    if (!prefs.sound) audio.current?.pause();
    if (audio.current) audio.current.volume = prefs.volume;
  }, [prefs, ready]);
  useEffect(() => {
    if (!ready) return;
    if (previewChapters) { setChapters(previewChapters); return; }
    const controller = new AbortController(); setError(''); setChapters([]);
    // Only this selected volume is fetched. Individual static chapter JSON remains the source.
    Promise.all(book.chapters.map(async info => {
      const response = await fetch(`/dados/${book.slug}/${info.chapter}.json`, { signal: controller.signal });
      if (!response.ok) throw new Error(`Não foi possível carregar o capítulo ${info.chapter}.`);
      return response.json() as Promise<PublicChapter>;
    })).then(data => { if (!controller.signal.aborted) setChapters(data); })
      .catch(error => { if (!controller.signal.aborted) setError(`${error.message} Tente novamente ou volte à biblioteca.`); });
    return () => controller.abort();
  }, [ready, book.slug, book.chapters, retry, previewChapters]);
  function sound(file: 'tomo' | 'folhas') {
    if (!prefs.sound || prefs.volume <= 0) return;
    audio.current?.pause(); const track = new Audio(`/audio/${file}.mp3`); track.volume = prefs.volume;
    audio.current = track; void track.play().catch(() => {});
  }
  function remember(value: Cursor) {
    cursor.current = value;
    if (value.kind !== 'text') return;
    setChapterNumber(value.chapter); setVerseNumber(value.verse);
    const saved = { bookSlug: book.slug, chapter: value.chapter, verse: value.verse, offset: value.offset };
    setResume(saved);
    if (previewChapters) return;
    savePosition(saved);
    const url = new URL(window.location.href);
    url.searchParams.set('capitulo', String(value.chapter)); url.searchParams.set('verso', String(value.verse)); url.searchParams.set('offset', String(value.offset));
    window.history.replaceState(null, '', url);
  }
  function onPage(leaf: Leaf, index: number, total: number) {
    setPageState({ index, total, kind: leaf.kind }); setActiveNotes(null);
    if (leaf.kind === 'text') {
      const saved = cursor.current;
      const contains = saved.kind === 'text' && leaf.chapter === saved.chapter && leaf.segments.some(s => s.verse === saved.verse && saved.offset >= s.offset && saved.offset < s.offset + s.text.length);
      const segment = leaf.segments[0];
      const selected = contains ? saved : { kind: 'text' as const, chapter: leaf.chapter, verse: segment.verse, offset: segment.offset };
      remember(selected);
    } else if (leaf.kind === 'front' || leaf.kind === 'back') cursor.current = { ...cursor.current, kind: leaf.kind };
  }
  function jump(number: number, verse = 1, offset = 0) {
    const target = chapters.find(c => c.chapter === number) || chapters[0];
    if (!target) return;
    const normalized = normalizeAnchor(target.verses, { verse, offset });
    const next: Cursor = { kind: 'text', chapter: target.chapter, ...normalized };
    setActiveNotes(null); remember(next); flip.current?.go(next);
    if (mode === 'study') requestAnimationFrame(() => document.getElementById(`study-${target.chapter}-${normalized.verse}`)?.scrollIntoView({ block: 'start' }));
  }
  function showNotes(number: number, verse?: number) {
    const target = chapters.find(c => c.chapter === number); if (!target) return;
    const notes = target.notes.filter(n => verse === undefined ? n.scope === 'chapter' : n.scope !== 'chapter' && n.verseStart! <= verse && n.verseEnd! >= verse);
    if (notes.length) { setActiveNotes({ notes, label: `${book.title} ${number}${verse === undefined ? '' : `:${verse}`}`, kind: previewChapters ? 'Rascunho de demonstração · não publicado' : target.contentKind === 'sample' ? 'Amostra real fornecida' : 'Texto fictício de teste' }); sound('folhas'); }
  }
  function setReadingMode(next: 'book' | 'study') {
    setActiveNotes(null); setMode(next); setError('');
    if (cursor.current.kind !== 'text') cursor.current = { ...cursor.current, kind: 'text' };
  }
  useEffect(() => {
    if (mode === 'study') requestAnimationFrame(() => document.getElementById(`study-${cursor.current.chapter}-${cursor.current.verse}`)?.scrollIntoView({ block: 'center' }));
  }, [mode]);
  const font = mode === 'study' ? 'literary' : prefs.font;
  return <section ref={root} className={`reader codex-reader theme-${prefs.theme} font-${font}`} style={{ '--reading-size': `${prefs.size}px` } as CSSProperties}>
    <header className="codex-topbar">
      <a href={`/biblioteca/#${book.collectionId}`}>← Biblioteca</a>
      <div><h1>{book.title}</h1>{!previewChapters && chapter && chapter.contentKind !== 'sample' && <span>Texto fictício de teste</span>}</div>
      <nav aria-label="Controles do leitor"><button aria-haspopup="dialog" onClick={() => setPanel('index')}>Índice</button><button aria-haspopup="dialog" onClick={() => setPanel('settings')}>Ajustes de leitura</button></nav>
    </header>
    {previewChapters && <p className="reader-notice">Rascunho de demonstração · não publicado</p>}
    <dialog ref={panelDialog} className="reader-panel" aria-labelledby="reader-panel-title" onCancel={e => { e.preventDefault(); setPanel(null); }} onClick={e => { if (e.target === panelDialog.current) setPanel(null); }}>
      <header><h2 id="reader-panel-title">{panel === 'index' ? 'Índice do tomo' : 'Ajustes de leitura'}</h2><button onClick={() => setPanel(null)} aria-label="Fechar painel">×</button></header>
      <div hidden={panel !== 'index'}>
        <label>Capítulo<select aria-label="Capítulo" value={chapterNumber} disabled={!chapters.length} onChange={e => jump(Number(e.target.value))}>{book.chapters.map(c => <option key={c.chapter} value={c.chapter}>{c.chapter} · {book.title}</option>)}</select></label>
        <label>Ir ao verso<select aria-label="Ir ao verso" value={verseNumber} disabled={!chapter} onChange={e => jump(chapterNumber, Number(e.target.value))}>{chapter?.verses.map(v => <option key={v.number} value={v.number}>{v.number}</option>)}</select></label>
        <button onClick={() => setPanel(null)}>Voltar à leitura</button>
        {prefs.notes && chapter?.notes.some(n => n.scope === 'chapter') && <button onClick={() => { setPanel(null); showNotes(chapter.chapter); }}>Notas do capítulo</button>}
      </div>
      <div className="settings-panel" hidden={panel !== 'settings'}>
        <div className="reading-mode" aria-label="Modo de leitura"><button aria-pressed={mode === 'book'} onClick={() => { setReadingMode('book'); setPanel(null); }}>Livro</button><button aria-pressed={mode === 'study'} onClick={() => { setReadingMode('study'); setPanel(null); }}>Estudo</button></div>
        <button onClick={() => { setPanel(null); if (!document.fullscreenElement) void root.current?.requestFullscreen().catch(() => setNotice('Seu navegador não permite tela cheia.')); else void document.exitFullscreen(); }}>Tela cheia</button>
        <label>Tema<select aria-label="Tema" value={prefs.theme} onChange={e => patch({ theme: e.target.value as Preferences['theme'] })}><option value="pergaminho">Pergaminho</option><option value="noturno">Noturno</option></select></label>
        <label>Fonte da tradução<select aria-label="Fonte da tradução" value={prefs.font} onChange={e => patch({ font: e.target.value as Preferences['font'] })}><option value="manuscript">Manuscrita · Meddon</option><option value="literary">Literária · Garamond</option></select></label>
        <div className="font-controls"><span>Tamanho do texto</span><div><button aria-label="Diminuir fonte" disabled={prefs.size <= 16} onClick={() => patch({ size: prefs.size - 2 })}>A−</button><output>{prefs.size}</output><button aria-label="Aumentar fonte" disabled={prefs.size >= 30} onClick={() => patch({ size: prefs.size + 2 })}>A+</button></div></div>
        <button aria-pressed={prefs.notes} onClick={() => { patch({ notes: !prefs.notes }); setActiveNotes(null); }}>Notas {prefs.notes ? 'ligadas' : 'desligadas'}</button>
        <button onClick={() => { setPanel(null); if (document.fullscreenElement) void document.exitFullscreen().then(() => window.dispatchEvent(new Event('nbl-open-audio'))); else window.dispatchEvent(new Event('nbl-open-audio')); }}>Áudio · ambiente e efeitos</button>
        <button onClick={() => { flip.current?.go({ ...cursor.current, kind: 'front' }); setPanel(null); }}>Fechar tomo</button>
        {!previewChapters && <a href={`/experimentar/${book.slug}/?capitulo=${chapterNumber}&verso=${verseNumber}`}>Experimentar edição ↗</a>}
        <p className="reader-provenance">{previewChapters ? 'Prévia local de um rascunho. Alterações experimentais não atribuídas ao tradutor.' : chapter?.sourceLabel || 'Texto fictício de teste. Sem atribuição ao tradutor.'}</p>
        {!previewChapters && <button onClick={() => { if (navigator.clipboard) void navigator.clipboard.writeText(window.location.href).then(() => setNotice('Link de leitura copiado.'), () => setNotice('Copie o endereço do navegador.')); else setNotice('Copie o endereço do navegador.'); }}>Copiar link ↗</button>}
      </div>
    </dialog>
    {notice && <p className="reader-notice" role="status">{notice} <button aria-label="Dispensar aviso" onClick={() => setNotice('')}>×</button></p>}
    {error && <div className="notice" role="alert">{error}<div className="actions"><button onClick={() => setRetry(n => n + 1)}>Tentar novamente</button><button onClick={() => setReadingMode('study')}>Usar modo estudo</button></div></div>}
    {!chapters.length && !error && <p className="loading" role="status">Carregando os capítulos deste tomo…</p>}
    {chapters.length > 0 && mode === 'book' && <>
      {hint && <p className="flip-hint">Arraste o canto da folha para virar · use os botões ou as setas do teclado{reduced ? ' · movimento reduzido ativo' : ''} <button aria-label="Dispensar dica" onClick={() => { setHint(false); writeStored('gesture-seen', true); }}>×</button></p>}
      <FlipBook ref={flip} book={book} chapters={chapters} size={prefs.size} font={font} showNotes={prefs.notes} reduced={reduced} cursor={cursor}
        onPage={onPage} onTurn={() => { setActiveNotes(null); sound(pageState.kind === 'front' || pageState.kind === 'back' ? 'tomo' : 'folhas'); }} onNotes={showNotes} onError={setError} />
      <nav className="page-navigation codex-pagination" aria-label="Navegação das folhas"><button disabled={!pageState.total || pageState.index === 0} onClick={() => { setActiveNotes(null); flip.current?.previous(); }}>← Anterior</button><p aria-live="polite">{pageState.kind === 'front' ? 'Capa' : pageState.kind === 'back' ? 'Contracapa' : `Capítulo ${chapterNumber}`} · {pageState.index + 1} / {pageState.total || '…'}</p><button disabled={!pageState.total || pageState.index >= pageState.total - 1} onClick={() => { setActiveNotes(null); flip.current?.next(); }}>Próxima →</button></nav>
      {pageState.kind === 'front' && resume && <div className="reader-shortcuts"><button onClick={() => jump(resume.chapter, resume.verse, resume.offset)}>Continuar leitura · capítulo {resume.chapter}</button></div>}
      {pageState.kind === 'back' && <div className="back-cover-description"><BackCover variant={book.coverVariant} /><a className="button" href="/biblioteca/">Escolher outro tomo →</a></div>}
    </>}
    {mode === 'study' && chapter && <article className="study-reading" aria-label="Leitura contínua"><h2>{book.title} · capítulo {chapter.chapter}</h2><p className="caption">{contentLabel}</p>{chapter.verses.map(verse => {
      const count = chapter.notes.filter(n => n.scope !== 'chapter' && n.verseStart! <= verse.number && n.verseEnd! >= verse.number).length;
      return <section key={verse.number} id={`study-${chapter.chapter}-${verse.number}`} className="study-verse"><header><span>Verso {verse.number}</span><button onClick={() => jump(chapter.chapter, verse.number)}>Marcar leitura</button>{prefs.notes && count > 0 && <button className="note-marker" aria-label={`${count} notas do verso ${verse.number}`} onClick={() => showNotes(chapter.chapter, verse.number)} title={`${count} notas do verso ${verse.number}`}>✦ {count} {count === 1 ? 'nota' : 'notas'}</button>}</header><p className={`verse-text ${verse.style}`} data-verse={verse.number} data-offset="0">{verse.text}</p></section>;
    })}<nav className="actions" aria-label="Capítulos">{chapters.map(c => <button key={c.chapter} disabled={c.chapter === chapterNumber} onClick={() => jump(c.chapter)}>Capítulo {c.chapter}</button>)}</nav></article>}
    {activeNotes && <Notes notes={activeNotes.notes} label={activeNotes.label} categories={categories} close={() => setActiveNotes(null)} plain={mode === 'study'} contentLabel={activeNotes.kind} />}
  </section>;
}
