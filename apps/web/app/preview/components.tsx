import Image from 'next/image';
import type { ReactNode } from 'react';
import { copy, type Locale } from './copy';
import type { VisualCue } from './preview-state';

export function EnergyIndicator({ energy, locale }: { energy: 0 | 1 | 2 | 3; locale: Locale }) {
  return (
    <section aria-label={copy[locale].energy} className="flex items-center gap-3">
      <span>{copy[locale].energy}</span>
      <div aria-hidden="true" className="flex gap-1">
        {[1, 2, 3].map((bar) => (
          <span key={bar} className={`h-3 w-7 border border-[#FDF3E9] ${bar <= energy ? 'bg-[#FDF3E9]' : 'bg-transparent'}`} />
        ))}
      </div>
      <span className="tabular-nums">{energy}/3</span>
    </section>
  );
}

export function ChoicePanel({ actions, locale, onChoice }: {
  actions: readonly { id: string; label: string; disabled?: boolean }[];
  locale: Locale;
  onChoice: (id: string) => void;
}) {
  if (actions.length === 0) return null;
  return (
    <section aria-label={copy[locale].choices} className="grid gap-2">
      {actions.map((action) => (
        <button key={action.id} type="button" disabled={action.disabled}
          onClick={() => onChoice(action.id)} className="game-control w-full text-left">
          {action.label}
        </button>
      ))}
    </section>
  );
}

export function SceneViewer({ imageAvailable, locale, reveal = true, cue = 'none', children }: {
  imageAvailable: boolean; locale: Locale; reveal?: boolean; cue?: VisualCue; children?: ReactNode;
}) {
  const visible = reveal && cue !== 'memory-cut';
  return (
    <div className="scene-frame" data-visible={visible} data-cue={cue}>
      <div className="scene-visual" aria-hidden={!visible}>
        {imageAvailable ? (
          <Image src="/preview/asset" alt={visible ? copy[locale].alt : ''} width={1536} height={864}
            unoptimized loading="eager" className="scene-art" />
        ) : (
          <div className="scene-missing">{visible ? copy[locale].missingArt : ''}</div>
        )}
        {imageAvailable && <div className="eyelids" aria-hidden="true"><span /><span /></div>}
      </div>
      {children}
    </div>
  );
}

export function DialogueBox({ speaker, text, locale, cue = 'none', onAdvance, onPrevious, canAdvance = true, canPrevious = false, chapter = false }: {
  speaker?: string; text?: string; locale: Locale; cue?: VisualCue;
  onAdvance: () => void; onPrevious?: () => void; canAdvance?: boolean; canPrevious?: boolean; chapter?: boolean;
}) {
  const labels = copy[locale];
  return (
    <section className="dialogue-frame">
      <div className="dialogue-copy" aria-live="polite" aria-atomic="true">
        {!chapter && (
          <>
            <p className="dialogue-speaker">{speaker}</p>
            <p key={text} className={cue === 'wake' || cue === 'pain' ? 'dialogue-text pain-text' : 'dialogue-text'}>{text}</p>
          </>
        )}
      </div>
      <div className="dialogue-navigation">
        {!chapter && <button type="button" className="advance-control previous-control" disabled={!canPrevious}
          aria-label={labels.previousDialogue} title={labels.previousDialogue} onClick={onPrevious}>
          <span aria-hidden="true" className="pixel-arrow" />
        </button>}
        <button type="button" className="advance-control" data-primary
          disabled={!canAdvance} hidden={!canAdvance}
          aria-label={chapter ? labels.continue : labels.next} title={chapter ? labels.continue : labels.next}
          onClick={onAdvance}><span aria-hidden="true" className="pixel-arrow" /></button>
      </div>
    </section>
  );
}

const titleGlyphs = [
  ['01110', '11011', '11011', '11111', '11011', '11011', '11011'],
  ['1100011', '1110111', '1111111', '1101011', '1100011', '1100011', '1100011'],
  ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  ['0000', '0000', '0000', '1111', '0000', '0000', '0000'],
  ['01100', '11100', '01100', '01100', '01100', '01100', '11111'],
  ['01110', '11011', '11011', '11011', '11011', '11011', '01110'],
  ['01110', '11011', '11011', '01110', '11011', '11011', '01110'],
] as const;
const glyphOffsets = [0, 7, 16, 23, 29, 36, 43];

export function GameWordmark() {
  return (
    <h1 className="game-title" aria-label="AMI-108">
      <svg aria-hidden="true" viewBox="0 0 48 7" className="game-wordmark" shapeRendering="crispEdges">
        {titleGlyphs.map((glyph, index) => (
          <g key={index} transform={`translate(${glyphOffsets[index]} 0)`} fill={index < 4 ? 'var(--ivory)' : 'var(--alert)'}>
            {glyph.flatMap((row, y) => [...row].map((pixel, x) =>
              pixel === '1' ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" /> : null,
            ))}
          </g>
        ))}
      </svg>
    </h1>
  );
}
