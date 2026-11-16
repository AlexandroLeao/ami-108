'use client';

import { useEffect, useReducer, useRef } from 'react';
import { copy } from './copy';
import { DialogueBox, SceneViewer } from './components';
import { setLocale, useLocale } from './locale';
import { CHAPTER_DURATION_MS, initialPreview, openingVisual, previewReducer } from './preview-state';

export function GamePreview({ imageAvailable }: { imageAvailable: boolean }) {
  const locale = useLocale();
  const [state, dispatch] = useReducer(previewReducer, initialPreview);
  const { stage, line, overlay, extrasPage } = state;
  const labels = copy[locale];
  const panelRef = useRef<HTMLDivElement>(null);
  const visual = openingVisual(line);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    if (stage !== 'chapter' || overlay !== 'none') return;
    const timer = window.setTimeout(() => dispatch({ type: 'CHAPTER_FINISH' }), CHAPTER_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [stage, overlay]);

  useEffect(() => {
    (panelRef.current?.querySelector<HTMLElement>('[data-primary]') ?? panelRef.current?.querySelector<HTMLElement>('button:not(:disabled)'))?.focus();
  }, [stage, overlay]);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && overlay !== 'none') {
        const controls = Array.from(panelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled)') ?? []);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (first && last && event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (first && last && !event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
      if (event.key === 'Escape') {
        if (overlay !== 'none') dispatch({ type: 'BACK' });
        else if (stage === 'scene' || stage === 'chapter') dispatch({ type: 'PAUSE' });
        else return;
        event.preventDefault();
        return;
      }
      if (overlay !== 'none' || (stage !== 'scene' && stage !== 'chapter')) return;
      if (event.key === 'ArrowRight' && !event.repeat) {
        event.preventDefault();
        dispatch({ type: 'ADVANCE' });
      }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [stage, overlay]);

  return (
    <main className="game-viewport" lang={locale}>
      <div ref={overlay === 'none' ? panelRef : null} className="game-layer" inert={overlay !== 'none'} aria-hidden={overlay !== 'none' || undefined}>
        {stage === 'menu' && (
          <section className="menu-screen">
            <h1 className="game-title">AMI<span>-108</span></h1>
            <nav aria-label={labels.menu} className="menu-options">
              <button className="game-control" onClick={() => dispatch({ type: 'START' })}>{labels.newGame}</button>
              <button className="game-control" disabled title={labels.newGameNotice}>{labels.continueGame}</button>
              <button className="game-control" onClick={() => dispatch({ type: 'LANGUAGE' })}>{labels.language}</button>
              <button className="game-control" onClick={() => dispatch({ type: 'EXTRAS' })}>{labels.extras}</button>
            </nav>
            <p className="version-label">{labels.version}</p>
          </section>
        )}
        {stage === 'chapter' && (
          <section className="chapter-screen">
            <button className="small-control top-menu" onClick={() => dispatch({ type: 'PAUSE' })}>{labels.menu}</button>
            <h1 className="chapter-title">{labels.chapter}</h1>
            <button className="advance-control chapter-advance" data-primary aria-label={labels.continue} title={labels.continue}
              onClick={() => dispatch({ type: 'ADVANCE' })}><span aria-hidden="true" className="pixel-arrow" /></button>
          </section>
        )}
        {stage === 'scene' && (
          <section className="game-stage">
            <header className="stage-header">
              <span aria-label={labels.chapter}>AMI-108</span>
              <button className="small-control" onClick={() => dispatch({ type: 'PAUSE' })}>{labels.menu}</button>
            </header>
            <SceneViewer imageAvailable={imageAvailable} locale={locale} reveal={visual.reveal} cue={visual.cue} />
            <DialogueBox speaker={labels.speaker} text={labels.lines[line]} locale={locale}
              cue={visual.cue} onAdvance={() => dispatch({ type: 'ADVANCE' })} />
          </section>
        )}
        {stage === 'end' && (
          <section className="menu-screen end-screen">
            <h1>{labels.end}</h1>
            <p>{labels.endNotice}</p>
            <button className="game-control" onClick={() => dispatch({ type: 'MAIN_MENU' })}>{labels.mainMenu}</button>
          </section>
        )}
      </div>

      {overlay !== 'none' && (
        <div ref={panelRef} className="game-overlay" role="dialog" aria-modal="true"
          aria-label={overlay === 'pause' ? labels.menu : overlay === 'language' ? labels.language : labels.extras}>
          {overlay === 'pause' && (
            <section className="menu-screen">
              <h1>{labels.menu}</h1>
              <div className="menu-options">
                <button className="game-control" onClick={() => dispatch({ type: 'BACK' })}>{labels.continue}</button>
                <button className="game-control" onClick={() => dispatch({ type: 'LANGUAGE' })}>{labels.language}</button>
                <button className="game-control" onClick={() => dispatch({ type: 'MAIN_MENU' })}>{labels.mainMenu}</button>
              </div>
            </section>
          )}
          {overlay === 'language' && (
            <section className="menu-screen">
              <h1>{labels.language}</h1>
              <div className="menu-options">
                {(['pt-BR', 'en'] as const).map((value) => (
                  <button key={value} className="game-control" lang={value} aria-pressed={locale === value}
                    onClick={() => { setLocale(value); dispatch({ type: 'BACK' }); }}>
                    {value === 'pt-BR' ? 'Português' : 'English'}
                  </button>
                ))}
                <button className="game-control" onClick={() => dispatch({ type: 'BACK' })}>{labels.back}</button>
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
                <button className="small-control" onClick={() => dispatch({ type: 'BACK' })}>{labels.back}</button>
                <button className="small-control" disabled={extrasPage === 0} aria-label={labels.previous}
                  onClick={() => dispatch({ type: 'EXTRAS_PAGE', page: extrasPage - 1 })}>‹</button>
                <button className="small-control" disabled={extrasPage === 2} aria-label={labels.nextPage}
                  onClick={() => dispatch({ type: 'EXTRAS_PAGE', page: extrasPage + 1 })}>›</button>
              </footer>
              <p className="version-label">{labels.version}</p>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
