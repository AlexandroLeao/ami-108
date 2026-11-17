'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { copy, type Locale } from '../preview/copy';
import { GameWordmark } from '../preview/components';
import { useLocale, setLocale } from '../preview/locale';
import { CHAPTER_REVEAL_MS } from '../preview/preview-state';
import { CampaignScene } from './campaign-scene';
import { gameRequest, RequestError, type CampaignView, type CommandBody, type CommandResult } from './client';
import { paginateText } from './pagination';

type Overlay = 'none' | 'pause' | 'language' | 'extras' | 'resume' | 'chapters';
type PageState = { key: string; pages: string[]; index: number };
const messages = {
  'pt-BR': { replace: 'Iniciar um novo jogo? O botão Continuar passará a recuperar a nova partida.', connection: 'Não foi possível concluir a ação. Tente novamente.', stale: 'O progresso foi atualizado. Continue a partir da fala atual.', expired: 'A sessão não está disponível. Inicie um novo jogo.', boundary: 'Capítulo 2 concluído nesta versão. O Capítulo 3 será integrado na próxima etapa.', resumeAt: 'Continuar jogo', chapters: 'Capítulos', restart: 'Recomeçar este capítulo? Seu ponto atual será substituído, mas os capítulos liberados e as consultas armazenadas serão preservados.' },
  en: { replace: 'Start a new game? Continue will then resume the new run.', connection: 'Unable to complete the action. Please try again.', stale: 'Progress was updated. Continue from the current dialogue.', expired: 'Session unavailable. Start a new game.', boundary: 'Chapter 2 complete in this version. Chapter 3 will be integrated next.', resumeAt: 'Continue game', chapters: 'Chapters', restart: 'Restart this chapter? Your current position will be replaced, but unlocked chapters and cached consultations will be preserved.' },
} as const;
type Notice = 'connection' | 'stale' | 'expired';

function EnergyIndicator({ view }: { view: CampaignView }) {
  const d = view.diagnostics;
  if (!d) return null;
  const label = view.locale === 'pt-BR' ? 'Energia' : 'Energy';
  return (
    <div className="campaign-diagnostics campaign-energy" data-energy-reveal={view.cue === 'energy-reveal'} role="group" aria-label={label}>
      <span>{label}</span>
      <span className="campaign-bars" role="img" aria-label={view.locale === 'pt-BR' ? `${d.energy} de 3 barras` : `${d.energy} of 3 bars`}>
        {[1, 2, 3].map((bar) => <span key={bar} data-filled={bar <= d.energy} />)}
      </span>
    </div>
  );
}

