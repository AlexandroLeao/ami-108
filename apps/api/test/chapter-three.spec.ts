import { advanceNarrative, changeNarrativeLocale, currentAsset, projectNarrative, startNarrative, type NarrativeState } from '../src/narrative/engine';
import { CHAPTER_ONE, type Locale } from '../src/narrative/catalog';
import { LAB_RECORDS } from '../src/narrative/chapter-three-catalog';

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
    s = reach(s, x => x.stepId === 'A03-S01/F09');
    expect(projectNarrative(s)).toMatchObject({speaker:'HOWARD',cue:'name-reveal',asset:null});
    s = step(s);
    expect(s.stepId).toBe('A03-S01/RETURN-00');
    expect(projectNarrative(s)).toMatchObject({cue:'wake',text:'...'});
    expect(currentAsset(s)).toBe('CENA-06');
    expect(s.events).toEqual(expect.arrayContaining(['E-ARCHIVE','MEM-D3','FB-D3','E-PLANET','E-PARTNER']));
    s = ratDecision(s);
    expect(currentAsset(s)).toBe('CENA-07');
    expect(s.chapterThree?.checkpoint?.diagnostics).toEqual({ energy:3,med:35,bio:42,hist:53,personal:5,personalUnlocked:false });
    expect(projectNarrative(s).actions.filter(x => x.kind === 'CHOOSE')).toHaveLength(4);
    expect(projectNarrative(s).actions.some(x => x.kind === 'PREVIOUS')).toBe(false);
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
    s=reach(s,x=>x.stepId==='A03-S03/RESTORE');
    expect(projectNarrative(s).actions[0].kind).toBe('INTERACT');
    expect(s.events).not.toContain('F2');
    s=step(s);
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
    expect(projectNarrative(s).actions.map(x=>x.kind)).toEqual(['PREVIOUS']);
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
