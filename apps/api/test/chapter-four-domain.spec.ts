import { advanceFour, beginFour, CHAPTER_FIVE_BOUNDARY, viewFour, type ChapterFourProgress } from '../src/narrative/chapter-four-domain';
import { FINAL_RESTORATION } from '../src/narrative/chapter-four-catalog';
import type { Diagnostics } from '../src/narrative/engine';
import type { Locale } from '../src/narrative/catalog';

const f2: Diagnostics = { energy: 3, med: 75, bio: 85, hist: 78, personal: 5, personalUnlocked: false };
const prior = ['F2','E-ESCAPE-ROUTE'];
const start = (locale: Locale='pt-BR') => beginFour(f2,prior,locale,100);
const next = (s: ChapterFourProgress) => advanceFour(s,viewFour(s).actions.find(a=>a.kind!=='PREVIOUS')!.id,s.revision);
function until(s: ChapterFourProgress, id: string): ChapterFourProgress {
  for(let i=0;i<100 && s.stepId!==id;i++) s=next(s);
  expect(s.stepId).toBe(id);
  return s;
}

describe('isolated Chapter 4 transitions',()=>{
  it('requires the completed Chapter 3 state and F2/route events',()=>{
    expect(()=>beginFour(f2,['F2'],'en',0)).toThrow('CHAPTER_FOUR_NOT_READY');
    expect(()=>beginFour({...f2,personalUnlocked:true},prior,'en',0)).toThrow('CHAPTER_FOUR_NOT_READY');
    expect(()=>beginFour({...f2,energy:2},prior,'en',0)).toThrow('CHAPTER_FOUR_NOT_READY');
    expect(viewFour(start()).asset).toBeNull();
  });
  it('installs F3 atomically and rejects skipped, repeated and stale actions',()=>{
    const initial=start();
    expect(()=>advanceFour(initial,'A04-S01/INSTALL/NEXT',initial.revision)).toThrow('ACTION_NOT_ALLOWED');
    const install=until(initial,'A04-S01/INSTALL');
    expect(viewFour(install).actions[0].kind).toBe('INTERACT');
    expect(install.diagnostics).toEqual(f2);
    const restored=next(install);
    expect(restored.diagnostics).toEqual(FINAL_RESTORATION);
    expect(restored.events).toEqual(['F3']);
    expect(viewFour(restored)).toMatchObject({stepId:'A04-S01/FACE-UPDATE',asset:null});
    expect(viewFour(next(restored))).toMatchObject({stepId:'A04-S01/F3-INDEXES',record:true,asset:null,cue:'f3-count'});
    expect(viewFour(next(next(restored)))).toMatchObject({stepId:'A04-S01/F3-PERSONAL',record:true,asset:null});
    expect(next(restored).events).toEqual(['F3']);
    expect(install.diagnostics).toEqual(f2);
    expect(()=>advanceFour(restored,'A04-S01/INSTALL/NEXT',install.revision)).toThrow('STALE_REVISION');
    expect(()=>advanceFour(restored,'A04-S01/INSTALL/NEXT',restored.revision)).toThrow('ACTION_NOT_ALLOWED');
    const review=advanceFour(restored,viewFour(restored).actions.find(a=>a.kind==='PREVIOUS')!.id,restored.revision);
    expect(viewFour(review).actions[0].kind).toBe('CONTINUE');
    const returned=next(review);
    expect(returned.events).toEqual(['F3']);
    expect(returned.diagnostics).toEqual(FINAL_RESTORATION);
    expect(returned.reviewStepId).toBeNull();
  });
  it.each(['pt-BR','en'] as const)('walks the complete chapter in %s without revealing future assets or events',locale=>{
    let s=start(locale);
    const assets=new Set<string>();
    const ids:string[]=[];
    const events:string[]=[];
    for(let i=0;i<100;i++){
      const v=viewFour(s);
      if(v.stepId==='A04-S02/FB-A4') expect(v.text).toBe(locale==='pt-BR'?'FORTE IMPACTO. MEMÓRIA COMPROMETIDA. ERRO. ERRO. MEMBROS DANIFICADOS. ERRO. ERRO. ERRO.':'HEAVY IMPACT. MEMORY COMPROMISED. ERROR. ERROR. LIMBS DAMAGED. ERROR. ERROR. ERROR.');
      if(v.stepId==='A04-S02/L07') expect(v.text).toBe(locale==='pt-BR'?'Eu sinto muito, AMI.':'I’m so sorry, AMI.');
      if(v.stepId==='A04-S02/FB-A3-IMAGE') expect(v.text).toBe('');
      else expect(v.text.trim()).not.toBe('');
      if(v.stepId==='A04-S02/FB-A1/01') expect(v.asset).toBeNull();
      if(v.stepId==='A04-S02/FB-A1/02') expect(v).toMatchObject({asset:'CENA-08',cue:'crt-reveal'});
      if(v.stepId==='A04-S02/FB-A3-IMAGE') expect(v).toMatchObject({asset:'CENA-12',cue:'crt-startle'});
      if(v.stepId==='A04-S02/F09') expect(v).toMatchObject({asset:'CENA-11',cue:'disoriented'});
      ids.push(v.stepId);
      if(v.asset) assets.add(v.asset);
      if(v.stepId.startsWith('A04-S01/MANUAL-')){
        expect(v.record).toBe(true);
        expect(s.events).toContain('F3');
      }
      if(v.asset==='CENA-08'||v.asset==='CENA-12')expect(s.events).toContain('F3');
      if(v.asset==='CENA-11')expect(s.events).toContain('MEM-D4');
      for(const e of s.events)if(!events.includes(e))events.push(e);
      if(s.stepId===CHAPTER_FIVE_BOUNDARY)break;
      s=next(s);
    }
    expect(s.stepId).toBe(CHAPTER_FIVE_BOUNDARY);
    expect(s.diagnostics).toEqual(FINAL_RESTORATION);
    expect(events).toEqual(['F3','E-FAMILY','MEM-D4','FB-D4','FB-D5','E-BETRAYAL','E-PAST-RESTORED']);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...assets].sort()).toEqual(['CENA-08','CENA-11','CENA-12']);
    expect(viewFour(s).actions.map(a=>a.kind)).toEqual(['PREVIOUS']);
  });
  it('preserves a serialized save and projects the same reached beat in either language',()=>{
    const reached=until(start(),'A04-S02/FB-A1/01');
    const saved=JSON.parse(JSON.stringify(reached)) as ChapterFourProgress;
    expect(viewFour(saved)).toEqual(viewFour(reached));
    expect(viewFour(saved).speaker).toBe('CRIANÇA');
    expect(viewFour({...saved,locale:'en'}).speaker).toBe('CHILD');
    expect(viewFour({...saved,locale:'en'}).asset).toBeNull();
    expect(viewFour(next(saved))).toMatchObject({asset:'CENA-08',cue:'crt-reveal'});
    expect(saved.events).toEqual(['F3']);
  });
});