export function CampaignGame({ initialHasSave }: { initialHasSave: boolean }) {
  const preference = useLocale();
  const [view, setView] = useState<CampaignView | null>(null);
  const [hasSave, setHasSave] = useState(initialHasSave);
  const [menuSave, setMenuSave] = useState<CampaignView | null>(null);
  const [overlay, setOverlay] = useState<Overlay>('none');
  const [extrasPage, setExtrasPage] = useState(0);
  const [readyCard, setReadyCard] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pagination, setPagination] = useState<PageState>({ key: '', pages: [''], index: 0 });
  const busyRef = useRef(false);
  const retry = useRef<{ signature: string; body: CommandBody } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLElement>(null);
  const measureRef = useRef<HTMLParagraphElement>(null);
  const locale = view?.locale ?? preference;
  const labels = copy[locale];
  const chapter = view?.phase === 'CHAPTER_CARD';
  const chapterKey = chapter && view ? String(view.chapter) : null;
  const chapterReady = !chapter || readyCard === chapterKey;
  const boundary = !!view && !view.actions.some((action) => action.kind !== 'PREVIOUS');
  const showChapter = chapter && !(boundary && chapterReady);
  const displayText = !view || showChapter ? '' : boundary ? messages[locale].boundary : view.text;
  const pageKey = view ? (view.actions[0]?.id ?? 'boundary') + ':' + locale + ':' + displayText : '';
  const pageReady = pagination.key === pageKey;
  const pageIndex = pageReady ? pagination.index : 0;
  const pageCount = pageReady ? pagination.pages.length : 1;
  const pageText = pageReady ? pagination.pages[pageIndex] : displayText;
  const narrationLabel = view?.information ? (locale === 'pt-BR' ? 'INFORMAÇÃO' : 'INFORMATION')
    : view?.narration ? (locale === 'pt-BR' ? 'NARRAÇÃO' : 'NARRATION') : null;
  const robotDialogue = view?.speaker === 'AMI-108' || view?.speaker === 'Robô' || view?.speaker === 'Robot';
  const nextAction = view?.actions.find((action) => action.kind === 'CONTINUE' || action.kind === 'INTERACT');
  const explicitActions = view?.actions.filter((action) => action.kind === 'CONSULT' || action.kind === 'CHOOSE' || action.kind === 'RETRY') ?? [];
  const choiceMode = explicitActions.length > 0;
  const deathCard = view?.phase === 'DEAD' && explicitActions.some(action => action.kind === 'RETRY');
  const previousAction = view?.actions.find((action) => action.kind === 'PREVIOUS');

  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  useEffect(() => {
    if (!chapterKey) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setReadyCard(chapterKey), reduced ? 0 : CHAPTER_REVEAL_MS);
    return () => window.clearTimeout(timer);
  }, [chapterKey]);

  // Measure actual font metrics and fixed frame size. Only the current line is
  // paginated locally; no server command is sent for intermediate pages.
  useEffect(() => {
    const frame = frameRef.current;
    const measure = measureRef.current;
    if (!frame || !measure) return;
    let active = true;
    let raf = 0;
    const calculate = () => {
      if (!active) return;
      const copyArea = frame.querySelector<HTMLElement>('.dialogue-copy');
      const speaker = frame.querySelector<HTMLElement>('.dialogue-speaker');
      if (!copyArea || !copyArea.clientWidth || !frame.clientHeight) return;
      const style = getComputedStyle(frame);
      const speakerHeight = speaker ? speaker.offsetHeight + parseFloat(getComputedStyle(speaker).marginBottom || '0') : 0;
      const height = Math.max(1, frame.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom) - speakerHeight - 2);
      measure.style.width = copyArea.clientWidth + 'px';
      const pages = paginateText(displayText, (text) => {
        measure.textContent = text;
        return measure.scrollHeight <= height;
      });
      measure.textContent = '';
      setPagination((old) => {
        const index = old.key === pageKey ? Math.min(old.index, pages.length - 1) : 0;
        if (old.key === pageKey && old.index === index && old.pages.join('\u0000') === pages.join('\u0000')) return old;
        return { key: pageKey, pages, index };
      });
    };
    const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(calculate); };
    const observer = new ResizeObserver(schedule);
    observer.observe(frame);
    schedule();
    void document.fonts.ready.then(() => { if (active) schedule(); });
    return () => { active = false; observer.disconnect(); cancelAnimationFrame(raf); };
  }, [pageKey, displayText, view?.speaker, narrationLabel, showChapter, choiceMode]);

  const accept = useCallback((next: CampaignView) => {
    setView(next);
    setHasSave(true);
    setLocale(next.locale);
  }, []);
  const run = useCallback(async (operation: () => Promise<unknown>) => {
    if (busyRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    setNotice(null);
    try {
      await operation();
      return true;
    } catch (error) {
      if (error instanceof RequestError && error.status === 401) {
        retry.current = null;
        setView(null); setHasSave(false); setOverlay('none'); setNotice('expired');
      } else if (error instanceof RequestError && error.status === 409) {
        retry.current = null;
        try { accept(await gameRequest<CampaignView>('view')); setNotice('stale'); }
        catch { setNotice('connection'); }
      } else {
        setNotice('connection');
      }
      return false;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [accept]);

  const mutate = useCallback(async (current: CampaignView, payload: { actionId: string } | { locale: Locale }) => {
    const endpoint = 'locale' in payload ? 'locale' : 'commands';
    const signature = JSON.stringify([endpoint, current.revision, payload]);
    const body = retry.current?.signature === signature ? retry.current.body
      : { commandId: crypto.randomUUID(), expectedRevision: current.revision, ...payload };
    retry.current = { signature, body };
    const result = await gameRequest<CommandResult>(endpoint, endpoint === 'locale' ? 'PATCH' : 'POST', body);
    retry.current = null;
    accept(result.view);
    return result.view;
  }, [accept]);

  const start = () => {
    if (busyRef.current || (hasSave && !window.confirm(messages[locale].replace))) return;
    void run(async () => {
      const next = await gameRequest<CampaignView>('session', 'POST', { locale: preference });
      retry.current = null;
      setReadyCard(null);
      accept(next);
    });
  };
  const openResume = () => {
    void run(async () => {
      const current = await gameRequest<CampaignView>('view');
      setMenuSave(current);
      setOverlay('resume');
    });
  };
  const resume = () => {
    void run(async () => {
      const current = await gameRequest<CampaignView>('view');
      retry.current = null;
      setReadyCard(null);
      if (current.locale !== preference) await mutate(current, { locale: preference });
      else accept(current);
      setOverlay('none');
    });
  };
  const restartChapter = (number: number) => {
    if (busyRef.current || !menuSave?.chapters?.some(chapter => chapter.number === number) || !window.confirm(messages[locale].restart)) return;
    void run(async () => {
      const current = await gameRequest<CampaignView>('view');
      retry.current = null;
      setReadyCard(null);
      const next = await mutate(current, { actionId: 'CHAPTER/RESTART/' + number });
      if (next.locale !== preference) await mutate(next, { locale: preference });
      setOverlay('none');
    });
  };
  const advance = useCallback(() => {
    if (!view || !nextAction || busyRef.current || overlay !== 'none' || !chapterReady || (!chapter && !pageReady)) return;
    if (!chapter && pageIndex + 1 < pageCount) {
      setPagination((old) => ({ ...old, index: Math.min(old.index + 1, old.pages.length - 1) }));
      return;
    }
    void run(() => mutate(view, { actionId: nextAction.id }));
  }, [view, nextAction, overlay, chapterReady, chapter, pageReady, pageIndex, pageCount, run, mutate]);
  const previous = useCallback(() => {
    if (!view || choiceMode || !chapterReady || busyRef.current || overlay !== 'none' || !pageReady) return;
    if (pageIndex > 0) {
      setPagination((old) => ({ ...old, index: Math.max(0, old.index - 1) }));
      return;
    }
    if (previousAction) void run(() => mutate(view, { actionId: previousAction.id }));
  }, [view, chapterReady, overlay, pageReady, pageIndex, previousAction, run, mutate, choiceMode]);
  const closeOverlay = useCallback(() => setOverlay(overlay === 'chapters' ? 'resume' : overlay === 'language' && view ? 'pause' : 'none'), [overlay, view]);
  const chooseLanguage = async (value: Locale) => {
    if (busyRef.current) return;
    if (!view) { setLocale(value); setOverlay('none'); return; }
    if (value === view.locale || await run(() => mutate(view, { locale: value }))) setOverlay('pause');
  };
  const mainMenu = () => {
    if (busyRef.current) return;
    retry.current = null;
    setView(null); setOverlay('none'); setNotice(null); setReadyCard(null);
  };

  useEffect(() => {
    if (busy) return;
    // Never focus the header menu as a fallback during dialogue transitions.
    const panel = panelRef.current;
    const target = panel?.querySelector<HTMLElement>('.campaign-choice-area')
      ?? panel?.querySelector<HTMLElement>('[data-primary]:not(:disabled)')
      ?? (view && overlay === 'none' ? panel?.querySelector<HTMLElement>('.dialogue-navigation button:not(:disabled)') : panel?.querySelector<HTMLElement>('button:not(:disabled)'));
    target?.focus({ preventScroll: true });
  }, [view, overlay, chapterReady, busy]);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && overlay !== 'none') {
        const controls = Array.from(panelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled)') ?? []);
        const first = controls[0]; const last = controls[controls.length - 1];
        if (first && last && event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (first && last && !event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
      if (event.key === 'Escape' && !busyRef.current) {
        if (overlay !== 'none') closeOverlay();
        else if (view) setOverlay('pause');
        else return;
        event.preventDefault(); return;
      }
      if (!view || overlay !== 'none' || event.repeat) return;
      if (event.key === 'ArrowLeft') { event.preventDefault(); previous(); }
      if (event.key === 'ArrowRight') { event.preventDefault(); advance(); }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [view, overlay, closeOverlay, previous, advance]);

  const titleText = view ? (locale === 'pt-BR' ? 'CAPÍTULO ' : 'CHAPTER ') + view.chapter + ' — ' + view.chapterTitle.toLocaleUpperCase(locale) : '';
  const cue = pageIndex === 0 ? view?.cue : 'none';
  const tremor = cue === 'wake' || cue === 'pain' || cue === 'ellipsis' || cue === 'blink-black';
  // Continuous memory motion applies across all measured pages of this beat.
  const memoryShiver = view?.cue === 'memory-shiver';
  const nameReveal = view?.cue === 'name-reveal';
  const advanceLabel = nextAction?.kind === 'INTERACT' ? nextAction.label : chapter ? labels.continue : labels.next;

  return (
    <main className="game-viewport" lang={locale}>
      <div ref={overlay === 'none' ? panelRef : null} className="game-layer" inert={overlay !== 'none'} aria-hidden={overlay !== 'none' || undefined}>
        {!view ? (
          <section className="menu-screen">
            <GameWordmark />
            <nav aria-label={labels.menu} className="menu-options">
              <button className="game-control" disabled={busy} onClick={start}>{labels.newGame}</button>
              <button className="game-control" disabled={busy || !hasSave} onClick={openResume}>{labels.continue}</button>
              <button className="game-control" disabled={busy} onClick={() => setOverlay('language')}>{labels.language}</button>
              <button className="game-control" disabled={busy} onClick={() => { setExtrasPage(0); setOverlay('extras'); }}>{labels.extras}</button>
            </nav>
            <p className="version-label">{labels.version}</p>
          </section>
        ) : (
          <section className="game-stage" data-encounter={choiceMode && view.phase === 'ENCOUNTER'}>
            <header className="campaign-header">
              <div className="stage-header">
                <span>AMI-108</span>
                <div className="campaign-header-middle">{(view.asset || view.information) && <EnergyIndicator view={view} />}</div>
                <button className="small-control campaign-menu-control" aria-disabled={busy} onClick={() => { if (!busyRef.current) setOverlay('pause'); }}>{labels.menu}</button>
              </div>
            </header>
            <CampaignScene view={view}>
              {deathCard && <svg className="campaign-skull" viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges">
                <path fill="currentColor" d="M5 1h6v1h2v2h1v6h-2v2h-1v3H5v-3H4v-2H2V4h1V2h2z" />
                <path fill="var(--coal)" d="M4 5h3v3H4zM9 5h3v3H9zM7 9h2v2H7zM6 12h1v3H6zM9 12h1v3H9z" />
              </svg>}
              <div key={view.chapter} className="chapter-layer" data-active={chapter} aria-hidden={!chapter}>
                <h1 className="chapter-title">{titleText}</h1>
              </div>
            </CampaignScene>
            <section ref={frameRef} className="dialogue-frame campaign-dialogue" data-robot={robotDialogue} data-information={view.information} data-choices={choiceMode} data-dead={view.phase === 'DEAD'} aria-busy={busy}>
              {choiceMode ? <div className="campaign-choice-area" role="group" aria-label={view.text} tabIndex={-1}>
                {view.phase === 'DEAD' && <p className="campaign-death-title" role="status">{view.text}</p>}
                <div className="campaign-choice-list">
                  {explicitActions.map(action => <button key={action.id} type="button" className="game-control campaign-choice" data-kind={action.kind} disabled={busy}
                    onClick={() => void run(() => mutate(view, { actionId: action.id }))}>{action.label}</button>)}
                </div>
              </div> : <div className="dialogue-copy" aria-live="polite" aria-atomic="true">
                {!showChapter && (
                  <>
                    {(view.speaker || narrationLabel) && <p className={'dialogue-speaker' + (narrationLabel ? ' campaign-narration' : '')}>
                      {nameReveal ? <span key={pageKey} className="campaign-name-reveal"><span className="campaign-name-before" aria-hidden="true">???</span><span className="campaign-name-after">{view.speaker}</span></span> : view.speaker ?? narrationLabel}
                    </p>}
                    <p key={pageKey + ':' + pageIndex} className={'dialogue-text' + (tremor ? ' pain-text' : '') + (cue === 'ellipsis' ? ' ellipsis-text' : '') + (memoryShiver ? ' campaign-memory-shiver' : '')}>{pageText}</p>
                  </>
                )}
              </div>}
              <p ref={measureRef} className="dialogue-text campaign-measure" aria-hidden="true" />
              <div className="dialogue-navigation" hidden={choiceMode}>
                <button className="advance-control previous-control" type="button" disabled={busy || !chapterReady || (!choiceMode && !pageReady) || (!previousAction && pageIndex === 0)}
                  aria-label={labels.previousDialogue} onClick={previous}><span aria-hidden="true" className="pixel-arrow" /></button>
                <button className="advance-control" type="button" data-primary disabled={busy || !nextAction || !chapterReady || (!chapter && !pageReady)}
                  aria-label={advanceLabel} onClick={advance}><span aria-hidden="true" className="pixel-arrow" /></button>
              </div>
            </section>
          </section>
        )}
      </div>
      {overlay !== 'none' && (
        <div ref={panelRef} className="game-overlay" role="dialog" aria-modal="true"
          aria-label={overlay === 'pause' ? labels.menu : overlay === 'language' ? labels.language : overlay === 'resume' ? labels.continue : overlay === 'chapters' ? messages[locale].chapters : labels.extras}>
          {overlay === 'resume' && (
            <section className="menu-screen">
              <h1>{labels.continue}</h1>
              <div className="menu-options">
                <button className="game-control" disabled={busy} onClick={resume}>{messages[locale].resumeAt}</button>
                <button className="game-control" disabled={busy || !menuSave?.chapters?.length} onClick={() => setOverlay('chapters')}>{messages[locale].chapters}</button>
                <button className="game-control" disabled={busy} onClick={closeOverlay}>{labels.back}</button>
              </div>
            </section>
          )}
          {overlay === 'chapters' && (
            <section className="menu-screen campaign-chapter-menu">
              <h1>{messages[locale].chapters}</h1>
              <div className="menu-options">
                {menuSave?.chapters?.map(item => <button key={item.number} className="game-control" disabled={busy} onClick={() => restartChapter(item.number)}>
                  {locale === 'pt-BR' ? 'Capítulo ' : 'Chapter '}{item.number}
                </button>)}
                <button className="game-control" disabled={busy} onClick={closeOverlay}>{labels.back}</button>
              </div>
            </section>
          )}
          {overlay === 'pause' && (
            <section className="menu-screen">
              <h1>{labels.menu}</h1>
              <div className="menu-options">
                <button className="game-control" disabled={busy} onClick={() => setOverlay('none')}>{labels.continue}</button>
                <button className="game-control" disabled={busy} onClick={() => setOverlay('language')}>{labels.language}</button>
                <button className="game-control" disabled={busy} onClick={mainMenu}>{labels.mainMenu}</button>
              </div>
            </section>
          )}
          {overlay === 'language' && (
            <section className="menu-screen">
              <h1>{labels.language}</h1>
              <div className="menu-options">
                {(['pt-BR', 'en'] as const).map((value) => (
                  <button key={value} className="game-control" lang={value} disabled={busy} aria-pressed={locale === value}
                    onClick={() => void chooseLanguage(value)}>{value === 'pt-BR' ? 'Português' : 'English'}</button>
                ))}
                <button className="game-control" disabled={busy} onClick={closeOverlay}>{labels.back}</button>
              </div>
            </section>
          )}
          {overlay === 'extras' && (
            <section className="extras-screen">
              <header><h1>{labels.extras}</h1><span>{extrasPage + 1}/3</span></header>
              <article className="extras-card" aria-live="polite">
                <h2>{labels.extrasPages[extrasPage].title}</h2>
                {labels.extrasPages[extrasPage].paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </article>
              <footer>
                <button className="small-control" onClick={closeOverlay}>{labels.back}</button>
                <button className="small-control" disabled={extrasPage === 0} aria-label={labels.previous}
                  onClick={() => setExtrasPage((page) => Math.max(0, page - 1))}>‹</button>
                <button className="small-control" disabled={extrasPage === 2} aria-label={labels.nextPage}
                  onClick={() => setExtrasPage((page) => Math.min(2, page + 1))}>›</button>
              </footer>
              <p className="version-label">{labels.version}</p>
            </section>
          )}
        </div>
      )}
      {notice && <div className="campaign-notice"><p role="alert">{messages[locale][notice]}</p><button type="button" className="small-control" onClick={() => setNotice(null)} aria-label={labels.back}>×</button></div>}
    </main>
  );
}
