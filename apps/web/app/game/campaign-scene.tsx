'use client';
import Image from 'next/image';
import { useEffect, useState, type ReactNode } from 'react';
import type { CampaignView } from './client';
import { beatKey, imageGateMs, hasMemorySignal } from './cinematic-timing';
import { copy } from '../preview/copy';

function CurrentArtwork({ asset, cue, missing, gate, duration, onReady }: { asset: NonNullable<CampaignView['asset']>; cue: CampaignView['cue']; missing: string; gate: string; duration: number; onReady?: (key: string) => void }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!gate || !loaded || failed) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Unlock only after successful load and the scoped effect. Failed art offers a retry.
    const timer = window.setTimeout(() => onReady?.(gate), reduced ? 0 : duration);
    return () => window.clearTimeout(timer);
  }, [loaded, failed, gate, duration, onReady]);
  return (
    <>
      {!failed && <Image src={asset.url} alt={asset.alt} width={1536} height={864} unoptimized loading="eager"
        className="scene-art" data-startle={loaded && cue === 'startle'} data-fade-in={loaded && cue === 'fade-in'} data-cinematic-loaded={loaded} style={{ visibility: loaded ? 'visible' : 'hidden' }}
        onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />}
      {failed && <div className="scene-missing" role="status">{missing}{gate && <button type="button" className="game-control" onClick={() => { setLoaded(false); setFailed(false); }}>{asset.alt && missing === copy['pt-BR'].missingArt ? 'Tentar novamente' : 'Try again'}</button>}</div>}
      {loaded && !failed && (cue === 'wake' || cue === 'disoriented') && (
        <>
          <div className="wake-optics" aria-hidden="true" />
          <div className={cue === 'disoriented' ? 'eyelids campaign-disoriented' : 'eyelids'} aria-hidden="true"><span /><span /></div>
        </>
      )}
    </>
  );
}

export function CampaignScene({ view, children, onReady }: { view: CampaignView; children: ReactNode; onReady?: (key: string) => void }) {
  // Keep the immediately preceding, already mounted image only during its exit fade.
  // A resumed dark beat has no image and cannot request an unauthorized asset.
  const duration = imageGateMs(view);
  const gate = duration ? beatKey(view) : '';
  const key = view.asset?.url ?? view.cue;
  const closing = view.cue === 'fade-black' || view.cue === 'close-eyes' || view.cue === 'blink-black';
  const [last, setLast] = useState({ key, asset: view.asset });
  if (last.key !== key) setLast({ key, asset: view.asset ?? (closing && last.key.startsWith('/api/game/asset?') ? last.asset : null) });
  const artwork = view.asset ?? (closing ? last.asset : null);
  const currentArtwork = artwork && <CurrentArtwork key={artwork.url} asset={artwork} cue={view.cue} missing={copy[view.locale].missingArt} gate={gate} duration={duration} onReady={onReady} />;
  return (
    <div className="scene-frame campaign-scene" data-visible={view.asset !== null} data-cue={view.cue} data-cinematic-beat={gate}>
      <div className="scene-visual" aria-hidden={view.asset === null}>
        {hasMemorySignal(view) ? <div className="campaign-memory-signal">{currentArtwork}</div> : currentArtwork}
        {artwork && (view.cue === 'close-eyes' || view.cue === 'blink-black') && (
          <div className={'eyelids ' + (view.cue === 'blink-black' ? 'campaign-blink-black' : 'campaign-close-eyes')} aria-hidden="true"><span /><span /></div>
        )}
      </div>
      {children}
    </div>
  );
}
