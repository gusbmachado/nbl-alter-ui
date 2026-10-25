import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { PageFlip } from 'page-flip';
import type { CatalogBook, PublicChapter } from '../lib/types';
import { compileLeaves, leafForPosition, type Leaf } from '../lib/folio';
import { fillSegments, makeLeaf } from '../lib/folio-dom';
import { normalizeAnchor } from '../lib/position';

export interface Cursor { kind: 'front' | 'text' | 'back'; chapter: number; verse: number; offset: number }
export interface FlipBookHandle { next: () => void; previous: () => void; go: (cursor: Cursor) => void }
interface Props {
  book: CatalogBook; chapters: PublicChapter[]; size: number; font: string; showNotes: boolean; reduced: boolean;
  cursor: { current: Cursor };
  onPage: (leaf: Leaf, index: number, total: number) => void;
  onTurn: () => void; onNotes: (chapter: number, verse: number) => void; onError: (message: string) => void;
}

export default forwardRef<FlipBookHandle, Props>(function FlipBook(props, ref) {
  const host = useRef<HTMLDivElement>(null);
  const engine = useRef<PageFlip | null>(null);
  const leaves = useRef<Leaf[]>([]);
  const callbacks = useRef(props); callbacks.current = props;
  const [geometry, setGeometry] = useState({ width: 0, height: 0, available: 0, viewportHeight: 0 });
  const [fontRevision, setFontRevision] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const root = host.current!;
    function resize() {
      const available = Math.floor(root.clientWidth);
      const portrait = available < 760;
      const width = Math.floor(Math.min(440, portrait ? available : available / 2));
      const height = Math.floor(Math.max(420, Math.min(width * 1.48, window.innerHeight - 180, 680)));
      setGeometry(old => old.width === width && old.height === height && old.available === available && old.viewportHeight === window.innerHeight ? old : { width, height, available, viewportHeight: window.innerHeight });
    }
    resize(); const observer = new ResizeObserver(resize); observer.observe(root);
    window.addEventListener('resize', resize);
    let alive = true;
    void document.fonts.ready.then(() => { if (alive) setFontRevision(n => n + 1); });
    return () => { alive = false; observer.disconnect(); window.removeEventListener('resize', resize); };
  }, []);
  const go = (cursor: Cursor) => {
    const index = cursor.kind === 'front' ? 0 : cursor.kind === 'back' ? leaves.current.length - 1 : leafForPosition(leaves.current, cursor.chapter, cursor.verse, cursor.offset);
    props.cursor.current = cursor;
    engine.current?.turnToPage(index);
  };
  useImperativeHandle(ref, () => ({
    next: () => { const flip = engine.current; if (flip?.getState() !== 'read') return; props.reduced ? flip.turnToNextPage() : flip.flipNext(); },
    previous: () => { const flip = engine.current; if (flip?.getState() !== 'read') return; props.reduced ? flip.turnToPrevPage() : flip.flipPrev(); },
    go,
  }));
  useEffect(() => {
    if (!geometry.width || !props.chapters.length) return;
    let cancelled = false;
    let local: PageFlip | null = null;
    let clones: MutationObserver | null = null;
    const root = host.current!;
    const initialWidth = root.clientWidth;
    const initialHeight = window.innerHeight;
    const mount = document.createElement('div'); mount.className = 'flip-engine'; root.append(mount);
    const probe = document.createElement('div'); probe.className = 'folio-page folio-probe';
    probe.style.width = `${geometry.width}px`; probe.style.height = `${geometry.height}px`;
    const inner = document.createElement('div'); inner.className = 'folio-inner';
    const header = document.createElement('header'); header.className = 'folio-header'; header.textContent = `${props.book.title} · capítulo 1`;
    const text = document.createElement('div'); text.className = 'folio-text';
    const footer = document.createElement('footer'); footer.className = 'folio-footer'; footer.textContent = '1 · ❧';
    inner.append(header, text, footer); probe.append(inner); root.append(probe);
    setReady(false);
    async function build() {
      try {
        const compiled = compileLeaves(props.chapters, (segments, chapter) => {
          fillSegments(text, segments, chapter, props.showNotes);
          return text.scrollHeight <= text.clientHeight;
        });
        probe.remove();
        const { PageFlip } = await import('page-flip');
        if (cancelled) return;
        leaves.current = compiled;
        const current = props.cursor.current;
        const chapter = props.chapters.find(c => c.chapter === current.chapter) || props.chapters[0];
        const normalized = normalizeAnchor(chapter.verses, current);
        const start = current.kind === 'front' ? 0 : current.kind === 'back' ? compiled.length - 1 : leafForPosition(compiled, chapter.chapter, normalized.verse, normalized.offset);
        const elements: HTMLElement[] = compiled.map((leaf, i) => makeLeaf(leaf, i, props.book, props.chapters, props.showNotes));
        local = new PageFlip(mount, { width: geometry.width, height: geometry.height, size: 'fixed', showCover: true,
          usePortrait: true, autoSize: true, maxShadowOpacity: .35, drawShadow: !props.reduced,
          flippingTime: props.reduced ? 1 : 650, mobileScrollSupport: false, clickEventForward: true,
          disableFlipByClick: true, showPageCorners: !props.reduced, useMouseEvents: !props.reduced,
          startPage: start });
        engine.current = local;
        function update(index: number) {
          if (cancelled || !local || root.clientWidth !== initialWidth || window.innerHeight !== initialHeight) return;
          const pair = local.getOrientation() === 'landscape' && index !== 0 && index !== compiled.length - 1;
          elements.forEach((element, i) => {
            const visible = i === index || (pair && i === index + 1);
            element.dataset.visible = String(visible); element.setAttribute('aria-hidden', String(!visible)); element.inert = !visible;
          });
          // Keep a semantic anchor on reflow if the saved verse is on the right-hand leaf.
          const cursor = callbacks.current.cursor.current;
          const target = leafForPosition(compiled, cursor.chapter, cursor.verse, cursor.offset);
          const selected = cursor.kind === 'text' && (target === index || (pair && target === index + 1)) ? compiled[target] : compiled[index];
          callbacks.current.onPage(selected, index, compiled.length);
        }
        let initialized = false;
        local.on('flip', event => { if (initialized) update(Number(event.data)); });
        local.on('changeState', event => { if (event.data === 'flipping') callbacks.current.onTurn(); });
        local.on('init', () => { if (!cancelled) { initialized = true; update(local!.getCurrentPageIndex()); setReady(true); } });
        // StPageFlip creates visual copies during corner previews. Keep them out of
        // focus navigation and the accessibility tree; only originals are interactive.
        clones = new MutationObserver(() => {
          mount.querySelectorAll<HTMLElement>('.folio-page').forEach(element => {
            if (!elements.includes(element)) { element.inert = true; element.setAttribute('aria-hidden', 'true'); }
          });
        });
        clones.observe(mount, { childList: true, subtree: true });
        local.loadFromHTML(elements);
      } catch (error) {
        probe.remove();
        if (!cancelled) callbacks.current.onError(error instanceof Error ? error.message : 'Não foi possível preparar o flipbook.');
      }
    }
    function click(event: MouseEvent) {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
      const cover = (event.target as HTMLElement).closest('.folio-front');
      if (cover) { event.stopPropagation(); props.reduced ? local?.turnToNextPage() : local?.flipNext(); }
      if (button?.dataset.noteVerse) {
        event.stopPropagation(); callbacks.current.onNotes(Number(button.dataset.noteChapter), Number(button.dataset.noteVerse));
      }
    }
    root.addEventListener('click', click);
    void build();
    return () => {
      cancelled = true; root.removeEventListener('click', click); probe.remove();
      if (engine.current === local) engine.current = null;
      clones?.disconnect(); local?.destroy(); mount.remove();
    };
  }, [props.chapters, props.size, props.font, props.showNotes, props.reduced, geometry, fontRevision]);
  return <div className="flipbook-shell" ref={host} data-ready={ready} aria-busy={!ready} style={{ minHeight: geometry.height || 440 }}
    tabIndex={0} aria-label="Flipbook. Arraste os cantos ou use as setas do teclado."
    onKeyDown={event => { if (event.target !== event.currentTarget) return; if (event.key === 'ArrowRight') { event.preventDefault(); props.reduced ? engine.current?.turnToNextPage() : engine.current?.flipNext(); } if (event.key === 'ArrowLeft') { event.preventDefault(); props.reduced ? engine.current?.turnToPrevPage() : engine.current?.flipPrev(); } }}>
    {!ready && <span className="folio-loading" role="status">Compondo as folhas do tomo…</span>}
  </div>;
});
