import { BOAR, BOAR_FACTS, BOAR_QUESTION, CHAPTER_FIVE_ASSETS, FINAL_TITLE, HANGAR_DIALOGUE, LAUNCH_CONSULTED, LAUNCH_NO_CONSULT, LAUNCH_NO_RECIPE, ORBIT_DIALOGUE } from '../src/narrative/chapter-five-catalog';
import { chooseEncounter, consultEncounter, retryEncounter, startEncounter } from '../src/narrative/encounter';

describe('Chapter 5 source and guaranteed boar rules',()=>{
  it('preserves the complete bilingual source order and ending',()=>{
    expect(HANGAR_DIALOGUE.map(b=>b.id)).toEqual(Array.from({length:12},(_,i)=>'L'+String(i+1).padStart(2,'0')));
    expect(ORBIT_DIALOGUE.map(b=>b.id)).toEqual(Array.from({length:15},(_,i)=>'L'+String(i+1).padStart(2,'0')));
    expect(ORBIT_DIALOGUE[7].text).toEqual({'pt-BR':'...',en:'...'});
    expect(ORBIT_DIALOGUE[14].text).toEqual({'pt-BR':'De nada, Bobo.',en:"You're welcome, Bobo."});
    expect(BOAR_QUESTION.id).toBe('Q-BOAR');
    expect(LAUNCH_CONSULTED.map(b=>b.id)).toEqual(['B1','B2','B3','B4','B5','B6']);
    expect(LAUNCH_NO_CONSULT.map(b=>b.id)).toEqual(['C1','C2']);
    expect(LAUNCH_NO_RECIPE['pt-BR']).toBe('Sem bananas dessa vez.');
    expect(FINAL_TITLE).toEqual({'pt-BR':'CONTINUA...',en:'TO BE CONTINUED...'});
    expect(CHAPTER_FIVE_ASSETS).toEqual(['CENA-09','CENA-10']);
  });
  it('guarantees all three required facts without any RNG or model',()=>{
    expect(BOAR.probability).toBe(1);
    expect(BOAR_FACTS).toHaveLength(3);
    expect(BOAR.correct['pt-BR']).toMatch(/calor.*portão.*antes de ativar os motores.*partir imediatamente/i);
    expect(BOAR.correct.en).toMatch(/heat.*gate.*before starting the engines.*depart immediately/i);
    const noRandom=()=>{throw Error('BOAR must not draw a random category');};
    let s=startEncounter(BOAR);
    for(let i=0;i<3;i++){
      const r=consultEncounter(s,BOAR,noRandom);
      expect(r.slot).toMatchObject({category:'CORRECT',text:BOAR.correct,recipe:false});
      expect(r.state.energy).toBe(2-i);
      s=r.state;
    }
    expect(()=>consultEncounter(s,BOAR,noRandom)).toThrow('NO_ENERGY');
    const dead=chooseEncounter(s,BOAR,'BOAR-01').state;
    const retry=retryEncounter(dead);
    expect(retry.energy).toBe(3);
    expect(retry.slots).toEqual(s.slots);
    expect(consultEncounter(retry,BOAR,noRandom).slot).toEqual(s.slots[0]);
  });
  it('has exactly three failed strategies and one successful strategy in source order',()=>{
    expect(BOAR.choices.map(c=>c.id)).toEqual(['BOAR-01','BOAR-02','BOAR-03','BOAR-04']);
    expect(BOAR.choices.map(c=>chooseEncounter(startEncounter(BOAR),BOAR,c.id).state.phase)).toEqual(['DEAD','DEAD','DEAD','SUCCESS']);
    expect(chooseEncounter(startEncounter(BOAR),BOAR,'BOAR-04').state.used).toEqual([]);
  });
});
