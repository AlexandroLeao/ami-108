import type { CampaignView } from './client';

// Only the owner-selected beats block navigation. Other existing fades stay non-blocking.
const wakes = new Set(['A01-S01/L02/NEXT','A01-S02/STREET-REVEAL/NEXT','A01-S03/REVEAL/NEXT','A01-S03/MEM-D1-RETURN/NEXT','A02-S02/L15/NEXT','A03-S01/RETURN-00/NEXT']);
export const beatKey = (view: CampaignView) => view.actions.find(a=>a.kind==='CONTINUE'||a.kind==='INTERACT')?.id ?? '';
export function imageGateMs(view: CampaignView): number {
  if (!view.asset) return 0;
  const id=beatKey(view);
  if (view.cue==='wake' && wakes.has(id)) return 1450;
  if (view.cue==='fade-in' && id==='A03-S01/L01/NEXT') return 750;
  if (view.cue==='startle' && id==='A02-S01/L01/NEXT') return 1000;
  if (view.cue==='startle' && id==='A03-S02/L01/NEXT') return 1350;
  if (view.cue==='crt-reveal' || view.cue==='crt-startle') return 1800;
  if (view.cue==='disoriented') return 1450;
  return 0;
}
export function energyMotion(view: CampaignView): 'tutorial'|'settle'|'none' {
  const id=beatKey(view);
  if (['A01-S03/TUTORIAL/NEXT','A01-S03/TUTORIAL-b/NEXT','A01-S03/TUTORIAL-c/NEXT'].includes(id)) return 'tutorial';
  if (id==='A01-S03/RETURN-STREET/NEXT') return 'settle';
  return 'none';
}
export const F3_COUNT_MS = 2200;
// F2 is the real pre-restoration state, not invented starting percentages.
export function countF3(text: string, progress: number) {
  const fraction=Math.max(0,Math.min(1,progress));
  const initial: Record<string,number>={'MED-01':75,'BIO-02':85,'HIST-03':78};
  return text.replace(/(MED-01|BIO-02|HIST-03)(\s+—\s+)100%/g,(_match,id:string,separator:string)=>id+separator+Math.floor(initial[id]+(100-initial[id])*fraction)+'%');
}

// Only the two original AMI memory artworks retain the CRT signal after opening.
export function hasMemorySignal(view: CampaignView): boolean {
  return view.chapter===4 && view.sceneId==='A04-S02' && view.phase==='FLASHBACK' &&
    (view.asset?.url==='/api/game/asset?key=CENA-08' || view.asset?.url==='/api/game/asset?key=CENA-12');
}
