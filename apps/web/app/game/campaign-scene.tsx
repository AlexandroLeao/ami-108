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
        className="scene-art" style={{ visibility: loaded ? 'visible' : 'hidden' }}
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
  return (
    <div className="scene-frame" data-visible={view.asset !== null} data-cue={view.cue}>
      <div className="scene-visual" aria-hidden={view.asset === null}>
        {view.asset && <CurrentArtwork key={view.asset.url} asset={view.asset} cue={view.cue} missing={copy[view.locale].missingArt} />}
      </div>
      {children}
    </div>
  );
}
