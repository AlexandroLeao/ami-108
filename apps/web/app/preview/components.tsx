import Image from 'next/image';
import { copy, type Locale } from './copy';

export function EnergyIndicator({ energy, locale }: { energy: 0 | 1 | 2 | 3; locale: Locale }) {
  return (
    <section aria-label={copy[locale].energy} className="flex items-center gap-3">
      <span className="text-sm">{copy[locale].energy}</span>
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

export function SceneViewer({ imageAvailable, locale }: { imageAvailable: boolean; locale: Locale }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden border border-[#FDF3E9] bg-[#171717]">
      {imageAvailable ? (
        <Image src="/preview/asset" alt={copy[locale].alt} width={1536} height={864}
          unoptimized className="h-full w-full object-contain [image-rendering:pixelated]" />
      ) : (
        <div className="flex h-full items-center justify-center p-6 text-center text-sm">
          {copy[locale].missingArt}
        </div>
      )}
    </div>
  );
}

export function DialogueBox({ speaker, text }: { speaker: string; text: string }) {
  return (
    <section aria-live="polite" aria-atomic="true" className="min-h-28 border border-[#FDF3E9] p-4 sm:p-5">
      <p className="mb-2 text-sm font-bold tracking-widest">{speaker}</p>
      <p className="text-base leading-relaxed sm:text-lg">{text}</p>
    </section>
  );
}
