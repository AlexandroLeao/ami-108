import { BOAR, BOAR_FACTS, BOAR_QUESTION, CHAPTER_FIVE_ASSETS, FINAL_TITLE, HANGAR_DIALOGUE, LAUNCH_DIALOGUE, HANGAR_NARRATION, ORBIT_DIALOGUE } from '../src/narrative/chapter-five-catalog';
import { chooseEncounter, consultEncounter, retryEncounter, startEncounter } from '../src/narrative/encounter';

describe('Chapter 5 source and guaranteed boar rules',()=>{
  it('preserves the complete bilingual source order and ending',()=>{
    expect(HANGAR_DIALOGUE.map(b=>b.id)).toEqual(['L01','L01a','L01b','L02','L03','L06','L06b','L07','L07b','L08','L08b','L09','L10','L11','L12']);
    expect(ORBIT_DIALOGUE.map(b=>b.id)).toEqual(Array.from({length:15},(_,i)=>'L'+String(i+1).padStart(2,'0')).filter(id=>id!=='L08'));
    expect(ORBIT_DIALOGUE.find(b=>b.id==='L09')?.text['pt-BR']).toBe('Afirmativo.');
    expect(ORBIT_DIALOGUE.find(b=>b.id==='L12')?.text).toEqual({'pt-BR':'...',en:'...'});
    expect(ORBIT_DIALOGUE.at(-1)!.text).toEqual({'pt-BR':'De nada, Bobo.',en:"You're welcome, Bobo."});
    expect(BOAR_QUESTION.id).toBe('Q-BOAR');
    expect(LAUNCH_DIALOGUE.map(b=>b.id)).toEqual(['B1','B2','B3','B4','B5','B6','B7']);
    expect(HANGAR_NARRATION.ENTRY['pt-BR']).toMatch(/^Você e AMI.*naves abandonadas.*destruídas/);
    expect(HANGAR_NARRATION.PANEL['pt-BR']).toContain('registros e diagnósticos das naves');
    expect(HANGAR_DIALOGUE.slice(0,3).map(b=>b.text['pt-BR'])).toEqual([
      'Identifiquei uma nave de emergência com a estrutura intacta.',
      'Ela está no setor de decolagem, do outro lado do hangar. Podemos utilizá-la para sair do planeta.',
      'Porém, o circuito de alimentação necessita de uma célula de reposição.',
    ]);
    expect(HANGAR_DIALOGUE[4].text['pt-BR']).toContain('depósito do setor de manutenção');
    expect(HANGAR_NARRATION.APPROACH['pt-BR']).toContain('entrada do setor de manutenção');
    expect(BOAR.choices[3].consequence['pt-BR']).toContain('caminho até o depósito');
    expect(HANGAR_NARRATION.FIND['pt-BR']).toContain('depósito de manutenção');
    expect(HANGAR_NARRATION.CARRY['pt-BR']).toContain('setor de decolagem');
    expect(LAUNCH_DIALOGUE[4].text['pt-BR']).toBe('Nada de dicas de casa ou informações aleatórias dessa vez!');
    expect(FINAL_TITLE).toEqual({'pt-BR':'CONTINUA...',en:'TO BE CONTINUED...'});
    expect(CHAPTER_FIVE_ASSETS).toEqual(['CENA-09','CENA-10']);
  });
  it('guarantees all required facts without any RNG or model',()=>{
    expect(BOAR.probability).toBe(1);
    expect(BOAR_FACTS).toHaveLength(4);
    expect(BOAR.correct['pt-BR']).toMatch(/calor.*aquecedor.*afastar.*portão.*antes de ativar os motores/i);
    expect(BOAR.correct.en).toMatch(/heat.*heater.*move away.*gate.*before starting the engines/i);
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
