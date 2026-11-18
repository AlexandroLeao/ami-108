import { advanceNarrative, changeNarrativeLocale, currentAsset, projectNarrative, startNarrative, type NarrativeState } from '../src/narrative/engine';
import { CHAPTER_ONE, type Locale } from '../src/narrative/catalog';
import { ARRIVAL_MEMORY, LAB_RECORDS } from '../src/narrative/chapter-three-catalog';

const step = (s: NarrativeState, action = projectNarrative(s).actions[0].id, rng = () => 0.9) => advanceNarrative(s, action, s.revision, rng);
function reach(s: NarrativeState, predicate: (s: NarrativeState) => boolean, limit = 200): NarrativeState {
  for (let i=0; i<limit && !predicate(s); i++) s = step(s);
  if (!predicate(s)) throw new Error('Unreached state: ' + s.stepId);
  return s;
}
function chapter3(locale: Locale = 'pt-BR') {
  let s = startNarrative(locale);
  for (let i=0; i<=CHAPTER_ONE.length; i++) s = step(s);
  s = reach(s, x => projectNarrative(x).phase === 'ENCOUNTER');
  s = step(s, 'DOG-04');
  return reach(s, x => x.stepId === 'A03-S01/CHAPTER_CARD');
}
function ratDecision(s = chapter3()) {
  return reach(s, x => x.stepId.startsWith('A03-S02/DECISION-'));
}
function consult(s: NarrativeState, rng: () => number) {
  const action = projectNarrative(s).actions.find(x => x.kind === 'CONSULT')!;
  return reach(step(s, action.id, rng), x => x.stepId.startsWith('A03-S02/DECISION-'));
}
describe('Chapter 3 integrated progression', () => {
  it.each(['pt-BR','en'] as const)('plays all archive and memory beats in %s without spoilers or energy cost', locale => {
    let s = chapter3(locale);
    expect(projectNarrative(s).actions[0].kind).toBe('CONTINUE');
    expect(currentAsset(s)).toBeNull();
    s = step(s);
    expect(s.stepId).toBe('A03-S01/PRE-01');
    expect(currentAsset(s)).toBeNull();
    s=reach(s,x=>x.stepId==='A03-S01/L01');
    expect(currentAsset(s)).toBe('CENA-06');
    expect(projectNarrative(s)).toMatchObject({chapter:3,cue:'fade-in'});
    s = reach(s, x => x.stepId === 'A03-S01/L05');
    expect(projectNarrative(s).actions[0].kind).toBe('INTERACT');
    s = step(s);
    expect(s.stepId).toBe('A03-S01/CONNECT-01');
    s=reach(s,x=>x.stepId==='A03-S01/LAB-01');
    for (const record of LAB_RECORDS) {
      expect(s.stepId).toBe('A03-S01/'+record.id);
      expect(projectNarrative(s)).toMatchObject({text:record.text[locale],speaker:null,narration:false,cue:'archive-record'});
      expect(currentAsset(s)).toBeNull();
      expect(s.diagnostics?.energy).toBe(3);
      s = step(s);
    }
    expect(s.stepId).toBe('A03-S01/L06a');
    expect(projectNarrative(s)).toMatchObject({cue:'fade-in',asset:{url:'/api/game/asset?key=CENA-06'}});
    s = reach(s, x => x.stepId === 'A03-S01/F01');
    expect(projectNarrative(s).speaker).toBe(locale === 'pt-BR' ? 'Voz familiar' : 'Familiar voice');
    expect(currentAsset(s)).toBeNull();
    expect(s.events).not.toContain('E-PARTNER');
    for (const beat of ARRIVAL_MEMORY) {
      expect(s.stepId).toBe('A03-S01/' + beat.id);
      expect(projectNarrative(s)).toMatchObject({phase:'FLASHBACK',text:beat.text[locale],cue:beat.id==='F09'?'name-reveal':'memory-shiver',asset:null});
      if (beat.id==='F09') expect(projectNarrative(s).speaker).toBe('HOWARD');
      s=step(s);
    }
    expect(s.stepId).toBe('A03-S01/RETURN-00');
    expect(projectNarrative(s)).toMatchObject({cue:'wake',text:'...'});
    expect(currentAsset(s)).toBe('CENA-06');
    expect(s.events).toEqual(expect.arrayContaining(['E-ARCHIVE','MEM-D3','FB-D3','E-PLANET','E-PARTNER']));
    s=reach(s,x=>x.stepId==='A03-S01/RETURN-02');
    const bridge = [
      ['RETURN-02','Sua memória também está progredindo, Bobo.','Your memory is progressing too, Bobo.'],
      ['RETURN-02b','Devemos prosseguir. Pode haver um arquivo central.','We must proceed. There may be a central archive.'],
      ['RETURN-02c','Lá, talvez eu possa restaurar mais dos meus arquivos.','There, I may be able to restore more of my files.'],
    ] as const;
    for (const [id,pt,en] of bridge) {
      expect(s.stepId).toBe('A03-S01/'+id);
      expect(projectNarrative(s)).toMatchObject({speaker:'AMI-108',text:locale==='pt-BR'?pt:en,cue:'none',asset:{url:'/api/game/asset?key=CENA-06'}});
      s=step(s);
    }
    expect(s.stepId).toBe('A03-S01/EXIT-01');
    expect(projectNarrative(s)).toMatchObject({cue:'fade-black',asset:null});
    s=step(s);
    expect(s.stepId).toBe('A03-S01/EXIT-01b');
    expect(projectNarrative(s)).toMatchObject({cue:'none',asset:null});
    s=reach(s,x=>x.stepId==='A03-S02/L01');
    const ratArt=projectNarrative(s).asset;
    expect(projectNarrative(s)).toMatchObject({cue:'startle',asset:{url:'/api/game/asset?key=CENA-07'}});
    s=step(s);
    expect(projectNarrative(s)).toMatchObject({cue:'none',asset:ratArt});
    const ratLines = [
      ['L02','AMI-108','Aparentemente.','Apparently.'],
      ['L03','DAVID','Aparentemente?','Apparently?'],
      ['L04','AMI-108','Suas dimensões excedem consideravelmente os parâmetros habituais.','Its dimensions considerably exceed the usual parameters.'],
      ['L05','DAVID','É. Eu percebi.','Yeah. I noticed.'],
    ] as const;
    for (const [id,speaker,pt,en] of ratLines) {
      expect(s.stepId).toBe('A03-S02/'+id);
      expect(projectNarrative(s)).toMatchObject({speaker,text:locale==='pt-BR'?pt:en,cue:'none',asset:ratArt});
      s=step(s);
    }
    expect(s.stepId).toBe('A03-S02/WARNING');
    expect(projectNarrative(s)).toMatchObject({narration:true,asset:ratArt,cue:'none'});
    s = ratDecision(s);
    expect(currentAsset(s)).toBe('CENA-07');
    expect(s.chapterThree?.checkpoint?.diagnostics).toEqual({ energy:3,med:35,bio:42,hist:53,personal:5,personalUnlocked:false });
    expect(projectNarrative(s).actions.filter(x => x.kind === 'CHOOSE')).toHaveLength(4);
    expect(projectNarrative(s).actions.some(x => x.kind === 'PREVIOUS')).toBe(false);
  });
  it.each(['pt-BR','en'] as const)('projects each rat choice and its own consequence in %s', locale => {
    const s=ratDecision(chapter3(locale));
    const choices=[
      ['RAT-01','Ativar o sistema de emissão ultrassônica.','Activate the ultrasonic emission system.','A criatura ignora o estímulo e ataca David quando ele tenta atravessar.','The creature ignores the stimulus and attacks David as he tries to cross.','DEAD'],
      ['RAT-02','Ativar a iluminação de contenção.','Activate the containment lighting.','A luz intensa força a criatura a recuar para o abrigo escuro. David atravessa.','Intense light forces the creature into its dark shelter. David crosses.','SUCCESS'],
      ['RAT-03','Acionar a ventilação de emergência.','Activate the emergency ventilation.','O fluxo de ar não afasta o organismo; David é atacado.','The airflow does not drive the organism away; David is attacked.','DEAD'],
      ['RAT-04','Atravessar pelo corredor mantendo silêncio.','Cross the corridor in silence.','O rato detecta sua presença, mesmo em silêncio, e ataca.','The rat detects your presence, even in silence, and attacks.','DEAD'],
    ] as const;
    expect(projectNarrative(s).actions.filter(action=>action.kind==='CHOOSE').map(action=>({id:action.id,label:action.label}))).toEqual(choices.map(([id,pt,en])=>({id,label:locale==='pt-BR'?pt:en})));
    for(const [id,,,pt,en,outcome] of choices) {
      const next=step(s,id);
      expect(next.chapterThree?.rat?.phase).toBe(outcome);
      expect(projectNarrative(next)).toMatchObject({text:locale==='pt-BR'?pt:en,narration:true,asset:null});
    }
    expect(()=>step(s,'DOG-04')).toThrow('ACTION_NOT_ALLOWED');
  });
  it.each(['RAT-01','RAT-03','RAT-04'])('retries %s and retains immutable slots', id => {
    let s = consult(ratDecision(), () => 0.42);
    const cached = s.chapterThree!.rat!.slots[0];
    s = step(s, id);
    expect(projectNarrative(s).phase).toBe('DEAD');
    expect(currentAsset(s)).toBeNull();
    s = step(step(s));
    expect(s.diagnostics?.energy).toBe(3);
    s = ratDecision(s);
    const rng = jest.fn(() => 0);
    s = consult(s, rng);
    expect(rng).not.toHaveBeenCalled();
    expect(s.chapterThree?.rat?.slots[0]).toEqual(cached);
  });
  it.each([{cat:'NONE',branch:'C'},{cat:'CORRECT',branch:'B'},{cat:'RANDOM',branch:'A'}])('requires F2 with immediate recharge and route after $cat', ({cat,branch}) => {
    let s = ratDecision();
    if(cat !== 'NONE') s=consult(s, () => cat==='CORRECT'?0.4199:0.42);
    s=step(step(s,'RAT-02'));
    expect(s.stepId).toBe('A03-S02/'+branch+'1');
    s=reach(s,x=>x.stepId==='A03-S03/ARRIVAL');
    const arrival=projectNarrative(s);
    expect(arrival).toMatchObject({text:'Vocês seguem adiante até o arquivo central.',narration:true,asset:{url:'/api/game/asset?key=CENA-06'}});
    expect(arrival.actions[0].kind).toBe('CONTINUE');
    expect(projectNarrative(changeNarrativeLocale(s,'en',s.revision)).text).toBe('You proceed to the central archive.');
    expect(s.events).not.toContain('F2');
    const beforeEnergy=s.diagnostics?.energy;
    s=step(s);
    expect(s.stepId).toBe('A03-S03/RESTORE');
    expect(projectNarrative(s)).toMatchObject({text:'AMI identifica o segundo componente em um equipamento compatível.',narration:true,asset:arrival.asset});
    expect(projectNarrative(s).actions[0].kind).toBe('INTERACT');
    expect(s.events).not.toContain('F2');
    expect(s.diagnostics?.energy).toBe(beforeEnergy);
    s=step(s);
    expect(projectNarrative(s).text).toBe('Restauração concluída. Recuperei registros de evacuação.');
    expect(s.diagnostics).toEqual({energy:3,med:75,bio:85,hist:78,personal:5,personalUnlocked:false});
    expect(s.events.filter(x=>x==='F2')).toHaveLength(1);
    s=reach(s,x=>x.stepId==='A03-S03/ROUTE');
    expect(s.events).not.toContain('SOL-02');
    s=step(s);
    expect(s.stepId).toBe('A03-S03/DEPART');
    expect(s.diagnostics?.energy).toBe(3);
    s=reach(s,x=>x.stepId==='A04-S01/CHAPTER_CARD');
    expect(s.events).toEqual(expect.arrayContaining(['F2','E-ESCAPE-ROUTE']));
    expect(projectNarrative(s).chapters?.map(x=>x.number)).toEqual([1,2,3,4]);
    expect(projectNarrative(s).actions.map(x=>x.kind)).toEqual(['CONTINUE','PREVIOUS']);
    expect(()=>step(s,'CHAPTER/RESTART/5')).toThrow('ACTION_NOT_ALLOWED');
    const saved=s.savedRatSlots;
    s=step(s,'CHAPTER/RESTART/3');
    expect(s.stepId).toBe('A03-S01/CHAPTER_CARD');
    expect(s.diagnostics?.bio).toBe(42);
    expect(s.savedRatSlots).toEqual(saved);
    expect(s.unlockedChapter).toBe(4);
    s=step(s,'CHAPTER/RESTART/4');
    expect(s.diagnostics?.bio).toBe(85);
    expect(s.savedRatSlots).toEqual(saved);
  });
  it('resumes retired Chapter 3 beats and restores energy without changing the saved slot', () => {
    let s=ratDecision();
    s=consult(s,()=>0.9);
    s=step(s,'RAT-02');
    s=reach(s,x=>x.stepId==='A03-S03/ROUTE');
    const old={...s,stepId:'A03-S03/SOL-02',diagnostics:{...s.diagnostics!,energy:2 as const},
      chapterThree:{...s.chapterThree!,trail:[...s.chapterThree!.trail,'A03-S03/SOL-02']}};
    expect(projectNarrative(old)).toMatchObject({text:'Ok AMI, vamos nessa.',diagnostics:{energy:3}});
    const resumed=step(old);
    expect(resumed.stepId).toBe('A04-S01/CHAPTER_CARD');
    expect(resumed.savedRatSlots).toEqual(s.savedRatSlots);
    expect(resumed.events).not.toContain('SOL-02');
  });
  it('allows choices at zero and keeps locale/history from rerolling or reapplying events', () => {
    let s=ratDecision();
    for(let i=0;i<3;i++) s=consult(s,()=>0.99);
    expect(s.diagnostics?.energy).toBe(0);
    expect(projectNarrative(s).actions.some(x=>x.kind==='CONSULT')).toBe(false);
    const before=s;
    s=changeNarrativeLocale(s,'en',s.revision);
    expect(s.chapterThree).toBe(before.chapterThree);
    expect(s.diagnostics).toBe(before.diagnostics);
    expect(step(s,'RAT-02').chapterThree?.rat?.phase).toBe('SUCCESS');
  });
});
