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
    state = forward(state);
    expect(projectNarrative(state).cue).toBe('none');
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
  it.each([{category:'NONE',variant:'C',recipe:false},{category:'CORRECT',variant:'B',recipe:false},{category:'RANDOM',variant:'A',recipe:true}])('completes F1, SOL-01, memory and name for $category', ({category,variant,recipe}) => {
    let state=reachDog();
    if(category!=='NONE') state=consult(state,()=>category==='CORRECT'?0:0.9);
    state=choose(state,'DOG-04');state=forward(state);
    expect(state.stepId).toBe('A02-S01/'+variant+'1');
    let count=0;
    while(state.stepId!=='A02-S02/L04' && count++<30) state=forward(state);
    expect(state.stepId).toBe('A02-S02/L04');
    expect(state.diagnostics).toEqual({energy:category==='NONE'?3:2,med:35,bio:42,hist:53,personal:5,personalUnlocked:false});
    expect(projectNarrative(state).text).toContain(recipe?'bolo':'bananas');
    while(state.stepId!=='A02-S02/F01' && count++<60) state=forward(state);
    expect(currentAsset(state)).toBeNull();
    expect(projectNarrative(state).text).toBe('Sinto muito, David...');
    expect(state.diagnostics?.energy).toBe(3);
    while(state.stepId!=='A02-S02/L18' && count++<70) state=forward(state);
    expect(projectNarrative(state).speaker).toBe('DAVID');
    expect(state.events).toContain('E-NAME');
    while(state.stepId!=='A03-S01/CHAPTER_CARD' && count++<90) state=forward(state);
    expect(projectNarrative(state)).toMatchObject({chapter:3,phase:'CHAPTER_CARD',asset:null});
    expect(projectNarrative(state).actions.map(x=>x.kind)).toEqual(['PREVIOUS']);
    expect(state.events.filter(x=>x==='F1')).toHaveLength(1);
    expect(state.events.filter(x=>x==='SOL-01')).toHaveLength(1);
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
