'use client';

import { useState } from 'react';
import { copy, type Locale } from './copy';
import { DialogueBox, SceneViewer } from './components';

type Stage = 'menu' | 'chapter' | 'scene' | 'end';

export function GamePreview({ imageAvailable }: { imageAvailable: boolean }) {
  const [locale, setLocale] = useState<Locale>('pt-BR');
  const [stage, setStage] = useState<Stage>('menu');
  const [line, setLine] = useState(0);
  const labels = copy[locale];

  function advance() {
    if (stage === 'chapter') {
      setStage('scene');
      return;
    }
    if (line === labels.lines.length - 1) setStage('end');
    else setLine(line + 1);
  }

  function start() {
    setLine(0);
    setStage('chapter');
  }

  return (
    <main lang={locale} className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-5 px-4 py-6 sm:px-8 sm:py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em]">{labels.preview}</p>
          <p className="mt-1 max-w-xl text-xs leading-relaxed">{labels.notice}</p>
        </div>
        <div role="group" aria-label={labels.language} className="flex gap-2">
          {(['pt-BR', 'en'] as const).map((value) => (
            <button key={value} type="button" lang={value} aria-pressed={locale === value}
              className="game-control px-3 py-2 text-sm"
              onClick={() => setLocale(value)}>{value === 'pt-BR' ? 'Português' : 'English'}</button>
          ))}
        </div>
      </header>

      {stage === 'menu' ? (
        <section className="flex min-h-[65vh] flex-col items-center justify-center gap-8 text-center">
          <h1 className="text-5xl font-black tracking-tight sm:text-8xl">AMI<span className="text-[#FC2721]">-108</span></h1>
          <div className="grid w-full max-w-sm gap-3">
            <button className="game-control" type="button" onClick={start}>{labels.newGame}</button>
            <button className="game-control" type="button" disabled>{labels.continueGame}</button>
          </div>
        </section>
      ) : stage === 'chapter' ? (
        <section className="flex min-h-[65vh] flex-col items-center justify-center gap-8 text-center">
          <h1 className="text-3xl font-bold tracking-widest sm:text-5xl">{labels.chapter}</h1>
          <button type="button" className="game-control" onClick={advance}>{labels.continue}</button>
        </section>
      ) : stage === 'scene' ? (
        <section className="grid gap-4">
          <h1 className="text-sm font-bold tracking-widest">{labels.chapter}</h1>
          <SceneViewer imageAvailable={imageAvailable} locale={locale} />
          <DialogueBox speaker={labels.speaker} text={labels.lines[line]} />
          <div className="flex flex-wrap justify-between gap-3">
            <button type="button" className="game-control" onClick={() => setStage('menu')}>{labels.menu}</button>
            <button type="button" className="game-control" onClick={advance}>{labels.continue}</button>
          </div>
        </section>
      ) : (
        <section className="flex min-h-[65vh] flex-col items-center justify-center gap-6 text-center">
          <h1 className="text-3xl font-bold">{labels.end}</h1>
          <button type="button" className="game-control" onClick={() => setStage('menu')}>{labels.menu}</button>
        </section>
      )}
    </main>
  );
}
