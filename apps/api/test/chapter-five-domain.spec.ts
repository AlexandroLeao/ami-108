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
  it('keeps the hangar dark until the boar reveal and checkpoints before cell retrieval',()=>{
    let s=start();
    for(const id of ['ENTRY','PANEL','L01','L01a','L01b','L02','L03','APPROACH','NOISE','LOOK']){
      s=next(s);
      expect(s.stepId).toBe('A05-S01/'+id);
      expect(viewFive(s).asset).toBeNull();
      expect(s.ship.powered).toBe(false);
      expect(s.events).toEqual([]);
    }
    s=next(s);
    expect(s.stepId).toBe('A05-S01/L06');
    expect(viewFive(s).text).toBe('Meu Deus...');
    expect(viewFive(s).asset).toBe('CENA-09');
    expect(s.checkpoint).toMatchObject({stepId:s.stepId,diagnostics:restored,ship:{powered:false,gateOpen:false,enginesOn:false,launched:false},events:['CP-BOAR']});
    const back=act(s,s.stepId+'/PREVIOUS');
    expect(viewFive(back).stepId).toBe('A05-S01/LOOK');
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
    expect(s.events).toEqual(['CP-BOAR']);
  });
  it('permits three certain consultations without a recharge or fourth consult',()=>{
    let s=reach(start(),'A05-S01/DECISION-0');
    for(let i=0;i<3;i++){s=consult(s);expect(s.diagnostics.energy).toBe(2-i);}
    expect(viewFive(s).actions.map(a=>a.id)).toEqual(['BOAR-01','BOAR-02','BOAR-03','BOAR-04']);
    s=act(s,'BOAR-04');
    expect(s.ship.powered).toBe(false);
    expect(s.events).toEqual(['CP-BOAR']);
    s=reach(s,'A05-S01/CARRY');
    expect(viewFive(s).actions[0].kind).toBe('INTERACT');
    s=next(s);
    expect(s.ship).toEqual({powered:true,gateOpen:true,enginesOn:false,launched:false});
    expect(s.events).toEqual(['CP-BOAR','E-SHIP']);
    s=next(s);
    expect(s.ship).toEqual({powered:true,gateOpen:true,enginesOn:true,launched:true});
    expect(s.events).toEqual(['CP-BOAR','E-SHIP','E-LAUNCH']);
    expect(()=>act(s,'BOAR-04')).toThrow('ACTION_NOT_ALLOWED');
    expect(s.diagnostics.energy).toBe(0);
  });
  it.each(['pt-BR','en'] as const)('preserves the single ending and revised departure in %s',locale=>{
    for(const recipe of [false,true]){
      let s=reach(start(locale,recipe),'A05-S01/DECISION-0');
      s=act(consult(s),'BOAR-04');
      s=reach(s,'A05-S01/B5');
      expect(viewFive(s).text).toBe(locale==='pt-BR'?'Nada de dicas de casa ou informações aleatórias dessa vez!':'No household tips or random information this time!');
      s=reach(s,'A05-S02/L12');
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
  it('allows the same revised success without consulting',()=>{
    let s=reach(start('en',true),'A05-S01/DECISION-0');
    s=next(act(s,'BOAR-04'));
    expect(viewFive(s).text).toBe('It worked.');
    expect(next(s).stepId).toBe('A05-S01/B2');
    expect(s.diagnostics.energy).toBe(3);
    expect(reach(s,'A05-S02/NAVIGATION').ship.launched).toBe(true);
  });
});
