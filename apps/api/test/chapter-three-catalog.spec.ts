import {
  ARRIVAL_MEMORY, CHAPTER_THREE_GATES, LAB_AFTER_RECORDS, LAB_ENTRY, LAB_RECORDS,
  LAB_RETURN, LAB_TIME, RAT, RAT_ENTRY, RAT_QUESTION, RAT_REACTIONS, RAT_SUCCESS,
  SECOND_FRAGMENT,
} from '../src/narrative/chapter-three-catalog';
import { chooseEncounter, consultEncounter, retryEncounter, startEncounter, successVariant } from '../src/narrative/encounter';

describe('Chapter 3 source catalog — not yet integrated', () => {
  it('retains bilingual ordered records, dialogue and separate memory gates', () => {
    expect(LAB_ENTRY.map(beat => beat.id)).toEqual(['L01','L02','L03','L04','L05']);
    expect(LAB_RECORDS.map(beat => beat.id)).toEqual(['LAB-01','LAB-02','LAB-03','LAB-04','LAB-05']);
    expect(LAB_TIME.text).toEqual({ 'pt-BR': '20 ANOS ATRÁS', en: '20 YEARS AGO' });
    expect(LAB_AFTER_RECORDS.at(-1)?.id).toBe('MEM-D3');
    expect(ARRIVAL_MEMORY.map(beat => beat.id)).toEqual(['F01','F02','F03','F04','F05','F06','F07','F08','F09']);
    expect(ARRIVAL_MEMORY.filter(beat => beat.speaker === 'HOWARD')[0].id).toBe('F07');
    expect(LAB_RETURN.map(beat => beat.id)).toEqual(['RETURN-01','RETURN-02']);
    const all = [...LAB_ENTRY, ...LAB_RECORDS, LAB_TIME, ...LAB_AFTER_RECORDS,
      ...ARRIVAL_MEMORY, ...LAB_RETURN, ...RAT_ENTRY, RAT_QUESTION, ...RAT_REACTIONS,
      ...Object.values(RAT_SUCCESS).flat(), ...SECOND_FRAGMENT];
    for (const beat of all) {
      expect(beat.text['pt-BR'].length).toBeGreaterThan(0);
      expect(beat.text.en.length).toBeGreaterThan(0);
    }
    expect(CHAPTER_THREE_GATES.restoredMemory).toEqual({
      med:75, bio:85, hist:78, personal:5, personalUnlocked:false,
    });
    expect(CHAPTER_THREE_GATES.solar).toBe('SOL-02');
    expect(CHAPTER_THREE_GATES.route).toBe('E-ESCAPE-ROUTE');
  });
  it('keeps biological weakness out of public records and early dialogue', () => {
    const publicText = JSON.stringify([...LAB_ENTRY, ...LAB_RECORDS, ...LAB_AFTER_RECORDS, ...RAT_ENTRY]);
    expect(publicText).not.toMatch(/intolerância à luz intensa|intolerance to intense light|iluminação de contenção|containment lighting/i);
    expect(JSON.stringify(ARRIVAL_MEMORY)).not.toMatch(/traição|betrayal|núcleo|energy core/i);
  });
  it.each([
    ['RAT-01','DEAD'], ['RAT-02','SUCCESS'], ['RAT-03','DEAD'], ['RAT-04','DEAD'],
  ])('uses only the authored outcome for %s', (id, outcome) => {
    const selected = chooseEncounter(startEncounter(RAT), RAT, id);
    expect(selected.choice.outcome).toBe(outcome);
    expect(selected.state.phase).toBe(outcome);
  });
  it('uses 42% and preserves resolved slots across retry, while keeping choices at zero', () => {
    expect(RAT.probability).toBe(0.42);
    let state = startEncounter(RAT);
    state = consultEncounter(state, RAT, () => 0.4199).state;
    state = consultEncounter(state, RAT, () => 0.42).state;
    state = consultEncounter(state, RAT, () => 0.99).state;
    expect(state.used).toEqual(['CORRECT','RANDOM','RANDOM']);
    expect(state.energy).toBe(0);
    expect(() => consultEncounter(state, RAT, () => 0)).toThrow('NO_ENERGY');
    const slots = state.slots;
    state = retryEncounter(chooseEncounter(state, RAT, 'RAT-01').state);
    expect(state.energy).toBe(3);
    const rng = jest.fn(() => 0.99);
    const reused = consultEncounter(state, RAT, rng);
    expect(rng).not.toHaveBeenCalled();
    expect(reused.slot).toEqual(slots[0]);
    expect(reused.state.slots).toEqual(slots);
    expect(successVariant(chooseEncounter(reused.state, RAT, 'RAT-02').state)).toBe('B');
    expect(successVariant(chooseEncounter(startEncounter(RAT), RAT, 'RAT-02').state)).toBe('C');
    expect(successVariant(chooseEncounter(consultEncounter(startEncounter(RAT), RAT, () => 0.9).state, RAT, 'RAT-02').state)).toBe('A');
  });
});
