'use client';
import Image from 'next/image';
import { useState, type ReactNode } from 'react';
import type { CampaignView } from './client';
import { copy } from '../preview/copy';

function CurrentArtwork({ asset, cue, missing }: { asset: NonNullable<CampaignView['asset']>; cue: CampaignView['cue']; missing: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <>
      {!failed && <Image src={asset.url} alt={asset.alt} width={1536} height={864} unoptimized loading="eager"
        className="scene-art" data-startle={loaded && cue === 'startle'} data-fade-in={loaded && cue === 'fade-in'} style={{ visibility: loaded ? 'visible' : 'hidden' }}
        onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />}
      {failed && <div className="scene-missing" role="status">{missing}</div>}
      {loaded && !failed && cue === 'wake' && (
        <>
          <div className="wake-optics" aria-hidden="true" />
          <div className="eyelids" aria-hidden="true"><span /><span /></div>
        </>
      )}
    </>
  );
}

export function CampaignScene({ view, children }: { view: CampaignView; children: ReactNode }) {
  // Keep the immediately preceding, already mounted image only during its exit fade.
  // A resumed dark beat has no image and cannot request an unauthorized asset.
  const key = view.asset?.url ?? view.cue;
  const closing = view.cue === 'fade-black' || view.cue === 'close-eyes' || view.cue === 'blink-black';
  const [last, setLast] = useState({ key, asset: view.asset });
  if (last.key !== key) setLast({ key, asset: view.asset ?? (closing && last.key.startsWith('/api/game/asset?') ? last.asset : null) });
  const artwork = view.asset ?? (closing ? last.asset : null);
  return (
    <div className="scene-frame campaign-scene" data-visible={view.asset !== null} data-cue={view.cue}>
      <div className="scene-visual" aria-hidden={view.asset === null}>
        {artwork && <CurrentArtwork key={artwork.url} asset={artwork} cue={view.cue} missing={copy[view.locale].missingArt} />}
        {artwork && (view.cue === 'close-eyes' || view.cue === 'blink-black') && (
          <div className={'eyelids ' + (view.cue === 'blink-black' ? 'campaign-blink-black' : 'campaign-close-eyes')} aria-hidden="true"><span /><span /></div>
        )}
      </div>
      {children}
    </div>
  );
}
