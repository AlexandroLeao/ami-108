import Image from 'next/image';
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

export function SceneViewer({ imageAvailable, locale, reveal = true, cue = 'none' }: {
  imageAvailable: boolean; locale: Locale; reveal?: boolean; cue?: VisualCue;
}) {
  const visible = reveal && cue !== 'memory-cut';
  return (
    <div className="scene-frame" data-cue={cue}>
      {visible && (imageAvailable ? (
        <Image src="/preview/asset" alt={copy[locale].alt} width={1536} height={864}
          unoptimized className="scene-art" />
      ) : (
        <div className="scene-missing">{copy[locale].missingArt}</div>
      ))}
      {visible && imageAvailable && cue === 'wake' && (
        <div className="eyelids" aria-hidden="true"><span /><span /></div>
      )}
    </div>
  );
}

export function DialogueBox({ speaker, text, locale, cue = 'none', onAdvance }: {
  speaker: string; text: string; locale: Locale; cue?: VisualCue; onAdvance: () => void;
}) {
  return (
    <section className="dialogue-frame">
      <div className="dialogue-copy" aria-live="polite" aria-atomic="true">
        <p className="dialogue-speaker">{speaker}</p>
        <p className={cue === 'pain' ? 'dialogue-text pain-text' : 'dialogue-text'}>{text}</p>
      </div>
      <button type="button" className="advance-control" data-primary aria-label={copy[locale].next}
        title={copy[locale].next} onClick={onAdvance}><span aria-hidden="true" className="pixel-arrow" /></button>
    </section>
  );
}
