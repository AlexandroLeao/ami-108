import { advanceFive, beginFive, FIVE_CARD, viewFive, type ChapterFiveProgress } from '../src/narrative/chapter-five-domain';
import { BOAR } from '../src/narrative/chapter-five-catalog';
import type { Locale } from '../src/narrative/catalog';
import type { Diagnostics } from '../src/narrative/engine';

const restored:Diagnostics={energy:3,med:100,bio:100,hist:100,personal:100,personalUnlocked:true};
const prior=['F3','E-FAMILY','E-PAST-RESTORED','E-ESCAPE-ROUTE'];
const start=(locale:Locale='pt-BR',recipe=false)=>beginFive(restored,prior,locale,0,recipe);
const act=(s:ChapterFiveProgress,id:string)=>advanceFive(s,id,s.revision);
const next=(s:ChapterFiveProgress)=>act(s,viewFive(s).actions.find(a=>a.kind==='CONTINUE'||a.kind==='INTERACT')!.id);
function reach(s:ChapterFiveProgress,id:string){
  for(let i=0;i<80&&s.stepId!==id;i++)s=next(s);
  expect(s.stepId).toBe(id);return s;
}
function consult(s:ChapterFiveProgress){
  const action=viewFive(s).actions.find(a=>a.kind==='CONSULT')!;
  const q=act(s,action.id),answer=next(q);
  expect(viewFive(answer).text).toBe(BOAR.correct[s.locale]);
  return next(answer);
}

describe('Chapter 5 isolated progression',()=>{
  it('requires accepted Chapter 4 restoration and the completed memory journey',()=>{
    expect(()=>beginFive({...restored,energy:2},prior,'en',0,false)).toThrow('CHAPTER_FIVE_NOT_READY');
    expect(()=>beginFive(restored,prior.filter(e=>e!=='E-PAST-RESTORED'),'en',0,false)).toThrow('CHAPTER_FIVE_NOT_READY');
    const s=start();
    expect(s.stepId).toBe(FIVE_CARD);
    expect(viewFive(s).asset).toBeNull();
    expect(()=>act(s,'BOAR-04')).toThrow('ACTION_NOT_ALLOWED');
    expect(()=>advanceFive(s,viewFive(s).actions[0].id,1)).toThrow('STALE_REVISION');
  });
  it('repairs the ship once and creates a checkpoint before the first boar reveal',()=>{
    let s=reach(start(),'A05-S01/L04');
    expect(viewFive(s).actions[0].kind).toBe('INTERACT');
    expect(s.ship.powered).toBe(false);
    s=next(s);
    expect(s.events).toEqual(['E-SHIP']);
    expect(s.ship).toEqual({powered:true,gateOpen:false,enginesOn:false,launched:false});
    s=next(s);
    expect(viewFive(s).asset).toBeNull();
    s=next(s);
    expect(s.stepId).toBe('A05-S01/L06');
    expect(viewFive(s).asset).toBe('CENA-09');
    expect(s.checkpoint).toMatchObject({stepId:s.stepId,diagnostics:restored,ship:s.ship,events:['E-SHIP','CP-BOAR']});
    const back=act(s,s.stepId+'/PREVIOUS');
    expect(viewFive(back).stepId).toBe('A05-S01/L05');
    expect(next(back).events).toEqual(['E-SHIP','CP-BOAR']);
    expect(next(back).checkpoint).toEqual(s.checkpoint);
  });
  it.each(['BOAR-01','BOAR-02','BOAR-03'])('fails %s and restores checkpoint with immutable slots',choice=>{
    let s=reach(start(),'A05-S01/DECISION-0');
    s=consult(s);
    const slots=s.boar!.slots;
    expect(s.diagnostics.energy).toBe(2);
    s=act(s,choice);
    expect(viewFive(s).phase).toBe('DEAD');
    expect(s.events).not.toContain('E-LAUNCH');
    s=next(s);
    expect(viewFive(s).actions.map(a=>a.kind)).toEqual(['RETRY']);
    s=act(s,viewFive(s).actions[0].id);
    expect(s.diagnostics).toEqual(restored);
    expect(s.ship).toEqual(s.checkpoint!.ship);
    expect(s.boar!.slots).toEqual(slots);
    s=consult(reach(s,'A05-S01/DECISION-0'));
    expect(s.boar!.slots).toEqual(slots);
    expect(s.events).toEqual(['E-SHIP','CP-BOAR']);
  });
  it('permits three certain consultations without a recharge or fourth consult',()=>{
    let s=reach(start(),'A05-S01/DECISION-0');
    for(let i=0;i<3;i++){s=consult(s);expect(s.diagnostics.energy).toBe(2-i);}
    expect(viewFive(s).actions.map(a=>a.id)).toEqual(['BOAR-01','BOAR-02','BOAR-03','BOAR-04']);
    s=act(s,'BOAR-04');
    expect(s.ship).toEqual({powered:true,gateOpen:true,enginesOn:true,launched:true});
    expect(s.events).toEqual(['E-SHIP','CP-BOAR','E-LAUNCH']);
    expect(()=>act(s,'BOAR-04')).toThrow('ACTION_NOT_ALLOWED');
    expect(s.diagnostics.energy).toBe(0);
  });
  it.each(['pt-BR','en'] as const)('preserves the single ending and both consulted variants in %s',locale=>{
    for(const recipe of [false,true]){
      let s=reach(start(locale,recipe),'A05-S01/DECISION-0');
      s=act(consult(s),'BOAR-04');
      s=reach(s,'A05-S01/B3');
      expect(viewFive(s).text).toBe(recipe?(locale==='pt-BR'?'Sem receitas de bolo dessa vez.':'No cake recipes this time.'):(locale==='pt-BR'?'Sem bananas dessa vez.':'No bananas this time.'));
      s=reach(s,'A05-S02/L08');
      expect(viewFive(s).text).toBe('...');
      expect(viewFive(s).asset).toBe('CENA-10');
      s=reach(s,'A05-S02/L15');
      expect(viewFive(s).text).toBe(locale==='pt-BR'?'De nada, Bobo.':"You're welcome, Bobo.");
      s=reach(s,'A05-S02/ENDING');
      expect(viewFive(s).asset).toBeNull();
      expect(viewFive(s).text).toBe(locale==='pt-BR'?'CONTINUA...':'TO BE CONTINUED...');
      expect(s.events.filter(e=>e==='E-COMPLETE')).toHaveLength(1);
      const saved=JSON.parse(JSON.stringify(s)) as ChapterFiveProgress;
      expect(viewFive(saved)).toEqual(viewFive(s));
      s=next(saved);
      expect(s.stepId).toBe('A05-S02/CREDITS');
      expect(viewFive(s).actions).toEqual([]);
    }
  });
  it('allows a neutral success without consulting even if recipes were seen earlier',()=>{
    let s=reach(start('en',true),'A05-S01/DECISION-0');
    s=next(act(s,'BOAR-04'));
    expect(viewFive(s).text).toBe('We made it.');
    expect(next(s).stepId).toBe('A05-S01/C2');
    expect(s.diagnostics.energy).toBe(3);
    expect(next(next(s)).stepId).toBe('A05-S02/NAVIGATION');
  });
});
