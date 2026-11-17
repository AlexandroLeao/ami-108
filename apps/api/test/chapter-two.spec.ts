import { CHAPTER_ONE } from '../src/narrative/catalog';
import { advanceNarrative, changeNarrativeLocale, currentAsset, projectNarrative, startNarrative, type NarrativeState } from '../src/narrative/engine';

function step(state: NarrativeState, kind = 'CONTINUE', rng = () => 0.9) {
  const action = projectNarrative(state).actions.find(item => item.kind === kind)!;
  expect(action).toBeDefined();
  return advanceNarrative(state, action.id, state.revision, rng);
}
function forward(state: NarrativeState) {
  return step(state, projectNarrative(state).actions.some(a => a.kind === 'INTERACT') ? 'INTERACT' : 'CONTINUE');
}
function reachDog(locale: 'pt-BR' | 'en' = 'pt-BR') {
  let state = startNarrative(locale);
  for (let i = 0; i <= CHAPTER_ONE.length; i++) state = forward(state);
  for (let i = 0; i < 12 && projectNarrative(state).phase !== 'ENCOUNTER'; i++) state = forward(state);
  return state;
}
function consult(state: NarrativeState, rng: () => number) {
  state = step(state, 'CONSULT', rng);
  expect(projectNarrative(state).speaker).toBe('???');
  state = forward(state);
  expect(projectNarrative(state).speaker).toBe('AMI-108');
  while (projectNarrative(state).phase !== 'ENCOUNTER') state = forward(state);
  return state;
}
function choose(state: NarrativeState, id: string) { return advanceNarrative(state, id, state.revision); }
describe('Chapter 2 integration in pure narrative engine', () => {
  it('starts with three dark narration beats, reveals the dog once and locks decisions', () => {
    let state = startNarrative('pt-BR');
    for (let i = 0; i <= CHAPTER_ONE.length; i++) state = forward(state);
    for (let i = 0; i < 3; i++) {
      expect(projectNarrative(state)).toMatchObject({ asset: null, narration: true });
      state = forward(state);
    }
    expect(projectNarrative(state)).toMatchObject({ cue: 'startle', text: 'Puta merda! O que é aquilo?!' });
    expect(currentAsset(state)).toBe('CENA-04');
    const revealed = projectNarrative(state).asset;
    state = forward(state);
    expect(projectNarrative(state)).toMatchObject({ cue: 'none', text: 'Olha a língua.', asset: revealed });
    for (let i = 0; i < 10 && projectNarrative(state).phase !== 'ENCOUNTER'; i++) state = forward(state);
    expect(projectNarrative(state).actions.some(a => a.kind === 'PREVIOUS')).toBe(false);
  });
  it('restarts only unlocked chapters and keeps high-water access and resolved slots', () => {
    const initial = startNarrative('pt-BR');
    expect(() => choose(initial, 'CHAPTER/RESTART/2')).toThrow('ACTION_NOT_ALLOWED');
    let state = consult(reachDog(), () => 0.9);
    const slot = state.chapterTwo!.dog.slots[0];
    state = choose(state, 'DOG-04');
    for (let i = 0; i < 60 && projectNarrative(state).chapter !== 3; i++) state = forward(state);
    expect(projectNarrative(state).chapters?.map(c => c.number)).toEqual([1,2,3]);
    state = choose(state, 'CHAPTER/RESTART/1');
    expect(state.stepId).toBe('A01-S01/CHAPTER_CARD');
    expect(state.diagnostics).toBeNull();
    expect(projectNarrative(state).chapters?.map(c => c.number)).toEqual([1,2,3]);
    state = choose(state, 'CHAPTER/RESTART/2');
    expect(state.stepId).toBe('A02-S01/CHAPTER_CARD');
    expect(state.diagnostics?.energy).toBe(3);
    for (let i = 0; i < 15 && projectNarrative(state).phase !== 'ENCOUNTER'; i++) state = forward(state);
    const rng = jest.fn(() => 0);
    state = consult(state, rng);
    expect(rng).not.toHaveBeenCalled();
    expect(state.chapterTwo?.dog.slots[0]).toEqual(slot);
    state = consult(state, () => 0);
    const second = state.chapterTwo!.dog.slots[1];
    state = choose(state, 'CHAPTER/RESTART/3');
    expect(state.chapterTwo?.dog.slots[1]).toEqual(second);
    expect(state.stepId).toBe('A03-S01/CHAPTER_CARD');
    expect(state.diagnostics?.bio).toBe(42);
    expect(state.diagnostics?.energy).toBe(3);
    expect(() => choose(state, 'CHAPTER/RESTART/4')).toThrow('ACTION_NOT_ALLOWED');
    state = choose(state, 'CHAPTER/RESTART/2');
    for (let i = 0; i < 15 && projectNarrative(state).phase !== 'ENCOUNTER'; i++) state = forward(state);
    const noReroll = jest.fn(() => 0.99);
    state = consult(state, noReroll);
    state = consult(state, noReroll);
    expect(noReroll).not.toHaveBeenCalled();
    expect(state.chapterTwo?.dog.slots[1]).toEqual(second);
  });
  it.each(['pt-BR','en'] as const)('preserves handoff and four ordered choices in %s', locale => {
    const state = reachDog(locale);
    expect(currentAsset(state)).toBe('CENA-04');
    const view = projectNarrative(state);
    expect(view.phase).toBe('ENCOUNTER');
    expect(view.actions.filter(x => x.kind === 'CHOOSE').map(x => x.id)).toEqual(['DOG-01','DOG-02','DOG-03','DOG-04']);
    expect(JSON.stringify(view)).not.toMatch(/"outcome"|"slots"|"category"/);
    expect(state.events.filter(x => x === 'CP-DOG')).toHaveLength(1);
  });
  it.each(['DOG-01','DOG-02','DOG-03'])('requires explicit retry after %s; cached slots survive', id => {
    let state = consult(reachDog(), () => 0.9);
    const first = state.chapterTwo!.dog.slots[0];
    state = choose(state,id);
    expect(projectNarrative(state).phase).toBe('DEAD');
    expect(state.diagnostics?.energy).toBe(2);
    state = forward(state);
    expect(projectNarrative(state).text).toBe('VOCÊ NÃO SOBREVIVEU');
    state = step(state,'RETRY');
    expect(state.diagnostics?.energy).toBe(3);
    expect(state.chapterTwo?.dog.slots[0]).toEqual(first);
    for(let i=0;i<12 && projectNarrative(state).phase!=='ENCOUNTER';i++) state=forward(state);
    const rng=jest.fn(()=>0);
    state=consult(state,rng);
    expect(rng).not.toHaveBeenCalled();
    expect(state.diagnostics?.energy).toBe(2);
  });
  it.each([{category:'NONE',variant:'C'},{category:'CORRECT',variant:'B'},{category:'RANDOM',variant:'A'}])('completes F1 with immediate recharge, memory and name for $category', ({category,variant}) => {
    let state=reachDog();
    if(category!=='NONE') state=consult(state,()=>category==='CORRECT'?0:0.9);
    state=choose(state,'DOG-04');state=forward(state);
    expect(state.stepId).toBe('A02-S01/'+variant+'1');
    let count=0;
    while(state.stepId!=='A02-S02/ARRIVAL-01' && count++<30) state=forward(state);
    for (const text of ['Vocês chegam ao terminal de manutenção indicado por AMI.', 'Você retira AMI da mochila e o posiciona junto ao painel.', 'Você observa AMI se conectar ao sistema enquanto emite breves sons eletrônicos.']) {
      expect(projectNarrative(state)).toMatchObject({ text, asset: null, narration: true });
      state=forward(state);
    }
    expect(projectNarrative(state)).toMatchObject({ speaker: 'AMI-108', text: 'Encontrado.', cue: 'none', asset: null });
    expect(currentAsset(state)).toBeNull();
    state=forward(state);
    expect(projectNarrative(state)).toMatchObject({ speaker: 'AMI-108', text: 'Identifiquei uma unidade compatível com meu sistema de armazenamento.', cue: 'fade-in', asset: { url: '/api/game/asset?key=CENA-05' } });
    const terminalArtwork = projectNarrative(state).asset;
    state=forward(state);
    expect(projectNarrative(state)).toMatchObject({ cue: 'none', asset: terminalArtwork });
    while(state.stepId!=='A02-S02/L04' && count++<30) state=forward(state);
    expect(state.stepId).toBe('A02-S02/L04');
    expect(state.diagnostics).toEqual({energy:3,med:35,bio:42,hist:53,personal:5,personalUnlocked:false});
    expect(projectNarrative(state).text).toBe('Então vai parar de falar coisas aleatórias?');
    expect(projectNarrative(changeNarrativeLocale(state, 'en', state.revision)).text).toBe("So you'll stop saying random things?");
    while(state.stepId!=='A02-S02/L08' && count++<45) state=forward(state);
    expect(state.diagnostics?.energy).toBe(3);
    expect(state.events).not.toContain('SOL-01');
    state=forward(state);
    expect(state.stepId).toBe('A02-S02/MEM-D2-PAIN');
    expect(state.events).toContain('MEM-D2');
    expect(state.diagnostics?.energy).toBe(3);
    const expected = [
      { text: 'Ai!', speaker: '???', cue: 'blink-black' },
      { text: 'Minha cabeça de novo!', speaker: '???', cue: 'memory-shiver' },
      { text: '...', speaker: null, cue: 'none', narration: false },
      { text: 'Sinto muito...', speaker: 'Voz familiar', cue: 'memory-shiver' },
      { text: 'David...', speaker: 'Voz familiar', cue: 'memory-shiver' },
      { text: 'Bobo? Está tudo bem?', speaker: 'AMI-108', cue: 'none' },
    ];
    for (const beat of expected) {
      expect(projectNarrative(state)).toMatchObject({ ...beat, asset: null });
      state=forward(state);
    }
    expect(projectNarrative(state)).toMatchObject({ text: 'Você está apresentando sinais de desconforto.', speaker: 'AMI-108', cue: 'wake', asset: {url: '/api/game/asset?key=CENA-05'} });
    while(state.stepId!=='A02-S02/L18' && count++<70) state=forward(state);
    expect(projectNarrative(state)).toMatchObject({ text: 'Tinha alguém falando comigo...', speaker: '???' });
    expect(state.events).not.toContain('E-NAME');
    state=forward(state);
    expect(projectNarrative(state)).toMatchObject({ text: 'E disse o meu nome...', speaker: '???' });
    state=forward(state);
    expect(projectNarrative(state)).toMatchObject({ text: 'David... eu me lembro, esse é o meu nome.', speaker: 'DAVID', cue: 'name-reveal' });
    expect(state.events.filter(event => event === 'E-NAME')).toHaveLength(1);
    const translated = changeNarrativeLocale(state, 'en', state.revision);
    expect(projectNarrative(translated)).toMatchObject({ speaker: 'DAVID', cue: 'name-reveal' });
    expect(projectNarrative(forward(translated)).cue).toBe('none');
    while(state.stepId!=='A03-S01/CHAPTER_CARD' && count++<90) state=forward(state);
    expect(projectNarrative(state)).toMatchObject({chapter:3,phase:'CHAPTER_CARD',asset:null});
    expect(projectNarrative(state).actions.map(x=>x.kind)).toEqual(['CONTINUE','PREVIOUS']);
    expect(state.events.filter(x=>x==='F1')).toHaveLength(1);
    expect(state.events).not.toContain('SOL-01');
  });
  it('resumes a legacy solar-dialogue save at the memory without a new debit', () => {
    let state=consult(reachDog(),()=>0.9);
    state=choose(state,'DOG-04');
    while(state.stepId!=='A02-S02/L08') state=forward(state);
    const old={...state,stepId:'A02-S02/L09',diagnostics:{...state.diagnostics!,energy:2 as const},
      chapterTwo:{...state.chapterTwo!,trail:[...state.chapterTwo!.trail,'A02-S02/L08b','A02-S02/L09']}};
    expect(projectNarrative(old)).toMatchObject({text:'Ai!',cue:'blink-black',diagnostics:{energy:3}});
    const next=forward(old);
    expect(next.stepId).toBe('A02-S02/MEM-D2');
    expect(next.events).toContain('MEM-D2');
    expect(next.chapterTwo?.dog.slots).toEqual(state.chapterTwo?.dog.slots);
    expect(next.chapterTwo?.trail).not.toContain('A02-S02/L09');
  });
  it('never replays consultation on locale change or history review and permits choice at zero', () => {
    let state=reachDog();
    for(let i=0;i<3;i++) state=consult(state,()=>0.9);
    expect(state.diagnostics?.energy).toBe(0);
    expect(projectNarrative(state).actions.some(x=>x.kind==='CONSULT')).toBe(false);
    const before=state;
    expect(projectNarrative(state).actions.some(x=>x.kind==='PREVIOUS')).toBe(false);
    expect(()=>advanceNarrative(state,state.stepId+'/PREVIOUS',state.revision)).toThrow('ACTION_NOT_ALLOWED');
    state=changeNarrativeLocale(state,'en',state.revision);
    expect(state.chapterTwo).toBe(before.chapterTwo);
    expect(state.diagnostics).toBe(before.diagnostics);
    expect(choose(state,'DOG-04').chapterTwo?.dog.phase).toBe('SUCCESS');
  });
});
